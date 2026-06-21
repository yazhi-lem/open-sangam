"""
normalize_to_json.py
--------------------
Reads raw scraped verse files and normalizes them to the canonical
Open Sangam JSON schema (Verse → Line → Word).

Usage:
    python -m normalizer.normalize_to_json [--poem maduraikanchi]
"""

import argparse
import json
from pathlib import Path

RAW_BASE = Path(__file__).parents[3] / "data" / "texts"
NORMALIZED_BASE = Path(__file__).parents[3] / "data" / "texts"

# Tiṇai assignment will come from metadata; default until tagged manually.
DEFAULT_TINAI = "unknown"


def tokenize_line(line: str) -> list[dict]:
    """Split a verse line into word tokens."""
    # Split on whitespace; punctuation is preserved on the token for now.
    return [{"form": w, "root": None, "gloss": None} for w in line.split() if w]


def normalize_verse(raw: dict, poem_id: str) -> dict:
    """Convert a raw verse dict to the canonical schema."""
    lines = raw.get("lines", raw.get("sangamTamil", "").splitlines())
    return {
        "id": f"{poem_id}_{raw['number']:04d}",
        "poem": poem_id,
        "number": raw["number"],
        "tinai": raw.get("tinai", DEFAULT_TINAI),
        "sangamTamil": raw.get("sangamTamil", "\n".join(lines)),
        "urai": raw.get("urai"),          # Modern Tamil prose — filled by AI step
        "english": raw.get("english"),    # English translation — filled by AI step
        "lines": [
            {
                "lineNumber": i + 1,
                "text": line,
                "words": tokenize_line(line),
            }
            for i, line in enumerate(lines)
        ],
        "source": raw.get("source", "unknown"),
        "verified": False,
    }


def normalize_poem(poem_id: str) -> list[dict]:
    raw_dir = RAW_BASE / poem_id / "raw"
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw directory not found: {raw_dir}")

    verses = []
    for raw_file in sorted(raw_dir.glob("verse_*.json")):
        raw = json.loads(raw_file.read_text(encoding="utf-8"))
        verses.append(normalize_verse(raw, poem_id))

    return verses


def save_normalized(verses: list[dict], poem_id: str) -> None:
    out_dir = NORMALIZED_BASE / poem_id / "normalized"
    out_dir.mkdir(parents=True, exist_ok=True)

    for verse in verses:
        out_file = out_dir / f"{verse['id']}.json"
        out_file.write_text(json.dumps(verse, ensure_ascii=False, indent=2), encoding="utf-8")

    # Also write a combined file for easy ingestion
    combined = out_dir.parent / f"{poem_id}.json"
    combined.write_text(json.dumps(verses, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Normalized {len(verses)} verses → {combined}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize scraped verses to JSON schema")
    parser.add_argument("--poem", default="maduraikanchi", help="Poem ID")
    args = parser.parse_args()

    verses = normalize_poem(args.poem)
    save_normalized(verses, args.poem)


if __name__ == "__main__":
    main()
