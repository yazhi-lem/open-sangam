"""
normalize_all.py
----------------
Normalizes raw scraped files for every poem in the registry to:
  1. Canonical per-record JSON files in  data/texts/{poem_id}/normalized/
  2. Combined                            data/texts/{poem_id}/{poem_id}.json
  3. Frictionless Data Package (OKF)     data/texts/{poem_id}/datapackage.json

Usage:
    python -m normalizer.normalize_all [--poem natrinai|all]
"""

import argparse
import json
from pathlib import Path

from scraper.registry import POEMS, POEM_BY_ID

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"


def tokenize_line(line: str) -> list[dict]:
    return [
        {"form": w, "root": None, "urichol": None, "etymology": None, "gloss": None}
        for w in line.split() if w
    ]


def normalize_record(raw: dict, poem: dict) -> dict:
    """Produce a canonical record regardless of verse vs section format."""
    sangam = raw.get("sangamTamil", "")
    lines_text = [ln for ln in sangam.splitlines() if ln.strip()]

    poem_id = raw.get("poem", poem["id"])
    num = raw.get("sectionNumber") or raw.get("number", 0)
    generated_id = raw.get("id") or f"{poem_id}_{num:0{poem['num_digits']}d}"

    base = {
        "id": generated_id,
        "poem": poem_id,
        "tinai": raw.get("tinai", "unknown"),
        "sangamTamil": sangam,
        "urai": raw.get("urai"),
        "english": raw.get("english"),
        "lines": [
            {"lineNumber": i + 1, "text": ln, "words": tokenize_line(ln)}
            for i, ln in enumerate(lines_text)
        ],
        "culturalNotes": [],
        "audioUrl": None,
        "source": raw.get("source", ""),
        "verified": raw.get("verified", False),
    }

    if poem["collection"] == "8thokai":
        base["number"] = raw.get("number", 0)
        base["poet"] = raw.get("poet")
    else:
        base["sectionNumber"] = raw.get("sectionNumber", 0)
        base["title"] = raw.get("title", "")
        base["lineStart"] = raw.get("lineStart", 0)
        base["lineEnd"] = raw.get("lineEnd", 0)

    return base


def build_datapackage(poem: dict, records: list[dict]) -> dict:
    p = poem
    has_urai = sum(1 for r in records if r.get("urai"))
    total_items = len(records)

    if p["collection"] == "8thokai":
        desc_extra = f"{total_items} individual poems"
        extra_fields = [
            {"name": "number", "type": "integer", "description": "Poem number"},
            {"name": "poet",   "type": "string",  "description": "Poet name in Tamil"},
        ]
    else:
        last_line = max((r.get("lineEnd", 0) for r in records), default=0)
        desc_extra = f"{total_items} sections, {last_line} lines"
        extra_fields = [
            {"name": "sectionNumber", "type": "integer"},
            {"name": "title",         "type": "string", "description": "Section title in Tamil"},
            {"name": "lineStart",     "type": "integer"},
            {"name": "lineEnd",       "type": "integer"},
        ]

    return {
        "name": f"open-sangam-{p['id']}",
        "title": f"{p['title_ta']} — {p['title_en']}",
        "description": f"{p['title_en']} ({p['title_ta']}), {p['collection']} — {desc_extra}.",
        "version": "0.1.0",
        "licenses": [{"name": "odc-pddl", "title": "Open Data Commons Public Domain Dedication and Licence"}],
        "sources": [{"title": "sangathamizh.com", "path": p["index_url"]}],
        "contributors": [{"title": "Open Sangam Project", "role": "wrangler"}],
        "keywords": ["Tamil", "Sangam", "classical literature", p["title_en"], p["collection"]],
        "resources": [
            {
                "name": p["id"],
                "path": f"{p['id']}.json",
                "mediatype": "application/json",
                "encoding": "utf-8",
                "schema": {
                    "fields": [
                        {"name": "id",          "type": "string"},
                        {"name": "poem",        "type": "string"},
                        {"name": "tinai",       "type": "string"},
                        {"name": "sangamTamil", "type": "string"},
                        {"name": "urai",        "type": "string", "description": "Modern Tamil prose (scraped)"},
                        {"name": "english",     "type": "string", "description": "English translation; null until generated"},
                        {"name": "verified",    "type": "boolean"},
                        *extra_fields,
                    ]
                },
            }
        ],
        "stats": {
            "records": total_items,
            "withUrai": has_urai,
            "withEnglish": sum(1 for r in records if r.get("english")),
        },
    }


def normalize_poem(poem: dict) -> None:
    poem_id = poem["id"]
    raw_dir = DATA_BASE / poem_id / "raw"

    if not raw_dir.exists():
        print(f"  ⚠ {poem_id}: raw dir missing — run scrape_poem first")
        return

    raw_files = sorted(raw_dir.glob("*.json"))
    if not raw_files:
        print(f"  ⚠ {poem_id}: no raw files found")
        return

    records = []
    for f in raw_files:
        raw = json.loads(f.read_text(encoding="utf-8"))
        records.append(normalize_record(raw, poem))

    poem_dir = DATA_BASE / poem_id
    norm_dir = poem_dir / "normalized"
    norm_dir.mkdir(parents=True, exist_ok=True)

    for rec in records:
        out = norm_dir / f"{rec['id']}.json"
        out.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")

    combined = poem_dir / f"{poem_id}.json"
    combined.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    dp = build_datapackage(poem, records)
    dp_path = poem_dir / "datapackage.json"
    dp_path.write_text(json.dumps(dp, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  ✓ {poem_id}: {len(records)} records → {combined.name} + datapackage.json")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize all scraped poems to OKF data packages")
    parser.add_argument("--poem", default="all", help="Poem ID or 'all'")
    args = parser.parse_args()

    if args.poem == "all":
        targets = POEMS
    elif args.poem in POEM_BY_ID:
        targets = [POEM_BY_ID[args.poem]]
    else:
        parser.error(f"Unknown poem '{args.poem}'")

    print(f"Normalizing {len(targets)} poem(s)…")
    for poem in targets:
        normalize_poem(poem)
    print("Done.")


if __name__ == "__main__":
    main()
