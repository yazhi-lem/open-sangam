"""
normalize_to_json.py
--------------------
Reads raw scraped section files and normalizes them to the canonical
Open Sangam JSON schema (Verse → Line → Word), then emits a
Frictionless Data Package (datapackage.json) for OKF compatibility.

Usage:
    python -m normalizer.normalize_to_json [--poem maduraikanchi]
"""

import argparse
import json
from pathlib import Path

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"


def tokenize_line(line: str) -> list[dict]:
    return [{"form": w, "root": None, "urichol": None, "etymology": None, "gloss": None}
            for w in line.split() if w]


def normalize_section(raw: dict) -> dict:
    """Convert a raw section dict to the canonical schema."""
    poem_id = raw.get("poem", "maduraikanchi")
    sec_num = raw["sectionNumber"]
    sangam = raw.get("sangamTamil", "")
    lines_text = [ln for ln in sangam.splitlines() if ln.strip()]

    return {
        "id": f"{poem_id}_{sec_num:03d}",
        "poem": poem_id,
        "sectionNumber": sec_num,
        "title": raw.get("title", ""),
        "lineStart": raw.get("lineStart", 0),
        "lineEnd": raw.get("lineEnd", 0),
        "tinai": "palai",        # Maduraikanchi is kanci tinai (பொதுவியல்); set per-section later
        "sangamTamil": sangam,
        "urai": raw.get("urai"),
        "english": raw.get("english"),
        "lines": [
            {
                "lineNumber": i + 1,
                "text": line,
                "words": tokenize_line(line),
            }
            for i, line in enumerate(lines_text)
        ],
        "culturalNotes": [],
        "audioUrl": None,
        "source": raw.get("source", "sangathamizh.com"),
        "verified": False,
    }


def normalize_poem(poem_id: str) -> list[dict]:
    raw_dir = DATA_BASE / poem_id / "raw"
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw directory not found: {raw_dir}")

    sections = []
    for f in sorted(raw_dir.glob("section_*.json")):
        raw = json.loads(f.read_text(encoding="utf-8"))
        sections.append(normalize_section(raw))
    return sections


def save_normalized(sections: list[dict], poem_id: str) -> None:
    poem_dir = DATA_BASE / poem_id
    norm_dir = poem_dir / "normalized"
    norm_dir.mkdir(parents=True, exist_ok=True)

    for sec in sections:
        out = norm_dir / f"{sec['id']}.json"
        out.write_text(json.dumps(sec, ensure_ascii=False, indent=2), encoding="utf-8")

    combined = poem_dir / f"{poem_id}.json"
    combined.write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Normalized {len(sections)} sections → {combined}")


def write_datapackage(poem_id: str, sections: list[dict]) -> None:
    """Write a Frictionless Data Package descriptor (OKF format)."""
    poem_dir = DATA_BASE / poem_id
    has_urai = sum(1 for s in sections if s.get("urai"))
    has_english = sum(1 for s in sections if s.get("english"))

    descriptor = {
        "name": f"open-sangam-{poem_id}",
        "title": "மதுரைக்காஞ்சி — Maduraikanchi",
        "description": (
            "Maduraikanchi (மதுரைக்காஞ்சி) is one of the Ten Idylls (Pattuppāttu) "
            "of Classical Tamil Sangam literature, composed by Mankudi Maruthanar "
            "(c. 200 CE). 782 lines praising the Pandyan king Nedunj Cheliyan and "
            "the city of Madurai."
        ),
        "version": "0.1.0",
        "licenses": [{"name": "odc-pddl", "title": "Open Data Commons Public Domain Dedication and Licence"}],
        "sources": [
            {
                "title": "sangathamizh.com",
                "path": "http://www.sangathamizh.com/10paddu/10paddu-mathuraikaanchi-மதுரைக்காஞ்சி.html",
            }
        ],
        "contributors": [{"title": "Open Sangam Project", "role": "wrangler"}],
        "keywords": ["Tamil", "Sangam", "classical literature", "Maduraikanchi", "Pattuppattu"],
        "resources": [
            {
                "name": poem_id,
                "path": f"{poem_id}.json",
                "mediatype": "application/json",
                "encoding": "utf-8",
                "description": "All sections in canonical Open Sangam schema (Verse → Line → Word)",
                "schema": {
                    "fields": [
                        {"name": "id",            "type": "string",  "description": "Unique section ID, e.g. maduraikanchi_001"},
                        {"name": "poem",          "type": "string"},
                        {"name": "sectionNumber", "type": "integer"},
                        {"name": "title",         "type": "string",  "description": "Section title in Tamil"},
                        {"name": "lineStart",     "type": "integer", "description": "First line number in the original poem"},
                        {"name": "lineEnd",       "type": "integer", "description": "Last line number in the original poem"},
                        {"name": "tinai",         "type": "string",  "description": "Poetic landscape classification"},
                        {"name": "sangamTamil",   "type": "string",  "description": "Original Sangam Tamil text"},
                        {"name": "urai",          "type": "string",  "description": "Modern Tamil prose rendering (பொருளுரை); scraped from sangathamizh.com"},
                        {"name": "english",       "type": "string",  "description": "English translation; null until generated"},
                        {"name": "verified",      "type": "boolean", "description": "True once scholar-reviewed"},
                    ]
                },
            }
        ],
        "stats": {
            "sections": len(sections),
            "totalLines": max((s["lineEnd"] for s in sections), default=0),
            "sectionsWithUrai": has_urai,
            "sectionsWithEnglish": has_english,
        },
    }

    dp_path = poem_dir / "datapackage.json"
    dp_path.write_text(json.dumps(descriptor, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OKF datapackage written → {dp_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize scraped sections to JSON schema + OKF datapackage")
    parser.add_argument("--poem", default="maduraikanchi")
    args = parser.parse_args()

    sections = normalize_poem(args.poem)
    save_normalized(sections, args.poem)
    write_datapackage(args.poem, sections)


if __name__ == "__main__":
    main()
