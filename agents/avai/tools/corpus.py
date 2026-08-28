"""Corpus tools: load and search the normalized Sangam verse corpus.
"""

import json
from pathlib import Path

DATA_TEXTS = Path(__file__).resolve().parents[3] / "data" / "texts"

_TRIMMED_FIELDS = ("id", "poem", "number", "poet", "tinai", "sangamTamil", "urai", "english")


def _load_index() -> dict[str, dict]:
    index: dict[str, dict] = {}
    for normalized_dir in DATA_TEXTS.glob("*/normalized"):
        for verse_file in normalized_dir.glob("*.json"):
            verse = json.loads(verse_file.read_text(encoding="utf-8"))
            verse_id = verse.get("id")
            if verse_id is None:
                continue
            index[verse_id] = verse
    return index


_VERSE_INDEX = _load_index()


def _trim(verse: dict) -> dict:
    return {field: verse.get(field) for field in _TRIMMED_FIELDS}


def get_verse(verse_id: str) -> dict:
    """சங்கப் பாடல் அடையாளத்தைக் (e.g. 'kurunthokai_100' அல்லது 'kurunthokai_40') கொண்டு முழுப் பாடலையும் தரவுத்தளத்திலிருந்து பெற்றுத் தரும் கருவி.
    """
    clean_id = verse_id.strip().lower()
    verse = _VERSE_INDEX.get(clean_id)
    if verse is None and "_" in clean_id:
        parts = clean_id.split("_")
        poem, num_str = parts[0], parts[1]
        if num_str.isdigit():
            num = int(num_str)
            for candidate in [
                f"{poem}_{num:03d}",
                f"{poem}_{num:02d}",
                f"{poem}_{num:04d}",
                f"{poem}_{num}",
            ]:
                if candidate in _VERSE_INDEX:
                    return _VERSE_INDEX[candidate]

    if verse is None:
        return {"error": f"பாடலைக் கண்டுபிடிக்க முடியவில்லை: {verse_id!r}"}
    return verse


def search_verses(
    query: str,
    tinai: str | None = None,
    poem: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """தமிழ் மூலப் பாடல், உரை அல்லது பொருண்மை அடிப்படையில் சங்கப் பாடல்களைத் தேடும் கருவி.
    """
    query_lower = query.lower()
    results = []
    for verse in _VERSE_INDEX.values():
        if tinai and verse.get("tinai") != tinai:
            continue
        if poem and verse.get("poem") != poem:
            continue
        haystack = " ".join(
            str(verse.get(field, "") or "")
            for field in ("sangamTamil", "urai", "english")
        )
        cultural_notes = verse.get("culturalNotes") or []
        haystack += " " + " ".join(str(note) for note in cultural_notes)
        if query_lower in haystack.lower():
            results.append(_trim(verse))
        if len(results) >= limit:
            break
    return results


def list_poems() -> list[dict]:
    """சங்க இலக்கியத் தொகுப்புகளின் பட்டியல் மற்றும் பாடல் எண்ணிக்கையைப் பெற்றுத் தரும் கருவி.
    """
    poems = []
    for normalized_dir in sorted(DATA_TEXTS.glob("*/normalized")):
        poem_id = normalized_dir.parent.name
        verse_count = sum(1 for _ in normalized_dir.glob("*.json"))
        poems.append({"poem": poem_id, "verseCount": verse_count})
    return poems
