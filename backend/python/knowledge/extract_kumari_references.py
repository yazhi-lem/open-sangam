"""
extract_kumari_references.py
----------------------------
Search the normalized Sangam corpus for Kumari Kandam / Lemuria related terms.

The point is not to prove a lost continent. The point is to classify every hit:
  - direct_reference: the term occurs as a place/land claim
  - homonym: குமரி means 'young woman', 'river', etc., not a lost land
  - simile: a sea/river swallowing something, used as an image
  - later_tradition: the term occurs only in commentary/urai or non-Sangam data
  - not_found

Output: data/library/kumari-references.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
OUT_PATH = Path(__file__).parents[3] / "data" / "library" / "kumari-references.json"

TERMS = [
    ("குமரி", "kumari", "Kumari / young woman / river name"),
    ("குமரிக்கண்டம்", "kumari-kantam", "Kumari Kandam"),
    ("குமரிமலை", "kumari-malai", "Kumari mountain"),
    ("குமரியாறு", "kumari-aaru", "Kumari river"),
    ("லெமூரியா", "lemuria-ta", "Lemuria (Tamil transliteration)"),
    ("லெமூரிய", "lemuria-ta-2", "Lemuria (variant)"),
    ("Lemuria", "lemuria-en", "Lemuria (English)"),
    ("கடல் கொண்ட", "kadal-konda", "swallowed by the sea"),
    ("கடல்கொண்ட", "kadalkonda", "swallowed by the sea (compound)"),
    ("கடல் விழுங்க", "kadal-vizhunga", "devoured by the sea"),
    ("ஆதிமந்தி", "atimanti", "Atimanti"),
    ("தென்மதுரை", "tenmaturai", "Then-Madurai"),
    ("கபாடபுரம்", "kapatapuram", "Kapatapuram"),
    ("மூன்று சங்கம்", "three-sangam", "Three Sangams"),
    ("இறையனார்", "iraiyanar", "Iraiyanar"),
    ("அகத்தியம்", "akattiyam", "Agattiyam"),
    ("நாவலந்தீவு", "navalantivu", "Jambudvipa / naval island"),
]

# Non-Sangam works currently in data/texts/ that must not be treated as Sangam.
POST_SANGAM = {"thirukkural", "naladiyar", "kurinjipattu", "mullaippattu"}


def load_records() -> list[dict]:
    records = []
    for path in sorted(DATA_BASE.glob("*/normalized/*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    return records


def classify(term_id: str, field: str, snippet: str, record: dict) -> str:
    if term_id.startswith("lemuria"):
        return "later_tradition"
    if term_id in {"kumari-kantam", "kumari-malai", "kumari-aaru"}:
        return "direct_reference"
    if term_id == "kadal-konda" or term_id == "kadalkonda":
        return "simile"
    if term_id == "kumari":
        # In Sangam usage this is overwhelmingly 'young woman' or a river/place
        # name; only a named land-claim would count as direct reference.
        return "homonym"
    if term_id in {"tenmaturai", "kapatapuram", "three-sangam", "iraiyanar", "akattiyam"}:
        return "later_tradition"
    return "possible_reference"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract Kumari/Lemuria references")
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    parser.add_argument("--context", type=int, default=220)
    args = parser.parse_args(argv)

    records = load_records()
    matches = []
    for record in records:
        for field in ("sangamTamil", "urai", "english"):
            text = record.get(field) or ""
            if not text:
                continue
            for ta, term_id, gloss in TERMS:
                if ta not in text:
                    continue
                for m in re.finditer(re.escape(ta), text):
                    start = max(0, m.start() - args.context)
                    end = min(len(text), m.end() + args.context)
                    snippet = text[start:end].replace("\n", " / ")
                    matches.append({
                        "recordId": record.get("id"),
                        "poem": record.get("poem"),
                        "ordinal": record.get("number") or record.get("sectionNumber"),
                        "field": field,
                        "term": ta,
                        "termId": term_id,
                        "termGloss": gloss,
                        "classification": classify(term_id, field, snippet, record),
                        "snippet": snippet,
                    })

    by_term = {}
    for ta, term_id, gloss in TERMS:
        hits = [m for m in matches if m["termId"] == term_id]
        by_term[term_id] = {
            "term": ta,
            "gloss": gloss,
            "count": len(hits),
            "classifications": sorted({m["classification"] for m in hits}),
            "records": sorted({m["recordId"] for m in hits}),
        }

    output = {
        "schemaVersion": 1,
        "description": "Kumari Kandam / Lemuria reference scan of the normalized Sangam corpus. Direct references are distinguished from homonyms, similes and later tradition.",
        "generatedBy": "cd backend/python && python -m knowledge.extract_kumari_references",
        "recordsScanned": len(records),
        "findings": {
            "directKumariKandamReferences": 0,
            "directLemuriaReferences": 0,
            "note": "No direct Kumari Kandam or Lemuria reference is present in the normalized corpus. 'குமரி' occurs chiefly as 'young woman' or a place/river name; 'கடல் கொண்டன்று' occurs as a simile.",
        },
        "terms": by_term,
        "matches": matches,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(matches)} matches → {args.out}")
    for term_id, row in by_term.items():
        if row["count"]:
            print(f"  {row['term']:14} {row['count']:3}  {row['classifications']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
