"""
normalize_all.py
----------------
Normalizes raw scraped files for every poem in the registry to:
  1. Canonical per-record JSON files in  data/texts/{poem_id}/normalized/
  2. Combined                            data/texts/{poem_id}/{poem_id}.json
  3. Frictionless Data Package (OKF)     data/texts/{poem_id}/datapackage.json

Every record is rebuilt from data/texts/{poem_id}/raw/ — which holds ONLY the
scraped source, never AI output. A re-run therefore merges each new record
against whatever normalized file already exists for that id (see
merge_generated_fields()), so english/urai drafts from translate_with_gemini.py
and word glossaries from extract_etymology.py survive a re-normalize instead
of silently reverting to null. See docs/pipeline-scripts.md.

Usage:
    python -m normalizer.normalize_all [--poem natrinai|all]
"""

import argparse
import json
from pathlib import Path

from scraper.registry import POEM_BY_ID, POEMS

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
        "yazhi_urai": raw.get("yazhi_urai"),
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


def load_existing(norm_dir: Path, record_id: str) -> dict | None:
    path = norm_dir / f"{record_id}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def merge_generated_fields(record: dict, existing: dict | None) -> dict:
    """Carry forward AI-generated content that raw/ never contains.

    `record` was just rebuilt from raw/ and so has english=None, all-null word
    fields, and verified=False regardless of any prior AI run — raw/ only ever
    holds the scraped source. Without this merge, re-running the normalizer
    after translate_with_gemini.py or extract_etymology.py would silently
    discard every AI-generated field.
    """
    if existing is None:
        return record

    # english, yazhi_urai: never present in raw/, so always the existing draft.
    for field in ("english", "yazhi_urai"):
        if not record.get(field) and existing.get(field):
            record[field] = existing[field]
            meta_key = f"{field}Meta"
            if existing.get(meta_key):
                record[meta_key] = existing[meta_key]

    # urai: prefer a fresh non-empty scrape (a genuine source correction);
    # otherwise keep what's there, which may be an AI draft raw/ never had.
    if not record.get("urai") and existing.get("urai"):
        record["urai"] = existing["urai"]

    # verified is a scholar's call, never a scrape's — it must survive.
    if existing.get("verified"):
        record["verified"] = True

    # Word-level etymology only merges positionally when the word count still
    # matches what extract_etymology.py last annotated. A source-text
    # correction that changes the word count invalidates that mapping, so
    # etymology is left null for that verse rather than mis-applied.
    if existing.get("etymologyMeta"):
        new_words = [w for line in record.get("lines", []) for w in line.get("words", [])]
        old_words = [w for line in existing.get("lines", []) for w in line.get("words", [])]
        if len(new_words) == len(old_words):
            for new_word, old_word in zip(new_words, old_words):
                for field in ("root", "urichol", "etymology", "gloss"):
                    new_word[field] = old_word.get(field)
            record["etymologyMeta"] = existing["etymologyMeta"]

    return record


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
            "withYazhiUrai": sum(1 for r in records if r.get("yazhi_urai")),
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

    poem_dir = DATA_BASE / poem_id
    norm_dir = poem_dir / "normalized"
    norm_dir.mkdir(parents=True, exist_ok=True)

    records = []
    preserved = 0
    for f in raw_files:
        raw = json.loads(f.read_text(encoding="utf-8"))
        record = normalize_record(raw, poem)
        existing = load_existing(norm_dir, record["id"])
        merged = merge_generated_fields(record, existing)
        if merged.get("english") or merged.get("etymologyMeta"):
            preserved += 1
        records.append(merged)

    for rec in records:
        out = norm_dir / f"{rec['id']}.json"
        out.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")

    combined = poem_dir / f"{poem_id}.json"
    combined.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    dp = build_datapackage(poem, records)
    dp_path = poem_dir / "datapackage.json"
    dp_path.write_text(json.dumps(dp, ensure_ascii=False, indent=2), encoding="utf-8")

    suffix = f", {preserved} record(s) kept AI-generated content" if preserved else ""
    print(f"  ✓ {poem_id}: {len(records)} records → {combined.name} + datapackage.json{suffix}")


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
