"""
scrape_poem.py
--------------
Generic scraper for any Sangam poem on sangathamizh.com.

Handles two page types:
  - 8thokai: one page per individual poem/verse (numbered 001–NNN)
  - 10paddu: one page per thematic section/passage

Usage:
    python -m scraper.scrape_poem --poem natrinai
    python -m scraper.scrape_poem --poem mullaippattu
    python -m scraper.scrape_poem --poem all          # every poem in registry
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from scraper.registry import POEMS, POEM_BY_ID, TINAI_MAP

BASE_URL = "http://www.sangathamizh.com"
DATA_BASE = Path(__file__).parents[3] / "data" / "texts"

HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}


# ── HTTP ────────────────────────────────────────────────────────────────────

def fetch(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return BeautifulSoup(resp.text, "lxml")


# ── Link discovery ───────────────────────────────────────────────────────────

def get_sub_page_links(index_soup: BeautifulSoup, poem: dict) -> list[tuple[int, str, str]]:
    """
    Return [(number, full_url, label), ...] for all verse/section sub-pages.
    Works for both 8thokai (scattered links) and 10paddu (centerContentMob).
    """
    subfolder = poem["subfolder"]
    n = poem["num_digits"]
    # Match links like: subfolder/subfolder-tamilname01.html
    #                or: subfolder/subfolder-tamilname001.html
    pattern = re.compile(rf"{re.escape(subfolder)}/[^\"]+\.html$")

    seen = set()
    results = []
    for a in index_soup.find_all("a", href=True):
        href = a["href"]
        if not pattern.search(href):
            continue
        m = re.search(r"(\d{" + str(n) + r",})", href)
        if not m:
            continue
        num = int(m.group(1))
        if num in seen:
            continue
        seen.add(num)
        full_url = f"{BASE_URL}/10paddu/{href}" if poem["collection"] == "10paddu" \
                   else f"{BASE_URL}/8thokai/{href}"
        label = a.get_text(strip=True)
        results.append((num, full_url, label))

    return sorted(results)


# ── Text extraction (shared by both page types) ──────────────────────────────

def clean_verse_text(div) -> str:
    if not div:
        return ""
    for br in div.find_all("br"):
        br.replace_with("\n")
    raw = div.get_text()
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        line = re.sub(r"\.\s*\.\s*\.\s*\.\s*\[\d+.*?\]", "", line).strip()
        line = re.sub(r"\[\d+\s*[-–]\s*\d+\]", "", line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def extract_urai(center) -> str:
    if not center:
        return ""
    h4 = center.find("h4")
    if h4:
        p = h4.find_next_sibling("p")
        if p:
            return p.get_text(separator=" ", strip=True)
    return ""


def extract_poet(center) -> str:
    if not center:
        return ""
    tag = center.find(class_="poetry-name")
    return tag.get_text(strip=True).lstrip("- ").strip() if tag else ""


def parse_line_range(text: str) -> tuple[int, int]:
    m = re.search(r"(\d+)\s*[-–]\s*(\d+)", text or "")
    return (int(m.group(1)), int(m.group(2))) if m else (0, 0)


def resolve_tinai(poem: dict, label: str) -> str:
    """Determine tinai from registry hint and/or link label."""
    ts = poem["tinai_source"]
    if ts in TINAI_MAP:
        return TINAI_MAP[ts]
    # For 8thokai, label looks like "001. குறிஞ்சி" or "001. நெய்தல்"
    for ta_word, schema_val in TINAI_MAP.items():
        if ta_word in label:
            return schema_val
    return "unknown"


# ── Per-page scrape ──────────────────────────────────────────────────────────

def scrape_8thokai_page(num: int, url: str, label: str, poem: dict) -> dict:
    soup = fetch(url)
    center = soup.find("div", id="centerContent")
    p1 = center.find("div", id="p1") if center else None
    sangam = clean_verse_text(p1)
    urai = extract_urai(center)
    poet = extract_poet(center)
    tinai = resolve_tinai(poem, label)

    return {
        "id": f"{poem['id']}_{num:0{poem['num_digits']}d}",
        "poem": poem["id"],
        "number": num,
        "tinai": tinai,
        "sangamTamil": sangam,
        "urai": urai or None,
        "english": None,
        "poet": poet or None,
        "source": url,
        "verified": False,
    }


def scrape_10paddu_page(num: int, url: str, label: str, poem: dict) -> dict:
    soup = fetch(url)
    center = soup.find("div", id="centerContent")

    title_div = soup.find("div", class_="head-title2")
    title = title_div.find("h1").get_text(strip=True) if title_div else label
    h2_text = title_div.find("h2").get_text(strip=True) if title_div else ""
    line_start, line_end = parse_line_range(h2_text)

    p1 = center.find("div", id="p1") if center else None
    sangam = clean_verse_text(p1)
    urai = extract_urai(center)
    tinai = resolve_tinai(poem, label)

    return {
        "id": f"{poem['id']}_{num:0{poem['num_digits']}d}",
        "poem": poem["id"],
        "sectionNumber": num,
        "title": title,
        "lineStart": line_start,
        "lineEnd": line_end,
        "tinai": tinai,
        "sangamTamil": sangam,
        "urai": urai or None,
        "english": None,
        "source": url,
        "verified": False,
    }


# ── Poem-level orchestration ─────────────────────────────────────────────────

def scrape_poem(poem: dict, resume: bool = True) -> None:
    poem_id = poem["id"]
    out_dir = DATA_BASE / poem_id / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  {poem['title_en']} ({poem['title_ta']})")
    print(f"  {poem['index_url']}")

    index_soup = fetch(poem["index_url"])
    links = get_sub_page_links(index_soup, poem)
    if not links:
        print(f"  ⚠ No sub-page links found — skipping")
        return

    print(f"  Found {len(links)} {'verses' if poem['collection'] == '8thokai' else 'sections'}")

    scrape_fn = scrape_8thokai_page if poem["collection"] == "8thokai" else scrape_10paddu_page

    for num, url, label in links:
        out_file = out_dir / f"{'verse' if poem['collection'] == '8thokai' else 'section'}_{num:0{poem['num_digits']}d}.json"
        if resume and out_file.exists():
            continue
        try:
            data = scrape_fn(num, url, label, poem)
            out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  [{num:0{poem['num_digits']}d}] ✓")
        except Exception as exc:
            print(f"  [{num:0{poem['num_digits']}d}] ✗ {exc}")
        time.sleep(0.7)

    print(f"  Done → {out_dir}")


# ── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Sangam poems from sangathamizh.com")
    parser.add_argument(
        "--poem", default="all",
        help="Poem ID from registry, or 'all' to scrape every poem"
    )
    parser.add_argument(
        "--no-resume", action="store_true",
        help="Re-scrape even if raw files already exist"
    )
    args = parser.parse_args()

    if args.poem == "all":
        targets = POEMS
    elif args.poem in POEM_BY_ID:
        targets = [POEM_BY_ID[args.poem]]
    else:
        parser.error(f"Unknown poem '{args.poem}'. Available: {', '.join(POEM_BY_ID)}")

    for poem in targets:
        scrape_poem(poem, resume=not args.no_resume)

    print("\nAll done.")


if __name__ == "__main__":
    main()
