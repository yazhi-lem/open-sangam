"""
extract_stories.py
------------------
Turn Sangam verses into structured story seeds for akam and puram.

This is a deterministic, evidence-linked extractor. It does not invent events:
each story is built from the verse's tiṇai, title, urai and text, and every
record keeps the source verse/record id.

Akam stories use the five tiṇai as emotional arcs. Puram stories are classified
by lexical cues into war, patronage, hero-stone, kingship, elegy, love, ethics,
nature and reflection.

Output: data/library/stories.json

Usage:
    cd backend/python
    python -m knowledge.extract_stories
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
OUT_PATH = Path(__file__).parents[3] / "data" / "library" / "stories.json"

AKAM_POEMS = {"natrinai", "kurunthokai", "ainkurunooru", "kalithokai", "akananooru", "kurinjipattu", "mullaippattu"}
POST_SANGAM = {"thirukkural", "naladiyar"}
AKAM_TINAI = {"kurinji", "mullai", "marutam", "neytal", "palai"}

AKAM_ARCHETYPES = {
    "kurinji": {
        "id": "akam-kurinji",
        "ta": "களவுக் கூடல்",
        "en": "Secret union in the hills",
        "setting": "மலை, அருவி, குறிஞ்சி மலர், இரவு",
        "conflict": "இருவரின் காதலைக் களவாகக் காக்க வேண்டிய கட்டாயம்.",
        "turn": "தோழியின் உதவியால் தலைவன்-தலைவி சந்திப்பு நிகழ்கிறது.",
        "resolution": "இணைவு மற்றும் மறைவான மகிழ்ச்சி.",
        "theme": "காதல், இரகசியம், இயற்கை",
    },
    "mullai": {
        "id": "akam-mullai",
        "ta": "காத்திருத்தல்",
        "en": "Waiting through the rains",
        "setting": "காடு, முல்லை, கார்கால மாலை, கடம்பு",
        "conflict": "போர் அல்லது வாணிபத்திற்குச் சென்ற தலைவன் திரும்பவில்லை.",
        "turn": "மழை வருகை, தூது அல்லது நல்ல சொல் தலைவியை ஆற்றுப்படுத்துகிறது.",
        "resolution": "தலைவன் திரும்பி வரும் நம்பிக்கை.",
        "theme": "பிரிவு, விசுவாசம், காத்திருத்தல்",
    },
    "marutam": {
        "id": "akam-marutam",
        "ta": "ஊடல் தீர்தல்",
        "en": "Quarrel and reconciliation",
        "setting": "வயல், ஆறு, மருத நிலம், மாலை",
        "conflict": "தலைவனின் புறத்தொழுக்கம் அல்லது தலைவியின் ஐயம்.",
        "turn": "தோழி அல்லது தலைவன் சமாதானம் செய்கிறார்.",
        "resolution": "ஊடல் நீங்கி மீண்டும் இணைவு.",
        "theme": "ஊடல், அவநம்பிக்கை, சமாதானம்",
    },
    "neytal": {
        "id": "akam-neytal",
        "ta": "கடல் பிரிவு",
        "en": "Pining by the sea",
        "setting": "கடல், உப்பங்கழி, மீனவர், மாலை",
        "conflict": "கடல் கடந்து சென்ற தலைவரை நினைத்து வருந்துதல்.",
        "turn": "தூது, பறவை அல்லது தோழியின் ஆறுதல்.",
        "resolution": "தலைவர் வருவார் என்ற நம்பிக்கை அல்லது விரக துயர்.",
        "theme": "விரகம், கடல், ஏக்கம்",
    },
    "palai": {
        "id": "akam-palai",
        "ta": "பாலைப் பயணம்",
        "en": "The wasteland journey",
        "setting": "பாலை, வெயில், வறண்ட வழி, முரசு",
        "conflict": "தலைவன் பொருள் தேடவோ போருக்கோ பிரிந்து செல்லுதல்.",
        "turn": "தலைவி தன் துயரைப் பொறுத்துக்கொண்டு வழியனுப்புதல்.",
        "resolution": "பிரிவின் துயரம் அல்லது தலைவன் மீட்சி.",
        "theme": "பிரிவு, துயரம், பொருள்",
    },
}

PURAM_ARCHETYPES = {
    "war": {
        "id": "puram-war",
        "ta": "போரும் வீரமும்",
        "en": "War and valour",
        "conflict": "பகைவர் மீது படை எழுப்புதல், முற்றுகை அல்லது களப்போர்.",
        "turn": "வீரம், தலைமை அல்லது படையின் மனநிலை சோதிக்கப்படுகிறது.",
        "resolution": "வெற்றி, தோல்வி அல்லது வீர மரணம்.",
        "theme": "வீரம், அரசாட்சி, போர்",
        "keywords": ["போர்", "படை", "வேல்", "வில்", "யானை", "குதிரை", "வென்ற", "முற்ற", "செரு", "களம்", "அம்பு", "வாள்"],
    },
    "patronage": {
        "id": "puram-patronage",
        "ta": "கொடையும் புகழும்",
        "en": "Patronage and generosity",
        "conflict": "புலவர் ஒரு வள்ளலை அணுகி பரிசில் பெறுதல்.",
        "turn": "வள்ளலின் கொடை, விருந்து அல்லது பரிசில்.",
        "resolution": "புலவர் புகழ்ந்து, வள்ளலின் பெருமை நிலைபெறுதல்.",
        "theme": "கொடை, வள்ளல், புலவர்",
        "keywords": ["கொடை", "வள்ளல்", "பரிசில்", "ஈகை", "வழங்க", "நல்க", "பொன்", "விருந்து"],
    },
    "hero-stone": {
        "id": "puram-hero-stone",
        "ta": "நடுகல்லும் நினைவும்",
        "en": "Hero stone and memory",
        "conflict": "வீரன் போரில் அல்லது களவில் வீழ்தல்.",
        "turn": "உறவினர் அவன் வீரத்தை நினைவுகூர்தல்.",
        "resolution": "நடுகல் எழுப்பி புகழை நிலைநிறுத்துதல்.",
        "theme": "நினைவு, வீரம், மரணம்",
        "keywords": ["நடுகல்", "இறந்த", "வீரம்", "புகழ்", "களம்", "வீழ்ந்த"],
    },
    "kingship": {
        "id": "puram-kingship",
        "ta": "அரசும் நீதியும்",
        "en": "Kingship and justice",
        "conflict": "அரசன் நீதி, செங்கோல் அல்லது ஆட்சியை நிலைநாட்ட வேண்டியிருக்கிறது.",
        "turn": "அரசனின் முடிவு அல்லது புலவரின் அறிவுரை.",
        "resolution": "நீதி நிலைபெறுதல் அல்லது அரசனின் பெருமை.",
        "theme": "அரசாட்சி, நீதி, செங்கோல்",
        "keywords": ["அரசன்", "வேந்தன்", "மன்னன்", "செங்கோல்", "ஆட்சி", "நாடு", "கோன்"],
    },
    "elegy": {
        "id": "puram-elegy",
        "ta": "இரங்கலும் நிலையாமையும்",
        "en": "Elegy and impermanence",
        "conflict": "ஒருவரின் இறப்பு அல்லது வாழ்வின் நிலையாமை.",
        "turn": "இறந்தவரின் புகழ் அல்லது வாழ்வின் அர்த்தம் நினைவுகூரப்படுகிறது.",
        "resolution": "துயரம், ஏற்றுக்கொள்ளல் அல்லது அறிவுரை.",
        "theme": "மரணம், நிலையாமை, இரங்கல்",
        "keywords": ["இறந்த", "சாவு", "நிலையாமை", "மரணம்", "கேடு", "பொன்ற"],
    },
    "love": {
        "id": "puram-love",
        "ta": "புறத்தே காதல்",
        "en": "Love in the public frame",
        "conflict": "காதல், திருமணம் அல்லது பிரிவு பற்றிய ஐயம்.",
        "turn": "தலைவன்/தலைவியின் மனநிலை வெளிப்படுகிறது.",
        "resolution": "இணைவு, ஏக்கம் அல்லது சமூகக் கட்டுப்பாடு.",
        "theme": "காதல், சமூகம், பிரிவு",
        "keywords": ["காதல்", "தலைவன்", "தலைவி", "அன்பு", "மனைவி", "கணவன்"],
    },
    "ethics": {
        "id": "puram-ethics",
        "ta": "அறமும் பண்பும்",
        "en": "Ethics and character",
        "conflict": "அறம், பண்பு அல்லது பொறுப்பு பற்றிய சோதனை.",
        "turn": "ஒரு நெறிமுறை முடிவு அல்லது அறிவுரை.",
        "resolution": "அறநெறி நிலைபெறுதல்.",
        "theme": "அறம், பண்பு, பொறுப்பு",
        "keywords": ["அறம்", "தருமம்", "நீதி", "பண்பு", "ஒழுக்கம்", "கடமை"],
    },
    "nature": {
        "id": "puram-nature",
        "ta": "இயற்கையும் வாழ்வும்",
        "en": "Nature and life",
        "conflict": "இயற்கைச் சூழல் மனித வாழ்வைப் பாதிக்கிறது.",
        "turn": "பருவம், நிலம் அல்லது விலங்கின் செயல் மாற்றத்தை உருவாக்குகிறது.",
        "resolution": "இயற்கையோடு இணைந்த வாழ்க்கை நிலை.",
        "theme": "இயற்கை, பருவம், வாழ்க்கை",
        "keywords": ["மலை", "கடல்", "நிலா", "மழை", "புலி", "மான்", "மரம்", "ஆறு"],
    },
    "devotional": {
        "id": "puram-devotional",
        "ta": "வழிபாடும் தெய்வீகமும்",
        "en": "Devotion and the divine",
        "conflict": "தெய்வத்தை அணுகி பாடுதல், வேண்டுதல் அல்லது துதித்தல்.",
        "turn": "தெய்வத்தின் பெருமை, அருள் அல்லது வீரம் வெளிப்படுகிறது.",
        "resolution": "பக்தி, ஆறுதல் அல்லது தெய்வீக ஒருமைப்பாடு.",
        "theme": "பக்தி, தெய்வம், வழிபாடு",
        "keywords": ["முருகன்", "திருமால்", "கடவுள்", "தெய்வம்", "வழிபாடு", "பூசை", "வேள்வி", "அருள்"],
    },
    "reflection": {
        "id": "puram-reflection",
        "ta": "சிந்தனையும் அறிவுரையும்",
        "en": "Reflection and counsel",
        "conflict": "வாழ்வின் ஒரு நிலை பற்றிய சிந்தனை.",
        "turn": "புலவரின் பார்வை அல்லது அறிவுரை.",
        "resolution": "ஒரு வாழ்க்கைப் பாடம்.",
        "theme": "சிந்தனை, அறிவுரை, வாழ்க்கை",
        "keywords": [],
    },
}

CHARACTERS = {
    "தலைவன்": "தலைவன் · hero",
    "தலைவி": "தலைவி · heroine",
    "தோழி": "தோழி · friend",
    "தாய்": "தாய் · mother",
    "புலவர்": "புலவர் · poet",
    "பரத்தை": "பரத்தை · courtesan",
    "கணவன்": "கணவன் · husband",
    "மனைவி": "மனைவி · wife",
    "வேந்தன்": "வேந்தன் · king",
    "அரசன்": "அரசன் · king",
    "மன்னன்": "மன்னன் · king",
    "வள்ளல்": "வள்ளல் · patron",
    "வீரன்": "வீரன் · warrior",
    "யானை": "யானை · elephant",
    "குதிரை": "குதிரை · horse",
}

DYNASTIES = {
    "சேர": "சேரர் · Chera",
    "சோழ": "சோழர் · Chola",
    "பாண்டிய": "பாண்டியர் · Pandya",
    "கிள்ளிவளவன்": "கிள்ளிவளவன் · Killivalavan",
    "கரிகாலன்": "கரிகாலன் · Karikalan",
    "நெடுஞ்செழியன்": "நெடுஞ்செழியன் · Nedunjeliyan",
    "அதியமான்": "அதியமான் · Athiyaman",
    "பாரி": "பாரி · Pari",
    "ஆய்": "ஆய் · Ay",
}

PUNAM_MARKERS = re.compile(r"(?<!\d)(\d{1,4})(?!\d)")


def load_records() -> list[dict]:
    records = []
    for path in sorted(DATA_BASE.glob("*/normalized/*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    return records


def ordinal(record: dict) -> int | None:
    return record.get("number") or record.get("sectionNumber")


def detect_characters(text: str) -> list[str]:
    found = []
    for key, label in CHARACTERS.items():
        if key in text and label not in found:
            found.append(label)
    for key, label in DYNASTIES.items():
        if key in text and label not in found:
            found.append(label)
    return found[:8]


def score_puram(text: str) -> tuple[str, int]:
    best_id, best_score = "reflection", 1
    for key, meta in PURAM_ARCHETYPES.items():
        if key == "reflection":
            continue
        score = sum(1 for word in meta["keywords"] if word in text)
        if score > best_score:
            best_id, best_score = key, score
    return best_id, best_score


def story_from_record(record: dict) -> dict | None:
    poem = record.get("poem") or ""
    if poem in POST_SANGAM:
        return None
    tinai = record.get("tinai") or "unknown"
    urai = record.get("urai") or ""
    title = record.get("title") or ""
    text = record.get("sangamTamil") or ""
    combined = f"{title} {urai} {text}"

    if not urai and not text:
        return None

    if poem in AKAM_POEMS and tinai in AKAM_TINAI:
        kind = "akam"
        archetype = AKAM_ARCHETYPES[tinai]
        characters = detect_characters(combined)
        if not characters:
            characters = ["தலைவன் · hero", "தலைவி · heroine"]
        story_title = title or f"{archetype['ta']} · {record.get('id')}"
        return {
            "id": f"story-{record.get('id')}",
            "recordId": record.get("id"),
            "poem": poem,
            "ordinal": ordinal(record),
            "kind": "akam",
            "tinai": tinai,
            "archetype": archetype["id"],
            "titleTa": story_title,
            "titleEn": archetype["en"],
            "characters": characters,
            "setting": archetype["setting"],
            "conflict": archetype["conflict"],
            "turn": archetype["turn"],
            "resolution": archetype["resolution"],
            "theme": archetype["theme"],
            "evidence": {
                "text": text[:500],
                "urai": urai[:500],
                "title": title,
            },
            "confidence": 0.9,
        }

    archetype_id, score = score_puram(combined)
    archetype = PURAM_ARCHETYPES[archetype_id]
    characters = detect_characters(combined)
    if not characters:
        characters = ["புலவர் · poet", "வேந்தன் · king"] if "கொடை" in combined else ["புலவர் · poet"]
    story_title = title or f"{archetype['ta']} · {record.get('id')}"
    return {
        "id": f"story-{record.get('id')}",
        "recordId": record.get("id"),
        "poem": poem,
        "ordinal": ordinal(record),
        "kind": "puram",
        "tinai": tinai,
        "archetype": archetype["id"],
        "titleTa": story_title,
        "titleEn": archetype["en"],
        "characters": characters,
        "setting": "சங்ககாலத் தமிழகம் · Sangam Tamil country",
        "conflict": archetype["conflict"],
        "turn": archetype["turn"],
        "resolution": archetype["resolution"],
        "theme": archetype["theme"],
        "evidence": {
            "text": text[:500],
            "urai": urai[:500],
            "title": title,
        },
        "confidence": min(0.95, 0.55 + score * 0.08),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract akam and puram story seeds")
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args(argv)

    records = load_records()
    stories = [story for record in records if (story := story_from_record(record))]
    stories.sort(key=lambda item: (item["kind"], item["poem"], item["ordinal"] or 0))

    archetypes = list(AKAM_ARCHETYPES.values()) + list(PURAM_ARCHETYPES.values())
    output = {
        "schemaVersion": 1,
        "description": "Structured akam and puram story seeds extracted from Sangam verses and their urai. Every story keeps its record id and evidence; these are research seeds, not literary retellings.",
        "generatedBy": "cd backend/python && python -m knowledge.extract_stories",
        "recordsScanned": len(records),
        "archetypes": archetypes,
        "counts": {
            "total": len(stories),
            "akam": sum(1 for story in stories if story["kind"] == "akam"),
            "puram": sum(1 for story in stories if story["kind"] == "puram"),
        },
        "stories": stories,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(stories)} story seeds → {args.out}")
    print(f"  akam: {output['counts']['akam']} · puram: {output['counts']['puram']}")
    print("  archetypes:", dict(Counter(story['archetype'] for story in stories).most_common(12)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
