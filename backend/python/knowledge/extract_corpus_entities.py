"""
extract_corpus_entities.py
--------------------------
Build a classified entity index from the normalized Sangam corpus.

Categories: flora, fauna, food, occupations, kinship, places/dynasties,
landscape motifs and emotions. Every entity keeps counts and cited sample lines.

This is a lexical research index, not a gazetteer or a botanical identification.

Output: data/library/corpus-entities.json
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
OUT_PATH = Path(__file__).parents[3] / "data" / "library" / "corpus-entities.json"

CATEGORIES = [
    {
        "id": "flora",
        "ta": "தாவரங்கள்",
        "en": "Flora",
        "terms": [
            ("குறிஞ்சி", "kuṟiñci", "kurinji flower"),
            ("வேங்கை", "vēṅkai", "Indian kino"),
            ("முல்லை", "mullai", "jasmine"),
            ("கடம்பு", "kaṭampu", "kadamba"),
            ("கொன்றை", "koṉṟai", "Indian laburnum"),
            ("பிடவம்", "piṭavam", "forest creeper"),
            ("காந்தள்", "kāntaḷ", "flame lily"),
            ("தாமரை", "tāmarai", "lotus"),
            ("நெய்தல்", "neytal", "water lily"),
            ("குவளை", "kuvaḷai", "blue water lily"),
            ("ஆம்பல்", "āmpal", "water lily"),
            ("மருது", "marutu", "maruthu tree"),
            ("காயா", "kāyā", "kaya tree"),
            ("பாதிரி", "pātiri", "trumpet-flower tree"),
            ("தென்னை", "teṉṉai", "coconut palm"),
            ("பனை", "paṉai", "palmyra palm"),
            ("மூங்கில்", "mūṅkil", "bamboo"),
            ("வேம்பு", "vēmpu", "neem"),
            ("ஆல்", "āl", "banyan"),
            ("கோங்கு", "kōṅku", "silk-cotton tree"),
            ("புன்னை", "puṉṉai", "punnai tree"),
        ],
    },
    {
        "id": "fauna",
        "ta": "விலங்குகள்",
        "en": "Fauna",
        "terms": [
            ("யானை", "yāṉai", "elephant"),
            ("குதிரை", "kutirai", "horse"),
            ("புலி", "puli", "tiger"),
            ("சிங்கம்", "ciṅkam", "lion"),
            ("கரடி", "karaṭi", "bear"),
            ("மான்", "māṉ", "deer"),
            ("மயில்", "mayil", "peacock"),
            ("குயில்", "kuyil", "koel"),
            ("காக்கை", "kākkai", "crow"),
            ("பருந்து", "paruntu", "kite / eagle"),
            ("ஆந்தை", "āntai", "owl"),
            ("மீன்", "mīṉ", "fish"),
            ("கயல்", "kayal", "carp"),
            ("வண்டு", "vaṇṭu", "beetle / bee"),
            ("தேனீ", "tēṉī", "honeybee"),
            ("பாம்பு", "pāmpu", "snake"),
            ("நாகம்", "nākam", "cobra"),
            ("குரங்கு", "kuraṅku", "monkey"),
            ("எருது", "erutu", "bull"),
            ("பசு", "pacu", "cow"),
            ("ஆடு", "āṭu", "goat"),
        ],
    },
    {
        "id": "food",
        "ta": "உணவு",
        "en": "Food and drink",
        "terms": [
            ("அரிசி", "arici", "rice"),
            ("சோறு", "cōṟu", "cooked rice"),
            ("கூழ்", "kūḻ", "gruel"),
            ("பால்", "pāl", "milk"),
            ("தயிர்", "tayir", "curd"),
            ("வெண்ணெய்", "veṇṇey", "butter"),
            ("தேன்", "tēṉ", "honey"),
            ("கள்", "kaḷ", "toddy"),
            ("இறைச்சி", "iṟaicci", "meat"),
            ("கனி", "kaṉi", "ripe fruit"),
            ("பழம்", "paḻam", "fruit"),
            ("கிழங்கு", "kiḻaṅku", "tuber"),
            ("அவல்", "aval", "flattened rice"),
        ],
    },
    {
        "id": "occupation",
        "ta": "தொழில்கள்",
        "en": "Occupations",
        "terms": [
            ("உழவர்", "uḻavar", "farmer"),
            ("ஆயர்", "āyar", "cowherd"),
            ("குறவர்", "kuṟavar", "hill people"),
            ("வேடர்", "vēṭar", "hunters"),
            ("பாணர்", "pāṇar", "bards"),
            ("விறலியர்", "viṟaliyar", "women performers"),
            ("புலவர்", "pulavar", "poet"),
            ("கொல்லர்", "kollar", "smiths"),
            ("குயவர்", "kuyavar", "potters"),
            ("தச்சர்", "taccar", "carpenters"),
            ("நெய்வர்", "neyvar", "weavers"),
            ("மீனவர்", "mīṉavar", "fishers"),
            ("வணிகர்", "vaṇikar", "merchants"),
            ("யவனர்", "yavanar", "Yavana / western traders"),
        ],
    },
    {
        "id": "kinship",
        "ta": "உறவுகள்",
        "en": "Kinship and social roles",
        "terms": [
            ("தாய்", "tāy", "mother"),
            ("தந்தை", "tantai", "father"),
            ("மகன்", "makaṉ", "son"),
            ("மகள்", "makaḷ", "daughter"),
            ("கணவன்", "kaṇavaṉ", "husband"),
            ("மனைவி", "maṉaivi", "wife"),
            ("தலைவன்", "talaivaṉ", "hero"),
            ("தலைவி", "talaivi", "heroine"),
            ("தோழி", "tōḻi", "friend"),
            ("சுற்றம்", "cuṟṟam", "kin"),
            ("மாமன்", "māmaṉ", "maternal uncle"),
            ("அத்தை", "attai", "aunt"),
        ],
    },
    {
        "id": "place",
        "ta": "இடங்கள் & அரசர்கள்",
        "en": "Places and dynasties",
        "terms": [
            ("சேர", "cēra", "Chera"),
            ("சோழ", "cōḻa", "Chola"),
            ("பாண்டிய", "pāṇṭiya", "Pandya"),
            ("மதுரை", "maturai", "Madurai"),
            ("வஞ்சி", "vañci", "Vanji"),
            ("காவிரி", "kāviri", "Kaveri"),
            ("வையை", "vaiyai", "Vaigai"),
            ("முசிறி", "muciṟi", "Muziris"),
            ("கூடல்", "kūṭal", "Koodal / Madurai"),
            ("பறம்பு", "paṟampu", "Parambu"),
        ],
    },
    {
        "id": "motif",
        "ta": "இயற்கை உருவகங்கள்",
        "en": "Landscape motifs",
        "terms": [
            ("மழை", "maḻai", "rain"),
            ("மாலை", "mālai", "evening"),
            ("இரவு", "iravu", "night"),
            ("பகல்", "pakal", "day"),
            ("வெயில்", "veyil", "sunshine"),
            ("கார்", "kār", "rainy season"),
            ("கூதிர்", "kūtir", "cold season"),
            ("நிலா", "nilā", "moon"),
            ("கடல்", "kaṭal", "sea"),
            ("மலை", "malai", "mountain"),
            ("காடு", "kāṭu", "forest"),
            ("வயல்", "vayal", "paddy field"),
            ("பாலை", "pālai", "wasteland"),
        ],
    },
    {
        "id": "emotion",
        "ta": "உணர்வுகள்",
        "en": "Emotions",
        "terms": [
            ("காதல்", "kātal", "love"),
            ("அன்பு", "aṉpu", "affection"),
            ("ஊடல்", "ūṭal", "lovers' quarrel"),
            ("பிரிவு", "pirivu", "separation"),
            ("துயர்", "tuyar", "sorrow"),
            ("மகிழ்ச்சி", "makiḻcci", "joy"),
            ("அழுகை", "aḻukai", "weeping"),
            ("நாணம்", "nāṇam", "modesty / shame"),
            ("வீரம்", "vīram", "valour"),
            ("அறம்", "aṟam", "virtue"),
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


def token_hits(text: str, terms: list[tuple[str, str, str]]) -> list[tuple[str, str]]:
    tokens = [t.strip() for t in re.split(r'[\s.,;:!?"\'“”‘’()\-]+', text) if t.strip()]
    hits = []
    for term, _roman, _gloss in terms:
        for token in tokens:
            if token == term or token.startswith(term):
                hits.append((term, token))
                break
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract classified corpus entities")
    parser.add_argument("--min-count", type=int, default=2)
    parser.add_argument("--samples", type=int, default=5)
    args = parser.parse_args(argv)

    records = load_records()
    counts: Counter[str] = Counter()
    forms: dict[str, Counter[str]] = defaultdict(Counter)
    poems: dict[str, Counter[str]] = defaultdict(Counter)
    attestations: dict[str, list[dict]] = defaultdict(list)

    for category in CATEGORIES:
        for record in records:
            for line in record.get("lines") or []:
                for term, token in token_hits(line.get("text") or "", category["terms"]):
                    counts[term] += 1
                    forms[term][token] += 1
                    poems[term][record.get("poem") or ""] += 1
                    if len(attestations[term]) < 200:
                        attestations[term].append(
                            {
                                "recordId": record.get("id"),
                                "poem": record.get("poem"),
                                "ordinal": record.get("number") or record.get("sectionNumber"),
                                "lineNumber": line.get("lineNumber"),
                                "word": token,
                                "text": line.get("text"),
                            }
                        )

    entities = []
    for category in CATEGORIES:
        for ta, roman, gloss in category["terms"]:
            if counts[ta] < args.min_count:
                continue
            entities.append(
                {
                    "id": f"{category['id']}-{roman}",
                    "category": category["id"],
                    "ta": ta,
                    "roman": roman,
                    "en": gloss,
                    "count": counts[ta],
                    "forms": [{"form": f, "count": n} for f, n in forms[ta].most_common(6)],
                    "poems": [{"poem": p, "count": n} for p, n in poems[ta].most_common(8)],
                    "samples": sorted(attestations[ta], key=lambda x: (x["poem"] or "", x["ordinal"] or 0))[: args.samples],
                }
            )

    entities.sort(key=lambda item: (item["category"], -item["count"], item["ta"]))
    output = {
        "schemaVersion": 1,
        "description": "Lexical index of flora, fauna, food, occupations, kinship, places, motifs and emotions in the Sangam corpus. Counts are verse-line attestations, not identifications.",
        "generatedBy": "cd backend/python && python -m knowledge.extract_corpus_entities",
        "recordsScanned": len(records),
        "categories": [
            {"id": c["id"], "ta": c["ta"], "en": c["en"]} for c in CATEGORIES
        ],
        "entities": entities,
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entities)} entities from {len(records)} records → {OUT_PATH}")
    for category in CATEGORIES:
        items = [e for e in entities if e["category"] == category["id"]]
        print(f"  {category['en']:28} {len(items):2} terms · {sum(e['count'] for e in items):5} attestations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
