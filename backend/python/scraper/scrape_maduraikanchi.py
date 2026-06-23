"""
scrape_maduraikanchi.py
-----------------------
Scrapes all sections of Maduraikanchi from sangathamizh.com.

The poem has 782 lines divided into ~62 thematic sections, each on its own
sub-page. Per section we collect:
  - sectionNumber, title, lineRange (start/end)
  - sangamTamil  — the spaced/readable form of the original text
  - urai         — the site's modern Tamil prose translation (பொருளுரை)

Usage:
    python -m scraper.scrape_maduraikanchi [--out-dir PATH]
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "http://www.sangathamizh.com"
INDEX_URL = f"{BASE_URL}/10paddu/10paddu-mathuraikaanchi-மதுரைக்காஞ்சி.html"
SECTION_BASE = f"{BASE_URL}/10paddu/mathuraikaanchi/"

RAW_DIR = Path(__file__).parents[3] / "data" / "texts" / "maduraikanchi" / "raw"

HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}


def fetch(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return BeautifulSoup(resp.text, "lxml")


def get_section_urls(index_soup: BeautifulSoup) -> list[tuple[int, str]]:
    """Return [(section_number, full_url), ...] from the index page."""
    urls = []
    mob = index_soup.find("div", id="centerContentMob")
    if not mob:
        return urls
    for a in mob.find_all("a", href=True):
        href = a["href"]
        # href like: mathuraikaanchi/mathuraikaanchi-மதுரைக்காஞ்சி01.html
        m = re.search(r"மதுரைக்காஞ்சி(\d+)\.html", href)
        if m:
            num = int(m.group(1))
            full = f"{BASE_URL}/10paddu/{href}"
            urls.append((num, full))
    return sorted(urls)


def clean_verse_text(div) -> str:
    """Extract verse lines from div#p1, stripping line-number markers."""
    if not div:
        return ""
    # Replace <br> with newline, get text
    for br in div.find_all("br"):
        br.replace_with("\n")
    raw = div.get_text()
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        # Remove trailing line-number markers like ". . . .[05]"
        line = re.sub(r"\.\s*\.\s*\.\s*\.\s*\[\d+.*?\]", "", line).strip()
        line = re.sub(r"\[\d+\s*-\s*\d+\]", "", line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def parse_line_range(h2_text: str) -> tuple[int, int]:
    """Parse 'பாடல் வரிகள்:- 001 - 013' → (1, 13)."""
    m = re.search(r"(\d+)\s*[-–]\s*(\d+)", h2_text or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 0


def scrape_section(section_num: int, url: str) -> dict:
    soup = fetch(url)
    center = soup.find("div", id="centerContent")

    # Title and line range
    title_div = soup.find("div", class_="head-title2")
    title = title_div.find("h1").get_text(strip=True) if title_div else ""
    h2 = title_div.find("h2").get_text(strip=True) if title_div else ""
    line_start, line_end = parse_line_range(h2)

    # Verse text from div#p1
    p1 = center.find("div", id="p1") if center else None
    sangam_text = clean_verse_text(p1)

    # Urai: the paragraph that follows an h4 containing பொருளுரை
    urai = ""
    if center:
        h4 = center.find("h4")
        if h4:
            p = h4.find_next_sibling("p")
            if p:
                urai = p.get_text(separator=" ", strip=True)

    return {
        "sectionNumber": section_num,
        "title": title,
        "lineStart": line_start,
        "lineEnd": line_end,
        "sangamTamil": sangam_text,
        "urai": urai or None,
        "english": None,
        "source": url,
        "poem": "maduraikanchi",
        "verified": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Maduraikanchi sections")
    parser.add_argument("--out-dir", type=Path, default=RAW_DIR)
    args = parser.parse_args()

    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Fetching index: {INDEX_URL}")
    index_soup = fetch(INDEX_URL)
    section_urls = get_section_urls(index_soup)
    print(f"Found {len(section_urls)} sections")

    for sec_num, url in section_urls:
        out_file = out_dir / f"section_{sec_num:03d}.json"
        if out_file.exists():
            print(f"  [{sec_num:02d}] already scraped, skipping")
            continue
        print(f"  [{sec_num:02d}] {url}")
        try:
            data = scrape_section(sec_num, url)
            out_file.write_text(
                json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            time.sleep(0.8)
        except Exception as exc:
            print(f"    ERROR: {exc}")

    print(f"\nDone. Raw sections saved to {out_dir}")


if __name__ == "__main__":
    main()
