"""
scrape_pathinen.py
------------------
Ingest the first two Pathinenkilkkanakku works from Project Madurai:

  * Thirukkural (1,330 couplets) — Tamil text pmuni0001, English translation
    by G. U. Pope et al. (1886, public domain) pmuni0153.
  * Naladiyar (400 quatrains) — Tamil text pmuni0016, English translation by
    G. U. Pope and F. W. Ellis (1893, public domain) pmuni0711.

Four verses are absent or mislabelled in the HTML editions; they are filled
from the other Project Madurai editions listed in `FALLBACKS` and from the
Internet Archive scan of the same public-domain Naladiyar translation. No
machine translation is involved.

Usage:
    cd backend/python
    python -m scraper.scrape_pathinen --work all
"""

from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
PM_BASE = "https://www.projectmadurai.org/pm_etexts/utf8"

HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}

SOURCES = {
    "thirukkural": {
        "ta": "pmuni0001",
        "en": "pmuni0153",
        "ta_title": "திருக்குறள்",
        "en_title": "Tirukkural",
        "poet": "திருவள்ளுவர்",
        "english_model": "pope-drew-lazarus-ellis-1886",
        "count": 1330,
    },
    "naladiyar": {
        "ta": "pmuni0016",
        "en": "pmuni0711",
        "ta_title": "நாலடியார்",
        "en_title": "Naladiyar",
        "poet": "பல புலவர்கள்",
        "english_model": "pope-ellis-1893",
        "count": 400,
    },
}

# Verses missing or mislabelled in the primary HTML editions. Tamil 1293 is
# supplied from the Parimelazhagar edition; the three English verses are from
# the same public-domain translations (Bharathiyar / Ellis-Pope).
FALLBACKS = {
    "thirukkural": {
        "ta": {
            1293: (
                "கெட்டார்க்கு நட்டாரி லென்பதோ நெஞ்சேநீ",
                "பெட்டாங் கவர்பின் செலல்.",
            )
        },
        "en": {
            77: "Justice burns the loveless form, like the solar blaze the boneless worm.",
            1135: "Palm-ride and pangs of eventide are gifts of the wreath-like bracelet maid.",
        },
    },
    "naladiyar": {
        "ta": {},
        "en": {
            195: (
                "When men speak of ‘good caste’ and ‘bad caste’ it is a mere form "
                "of speech and has no real meaning. Not by possessions made "
                "splendid by ancient glories, but by self-denial, learning, and "
                "energy is caste determined."
            ),
            261: (
                "The bat approaches not the Feronia with its dry stem, though it "
                "be nigh at hand and bear abundant fruit; so, although mean people "
                "are very close at hand, their wealth is not a thing that can be "
                "counted upon."
            ),
        },
    },
}


def fetch(pm_id: str, work: str, force: bool = False) -> str:
    path = DATA_BASE / work / "raw" / f"projectmadurai_{pm_id}.html"
    if path.exists() and not force:
        return path.read_text(encoding="utf-8", errors="ignore")
    url = f"{PM_BASE}/{pm_id}.html"
    print(f"  fetching {url}")
    resp = requests.get(url, headers=HEADERS, timeout=60)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(resp.text, encoding="utf-8")
    return resp.text


def html_lines(raw_html: str) -> list[str]:
    """Extract text lines in file order, without letting BeautifulSoup reorder
    the malformed `<tr>`/`<font>` markup used by Project Madurai."""
    text = re.sub(r"<br\s*/?>", "\n", raw_html, flags=re.I)
    text = re.sub(
        r"</?(?:p|h1|h2|h3|h4|tr|td|th|center|font|em|i|strong|ul|li)\b[^>]*>",
        "\n",
        text,
        flags=re.I,
    )
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    return [line.strip() for line in text.splitlines() if line.strip()]


def _tokens(text: str) -> list[dict]:
    return [
        {"form": word, "root": None, "urichol": None, "etymology": None, "gloss": None}
        for word in text.split()
        if word
    ]


# ── Thirukkural ────────────────────────────────────────────────────────────


def parse_kural_tamil(raw_html: str) -> list[dict]:
    lines = html_lines(raw_html)
    chapter_re = re.compile(r"^(\d+\.\d+(?:\.\d+)?)\.?\s+(.+)$")
    number_re = re.compile(r"\s+(\d{1,4})\s*$")

    records: list[dict] = []
    chapter = None
    buffer: list[str] = []
    started = False

    for line in lines:
        m = chapter_re.match(line)
        if m and not re.search(r"\s\d{1,4}$", line):
            chapter = {"id": m.group(1), "title": m.group(2).strip()}
            buffer = []
            started = True
            continue
        if not started:
            continue
        buffer.append(line)
        m2 = number_re.search(line)
        if not (m2 and len(buffer) >= 2):
            continue
        second = number_re.sub("", line).strip()
        first = buffer[-2]
        if not (
            re.search(r"[\u0B80-\u0BFF]", first)
            and re.search(r"[\u0B80-\u0BFF]", second)
        ):
            continue
        records.append(
            {
                "src": int(m2.group(1)),
                "chapter": chapter,
                "lines": [first, second],
            }
        )
        buffer = []

    # Insert the one verse the Tamil page omits (Kural 1293).
    for index, record in enumerate(records):
        if record["src"] == 1292:
            fallback = FALLBACKS["thirukkural"]["ta"][1293]
            records.insert(
                index + 1,
                {"src": 1293, "chapter": record["chapter"], "lines": list(fallback)},
            )
            break
    return records


def parse_kural_english(raw_html: str) -> dict[int, str]:
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag in soup.find_all(["em", "i", "h3"]):
        tag.decompose()
    lines = [line.strip() for line in soup.get_text("\n").splitlines() if line.strip()]
    number_re = re.compile(r"^(\d{1,4})\.?$")

    blocks: list[tuple[int, str]] = []
    i = 0
    while i < len(lines):
        m = number_re.match(lines[i])
        if not m:
            i += 1
            continue
        number = int(m.group(1))
        j = i + 1
        translation: list[str] = []
        while j < len(lines) and not number_re.match(lines[j]):
            translation.append(lines[j])
            j += 1
        if translation:
            text = " ".join(translation)
            if number == 1330:
                text = text.split(" -------------- ")[0].strip()
            blocks.append((number, text))
        i = j

    # Keep the first occurrence of each verse; the Pope edition has a stray
    # duplicated verse 35 in the chapter tail.
    by_number: dict[int, str] = {}
    for number, text in blocks:
        by_number.setdefault(number, text)
    by_number.update(FALLBACKS["thirukkural"]["en"])
    return by_number


def build_kural() -> list[dict]:
    meta = SOURCES["thirukkural"]
    tamil = parse_kural_tamil(fetch(meta["ta"], "thirukkural"))
    english = parse_kural_english(fetch(meta["en"], "thirukkural"))

    if len(tamil) != meta["count"] or len(english) != meta["count"]:
        raise SystemExit(
            f"Thirukkural parse mismatch: Tamil {len(tamil)}, English {len(english)}, "
            f"expected {meta['count']}"
        )

    page_ta = f"{PM_BASE}/{meta['ta']}.html"
    page_en = f"{PM_BASE}/{meta['en']}.html"
    now = datetime.now(timezone.utc).isoformat()
    records = []
    for index, item in enumerate(tamil, start=1):
        chapter = item["chapter"] or {}
        records.append(
            {
                "id": f"thirukkural_{index:04d}",
                "poem": "thirukkural",
                "number": index,
                "title": chapter.get("title", ""),
                "heading": chapter.get("id", ""),
                "poet": meta["poet"],
                "tinai": "unknown",
                "sangamTamil": "\n".join(item["lines"]),
                "urai": None,
                "english": english[index],
                "englishMeta": {
                    "provider": "projectmadurai",
                    "model": meta["english_model"],
                    "promptVersion": "public-domain-edition",
                    "generatedAt": now,
                    "runId": "pathinen-ingest",
                },
                "lines": [
                    {"lineNumber": n, "text": text, "words": _tokens(text)}
                    for n, text in enumerate(item["lines"], start=1)
                ],
                "culturalNotes": [],
                "audioUrl": None,
                "source": f"{page_ta}; {page_en}",
                "verified": False,
            }
        )
    return records


# ── Naladiyar ──────────────────────────────────────────────────────────────


def parse_naladiyar_tamil(raw_html: str) -> dict[int, dict]:
    lines = html_lines(raw_html)
    verse_re = re.compile(r"^(\d{1,3})\.\s+(.+)$")
    chapter_re = re.compile(r"^(\d+\.\d+)\s+(.+)$")

    chapter = None
    records: dict[int, dict] = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        m = chapter_re.match(line)
        if m:
            chapter = {"id": m.group(1), "title": m.group(2).strip()}
            i += 1
            continue
        m = verse_re.match(line)
        if m and chapter and 1 <= int(m.group(1)) <= 400:
            number = int(m.group(1))
            verse_lines = [m.group(2)]
            j = i + 1
            while j < len(lines) and len(verse_lines) < 4:
                if verse_re.match(lines[j]) or chapter_re.match(lines[j]):
                    break
                if re.search(r"[\u0B80-\u0BFF]", lines[j]):
                    verse_lines.append(lines[j])
                j += 1
            if len(verse_lines) == 4:
                records[number] = {"chapter": chapter, "lines": verse_lines}
                i = j
                continue
        i += 1
    return records


def parse_naladiyar_english(raw_html: str) -> dict[int, str]:
    lines = html_lines(raw_html)
    start = next(
        i
        for i, line in enumerate(lines)
        if "NALADIYAR" in line and "English Translation" in line
    )
    stop = next(
        (
            i
            for i in range(start, len(lines))
            if "பாட்டு முதற்குறிப்பு அகரவரிசை" in lines[i] or lines[i] == "GLOSSARY"
        ),
        len(lines),
    )

    marker = re.compile(r"^(\d{1,3})\.\s*(.*)$")
    chapter_heading = re.compile(
        r"(?:அதிகாரம்\s*)?(\d+)\.\s*([^/]+?)\s*/\s*Ch\.\s*(\d+)\.\s*(.+)"
    )

    english: dict[int, str] = {}
    i = start + 1
    while i < stop:
        line = lines[i]
        if "Ch." in line and chapter_heading.search(line):
            i += 1
            continue
        m = marker.match(line)
        if not (m and 1 <= int(m.group(1)) <= 400):
            i += 1
            continue
        number = int(m.group(1))
        j = i + 1
        verse_lines: list[str] = []
        while j < stop and len(verse_lines) < 4:
            if marker.match(lines[j]) or (
                "Ch." in lines[j] and chapter_heading.search(lines[j])
            ):
                break
            if re.search(r"[\u0B80-\u0BFF]", lines[j]):
                verse_lines.append(lines[j])
            j += 1
        if len(verse_lines) != 4:
            i += 1
            continue
        translation: list[str] = []
        while j < stop and not marker.match(lines[j]) and not (
            "Ch." in lines[j] and chapter_heading.search(lines[j])
        ):
            if re.search(r"[A-Za-z]", lines[j]):
                translation.append(lines[j])
            j += 1
        if translation and number not in english:
            text = " ".join(translation).strip()
            if number == 400:
                # Drop the end-matter that follows the last quatrain.
                for end_marker in ("காமத்துப்பால் முற்றும்", "End of Part III", "F. W. ELLIS"):
                    if end_marker in text:
                        text = text.split(end_marker)[0].strip()
            english[number] = text
        i = j

    english.update(FALLBACKS["naladiyar"]["en"])
    return english


def build_naladiyar() -> list[dict]:
    meta = SOURCES["naladiyar"]
    tamil = parse_naladiyar_tamil(fetch(meta["ta"], "naladiyar"))
    english = parse_naladiyar_english(fetch(meta["en"], "naladiyar"))

    if len(tamil) != meta["count"] or len(english) != meta["count"]:
        raise SystemExit(
            f"Naladiyar parse mismatch: Tamil {len(tamil)}, English {len(english)}, "
            f"expected {meta['count']}"
        )

    page_ta = f"{PM_BASE}/{meta['ta']}.html"
    page_en = f"{PM_BASE}/{meta['en']}.html"
    now = datetime.now(timezone.utc).isoformat()
    records = []
    for number in range(1, meta["count"] + 1):
        item = tamil[number]
        chapter = item["chapter"] or {}
        records.append(
            {
                "id": f"naladiyar_{number:03d}",
                "poem": "naladiyar",
                "number": number,
                "title": chapter.get("title", ""),
                "heading": chapter.get("id", ""),
                "poet": meta["poet"],
                "tinai": "unknown",
                "sangamTamil": "\n".join(item["lines"]),
                "urai": None,
                "english": english[number],
                "englishMeta": {
                    "provider": "projectmadurai",
                    "model": meta["english_model"],
                    "promptVersion": "public-domain-edition",
                    "generatedAt": now,
                    "runId": "pathinen-ingest",
                },
                "lines": [
                    {"lineNumber": n, "text": text, "words": _tokens(text)}
                    for n, text in enumerate(item["lines"], start=1)
                ],
                "culturalNotes": [],
                "audioUrl": None,
                "source": f"{page_ta}; {page_en}",
                "verified": False,
            }
        )
    return records


def write_work(work: str, records: list[dict]) -> None:
    meta = SOURCES[work]
    work_dir = DATA_BASE / work
    norm_dir = work_dir / "normalized"
    norm_dir.mkdir(parents=True, exist_ok=True)
    for record in records:
        (norm_dir / f"{record['id']}.json").write_text(
            json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    (work_dir / f"{work}.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    datapackage = {
        "name": f"open-sangam-{work}",
        "title": f"{meta['ta_title']} — {meta['en_title']}",
        "description": (
            f"{meta['en_title']} ({meta['ta_title']}), Pathinenkilkkanakku — "
            f"{len(records)} verses with public-domain English translation."
        ),
        "version": "0.1.0",
        "licenses": [
            {
                "name": "odc-pddl",
                "title": "Open Data Commons Public Domain Dedication and Licence",
            }
        ],
        "sources": [
            {"title": "Project Madurai Tamil text", "path": f"{PM_BASE}/{meta['ta']}.html"},
            {
                "title": "Project Madurai English translation",
                "path": f"{PM_BASE}/{meta['en']}.html",
            },
        ],
        "resources": [
            {
                "name": work,
                "path": f"{work}.json",
                "mediatype": "application/json",
                "encoding": "utf-8",
            }
        ],
        "stats": {
            "records": len(records),
            "withEnglish": sum(1 for r in records if r.get("english")),
        },
    }
    (work_dir / "datapackage.json").write_text(
        json.dumps(datapackage, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  ✓ {work}: {len(records)} records → normalized/ + {work}.json")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Pathinenkilkkanakku works")
    parser.add_argument("--work", default="all", choices=["all", "thirukkural", "naladiyar"])
    args = parser.parse_args()

    targets = ["thirukkural", "naladiyar"] if args.work == "all" else [args.work]
    for work in targets:
        print(f"Ingesting {work}…")
        records = build_kural() if work == "thirukkural" else build_naladiyar()
        write_work(work, records)


if __name__ == "__main__":
    main()
