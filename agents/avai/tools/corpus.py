"""Corpus tools: load and search the normalized Sangam verse corpus.

Builds an in-memory index at import time from data/texts/*/normalized/*.json
so lookups and searches are cheap at request time (~2,032 verses, small
enough to hold entirely in memory).
"""

import json
from pathlib import Path
from typing import Optional

DATA_TEXTS = Path(__file__).resolve().parents[3] / "data" / "texts"

_TRIMMED_FIELDS = ("id", "poem", "number", "poet", "tinai", "sangamTamil", "urai", "english")


def _load_index() -> dict[str, dict]:
    index: dict[str, dict] = {}
    for normalized_dir in DATA_TEXTS.glob("*/normalized"):
        for verse_file in normalized_dir.glob("*.json"):
            verse = json.loads(verse_file.read_text(encoding="utf-8"))
            verse_id = verse.get("id")
            if verse_id is None:
                # Non-verse files (e.g. a stray datapackage.json) can end up
                # alongside normalized verses; skip anything without an id.
                continue
            index[verse_id] = verse
    return index


_VERSE_INDEX = _load_index()


def _trim(verse: dict) -> dict:
    return {field: verse.get(field) for field in _TRIMMED_FIELDS}


def get_verse(verse_id: str) -> dict:
    """Return the full normalized verse record for a verse id, e.g. 'kurunthokai_100'.

    Returns {"error": "..."} if the verse id is not found.
    """
    verse = _VERSE_INDEX.get(verse_id)
    if verse is None:
        return {"error": f"no verse with id {verse_id!r}"}
    return verse


def search_verses(
    query: str,
    tinai: Optional[str] = None,
    poem: Optional[str] = None,
    limit: int = 10,
) -> list[dict]:
    """Search verses whose Tamil text, urai, or cultural notes contain `query`.

    Optionally filter by tinai (e.g. 'kurinji') or poem (e.g. 'kurunthokai').
    Returns trimmed verse records (no per-word gloss data) capped at `limit`.
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
    """Return every poem's id and verse count, from the on-disk directory layout."""
    poems = []
    for normalized_dir in sorted(DATA_TEXTS.glob("*/normalized")):
        poem_id = normalized_dir.parent.name
        verse_count = sum(1 for _ in normalized_dir.glob("*.json"))
        poems.append({"poem": poem_id, "verseCount": verse_count})
    return poems
