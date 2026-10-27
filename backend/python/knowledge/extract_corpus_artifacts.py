"""
extract_corpus_artifacts.py
---------------------------
Extract material-culture terms from the normalized Sangam corpus and store them
as a classified, citation-linked artifact index.

This is deliberately a *lexical* index, not an archaeological identification:
it answers "where does the corpus talk about yāḻ, muracu, naṭukal, toṭi?" and
gives scholars a starting point for contextual reading. Every hit keeps its
record id, poem, verse/section number and line text.

Output: data/library/corpus-artifacts.json

Usage:
    cd backend/python
    python -m knowledge.extract_corpus_artifacts
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
OUT_PATH = Path(__file__).parents[3] / "data" / "library" / "corpus-artifacts.json"

CLASSES = [
    {
        "id": "music",
        "ta": "இசைக்கருவிகள்",
        "en": "Musical instruments",
        "description": "Harp, flute, drums and performance objects named in the poems.",
        "terms": [
            ("யாழ்", "yāḻ", "harp"),
            ("குழல்", "kuḻal", "flute"),
            ("முரசு", "muracu", "royal war drum"),
            ("பறை", "paṟai", "hand drum"),
            ("தண்ணுமை", "taṇṇumai", "barrel drum"),
            ("கொக்கரை", "kokkarai", "horn / trumpet"),
        ],
    },
    {
        "id": "ornament",
        "ta": "அணிகலன்கள்",
        "en": "Ornaments and jewellery",
        "description": "Bangles, earrings, necklaces, pearls, gold and gemstones.",
        "terms": [
            ("தொடி", "toṭi", "bangle"),
            ("குழை", "kuḻai", "ear ornament"),
            ("மாலை", "mālai", "garland / necklace"),
            ("ஆரம்", "āram", "necklace"),
            ("முத்து", "muttu", "pearl"),
            ("மணி", "maṇi", "gem / bead"),
            ("பொன்", "poṉ", "gold"),
            ("வளை", "vaḷai", "bangle"),
            ("தோடு", "tōṭu", "earring"),
            ("மோதிரம்", "mōtiram", "ring"),
        ],
    },
    {
        "id": "weapon",
        "ta": "படைக்கலன்கள்",
        "en": "Weapons and warfare",
        "description": "Spears, bows, arrows, swords and battle equipment.",
        "terms": [
            ("வேல்", "vēl", "spear"),
            ("வில்", "vil", "bow"),
            ("அம்பு", "ampu", "arrow"),
            ("கணை", "kaṇai", "arrow"),
            ("வாள்", "vāḷ", "sword"),
            ("எஃகு", "eḥku", "steel / sharp weapon"),
            ("கேடயம்", "kēṭayam", "shield"),
            ("படை", "paṭai", "army / weapon"),
        ],
    },
    {
        "id": "transport",
        "ta": "போக்குவரத்து",
        "en": "Transport and animals",
        "description": "Chariots, horses, elephants and boats.",
        "terms": [
            ("தேர்", "tēr", "chariot"),
            ("குதிரை", "kutirai", "horse"),
            ("யானை", "yāṉai", "elephant"),
            ("நாவாய்", "nāvāy", "ship"),
            ("படகு", "paṭaku", "boat"),
        ],
    },
    {
        "id": "ritual",
        "ta": "வழிபாட்டுப் பொருட்கள்",
        "en": "Ritual and memorial objects",
        "description": "Hero stones, shrines, offerings and sacred places.",
        "terms": [
            ("நடுகல்", "naṭukal", "hero stone"),
            ("வேள்வி", "vēḷvi", "sacrifice / offering"),
            ("பூசை", "pūcai", "worship"),
            ("கோட்டம்", "kōṭṭam", "shrine"),
            ("தெய்வம்", "teyvam", "deity"),
        ],
    },
    {
        "id": "vessel",
        "ta": "கலன்கள்",
        "en": "Vessels and containers",
        "description": "Pots, jars, bowls and measuring vessels.",
        "terms": [
            ("கலம்", "kalam", "vessel"),
            ("குடம்", "kuṭam", "pot"),
            ("தாழி", "tāḻi", "large jar"),
            ("சாடி", "cāṭi", "jar"),
            ("பாணி", "pāṇi", "bowl / vessel"),
        ],
    },
    {
        "id": "textile",
        "ta": "ஆடைகள்",
        "en": "Textiles and dress",
        "description": "Cloth, silk, garments and weaving terms.",
        "terms": [
            ("ஆடை", "āṭai", "garment"),
            ("கலிங்கம்", "kaliṅkam", "cloth"),
            ("துகில்", "tukil", "fine cloth"),
            ("பட்டு", "paṭṭu", "silk"),
            ("நூல்", "nūl", "thread / text"),
        ],
    },
    {
        "id": "tool",
        "ta": "கருவிகள்",
        "en": "Tools and implements",
        "description": "Ploughs, sickles and agricultural implements.",
        "terms": [
            ("கலப்பை", "kalappai", "plough"),
            ("அரிவாள்", "arivāḷ", "sickle"),
            ("உழு", "uḻu", "plough / till"),
        ],
    },
    {
        "id": "writing",
        "ta": "எழுத்துப் பொருட்கள்",
        "en": "Writing and manuscripts",
        "description": "Palm leaves, letters, books and poetic texts.",
        "terms": [
            ("ஓலை", "ōlai", "palm leaf"),
            ("எழுத்து", "eḻuttu", "writing / letter"),
            ("நூல்", "nūl", "book / thread"),
            ("செய்யுள்", "ceyyuḷ", "poem"),
        ],
    },
]


def load_records() -> list[dict]:
    records = []
    for path in sorted(DATA_BASE.glob("*/normalized/*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    return records


def record_ordinal(record: dict) -> int | None:
    return record.get("number") or record.get("sectionNumber")


def line_hits(text: str, terms: list[tuple[str, str, str]]) -> list[tuple[str, str]]:
    """Return (term, matched word) for curated terms at the start of a token.

    Tamil is agglutinative, so a plain substring search produces noise
    ("தெருவில்" is not a bow). Requiring the lemma to start the token keeps
    inflected and compound forms while dropping most accidental matches.
    """
    tokens = [
        token.strip()
        for token in re.split(r'[\s.,;:!?"\'“”‘’()\-]+', text)
        if token.strip()
    ]
    hits = []
    for term, _roman, _gloss in terms:
        for token in tokens:
            if token == term or token.startswith(term):
                hits.append((term, token))
                break
    return hits

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract material-culture terms from the corpus")
    parser.add_argument("--min-count", type=int, default=2)
    parser.add_argument("--samples", type=int, default=6)
    args = parser.parse_args(argv)

    records = load_records()
    counts: Counter[str] = Counter()
    forms: dict[str, Counter[str]] = defaultdict(Counter)
    attestations: dict[str, list[dict]] = defaultdict(list)
    poems: dict[str, Counter[str]] = defaultdict(Counter)
    classes: dict[str, dict] = {}

    for klass in CLASSES:
        classes[klass["id"]] = {
            "id": klass["id"],
            "ta": klass["ta"],
            "en": klass["en"],
            "description": klass["description"],
            "terms": [
                {"ta": ta, "roman": roman, "gloss": gloss}
                for ta, roman, gloss in klass["terms"]
            ],
        }

        for record in records:
            text = record.get("sangamTamil") or ""
            if not text:
                continue
            for line in record.get("lines") or []:
                for term, token in line_hits(line.get("text") or "", klass["terms"]):
                    counts[term] += 1
                    forms[term][token] += 1
                    poems[term][record.get("poem") or ""] += 1
                    if len(attestations[term]) < 250:
                        attestations[term].append(
                            {
                                "recordId": record.get("id"),
                                "poem": record.get("poem"),
                                "ordinal": record_ordinal(record),
                                "lineNumber": line.get("lineNumber"),
                                "word": token,
                                "text": line.get("text"),
                            }
                        )

    artifacts = []
    for klass in CLASSES:
        for ta, roman, gloss in klass["terms"]:
            count = counts[ta]
            if count < args.min_count:
                continue
            samples = sorted(
                attestations[ta],
                key=lambda item: (item.get("poem") or "", item.get("ordinal") or 0, item.get("lineNumber") or 0),
            )[: args.samples]
            artifacts.append(
                {
                    "id": f"{klass['id']}-{roman}",
                    "class": klass["id"],
                    "ta": ta,
                    "roman": roman,
                    "en": gloss,
                    "count": count,
                    "forms": [
                        {"form": form, "count": n}
                        for form, n in forms[ta].most_common(8)
                    ],
                    "poems": [
                        {"poem": poem, "count": n}
                        for poem, n in poems[ta].most_common(10)
                    ],
                    "samples": samples,
                }
            )

    artifacts.sort(key=lambda item: (-item["count"], item["class"], item["ta"]))
    output = {
        "schemaVersion": 1,
        "description": "Lexical index of material-culture terms in the normalized Sangam corpus. Counts are attestations in verse lines; they are not archaeological identifications.",
        "generatedBy": "cd backend/python && python -m knowledge.extract_corpus_artifacts",
        "recordsScanned": len(records),
        "classes": list(classes.values()),
        "artifacts": artifacts,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(artifacts)} classified artifacts from {len(records)} records → {OUT_PATH}")
    for klass in CLASSES:
        n = sum(1 for a in artifacts if a["class"] == klass["id"])
        total = sum(a["count"] for a in artifacts if a["class"] == klass["id"])
        print(f"  {klass['en']:32} {n:2} terms · {total:5} attestations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
