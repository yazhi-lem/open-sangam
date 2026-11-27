"""
poet_alias.py
-------------
One canonical spelling per poet, shared by every script that touches a `poet`
field.

Why this exists: the corpus was scraped from several sources, so the same poet
appears under different spacing and stray punctuation. Measured 2026-11-27:
565 distinct `poet` strings, which collapse to 511 once whitespace is ignored —
47 groups of duplicate spellings, e.g. four variants of பாலைபாடிய பெருங்கடுங்கோ.
Those duplicates produced duplicate `Poet -` notes in the generated Obsidian
vault and split the knowledge-graph poet nodes.

The alias table lives in `data/library/poet-aliases.json` and is derived from
(a) `data/library/tamilwiki-poets.json` — 1,660 poet names from tamil.wiki
    categories (CC BY-SA 4.0; names only, no article text), used as the
    authority for spelling, and
(b) the most frequent spelling already in the corpus, for poets the authority
    does not list.

Regenerate the table with `python -m normalizer.canonicalize_poets`; nothing in
this module writes.

Usage:
    from normalizer.poet_alias import canonical_poet
    canonical_poet("பாலை பாடிய பெருங் கடுங்கோ.")  ->  "பாலைபாடிய பெருங்கடுங்கோ"
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).parents[3]
ALIASES_PATH = REPO / "data" / "library" / "poet-aliases.json"

# Source artefacts that end up inside scraped poet names.
ANON_MARKERS = ("அறியப்படவில்லை", "பெயர் தெரியவில்லை", "unknown", "Unknown")

_TAMIL_ONLY = re.compile(r"[^\u0b80-\u0bff ]")

_cache: dict[str, str] | None = None


def name_key(name: str) -> str:
    """Match key: Tamil letters only, whitespace and punctuation removed.

    A name written in Latin script keeps its letters (lower-cased) instead of
    collapsing to an empty key — otherwise every romanised poet would share one
    key and be merged into a single canonical name.
    """
    text = unicodedata.normalize("NFC", name or "").replace("\u200b", "")
    tamil = re.sub(r"\s+", "", _TAMIL_ONLY.sub("", text))
    if tamil:
        return tamil
    return re.sub(r"\s+", "", text).lower()


def clean_poet(name: str | None) -> str | None:
    """Strip a scraped poet string down to something name-shaped."""
    if not name:
        return None
    text = unicodedata.normalize("NFC", name).replace("\u200b", "").replace("\t", " ")
    text = re.sub(r"\s+", " ", text).strip()
    text = text.strip(".。,;:·-").strip()
    if not text or any(marker in text for marker in ANON_MARKERS):
        return None
    return text


def load_aliases() -> dict[str, str]:
    global _cache
    if _cache is None:
        if ALIASES_PATH.exists():
            _cache = json.loads(ALIASES_PATH.read_text(encoding="utf-8")).get("aliases", {})
        else:
            _cache = {}
    return _cache


def canonical_poet(name: str | None) -> str | None:
    """Return the canonical spelling for a poet name, or None for anonymous."""
    cleaned = clean_poet(name)
    if not cleaned:
        return None
    return load_aliases().get(cleaned, cleaned)
