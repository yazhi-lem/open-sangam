"""
scrape_maduraikanchi.py
-----------------------
Scrapes the Maduraikanchi text from sangathamizh.com (or a local HTML mirror)
and saves raw verse data as JSON under data/texts/maduraikanchi/raw/.

Usage:
    python -m scraper.scrape_maduraikanchi [--url URL] [--out-dir PATH]
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

DEFAULT_URL = "https://www.sangathamizh.com/maduraikanchi/"
RAW_DIR = Path(__file__).parents[3] / "data" / "texts" / "maduraikanchi" / "raw"

HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}


def fetch_page(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return BeautifulSoup(resp.text, "lxml")


def parse_verses(soup: BeautifulSoup) -> list[dict]:
    """
    Extract verse blocks from the page.
    Adjust the CSS selector to match the actual site structure.
    Returns a list of raw verse dicts:
        { number, sangamTamil, lines }
    """
    verses = []
    # TODO: inspect sangathamizh.com DOM and update selector
    verse_blocks = soup.select("div.verse, p.verse, .poem-line")

    for i, block in enumerate(verse_blocks, start=1):
        text = block.get_text(separator="\n").strip()
        if not text:
            continue
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        verses.append(
            {
                "number": i,
                "sangamTamil": "\n".join(lines),
                "lines": lines,
                "source": "sangathamizh.com",
            }
        )

    return verses


def save_raw(verses: list[dict], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for verse in verses:
        filename = out_dir / f"verse_{verse['number']:04d}.json"
        filename.write_text(json.dumps(verse, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(verses)} raw verses to {out_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Maduraikanchi verses")
    parser.add_argument("--url", default=DEFAULT_URL, help="Source URL")
    parser.add_argument("--out-dir", type=Path, default=RAW_DIR, help="Output directory")
    args = parser.parse_args()

    print(f"Fetching {args.url} …")
    soup = fetch_page(args.url)
    time.sleep(1)  # be polite

    verses = parse_verses(soup)
    if not verses:
        print("No verses found — check CSS selector in parse_verses()")
        return

    save_raw(verses, args.out_dir)


if __name__ == "__main__":
    main()
