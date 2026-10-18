"""
corpus_io.py
------------
Read-only access to the normalized Sangam verse files under data/texts/, shared by
the vectorize pipeline. (These helpers used to live inside the Gemini translation
script, which has been removed.)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Anchor to this file's directory rather than the cwd, so the key loads whether
# the module is run from backend/python/ (normal) or from the repo root (CI).
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_BASE = REPO_ROOT / "data" / "texts"

# Poems in the order pipelines process them: the ten idylls first, then the shorter
# and the larger anthologies. Any other poem found on disk follows alphabetically.
POEM_ORDER: list[str] = [
    "mullaippattu",
    "nedunalvadai",
    "porunaratrupadai",
    "kurinjipattu",
    "sirupanatrupadai",
    "pattinappalai",
    "thirumurugatrupadai",
    "perumpanatrupadai",
    "malaipadukadam",
    "maduraikanchi",
    "paripadal",
    "pathitrupathu",
    "kalithokai",
    "akananooru",
    "purananooru",
    "natrinai",
    "kurunthokai",
    "ainkurunooru",
]


class PipelineError(RuntimeError):
    """A pipeline step failed (for example an embedding request)."""


def verse_files(poem_id: str) -> list[Path]:
    """Sorted normalized verse files for a poem.

    Non-verse files (a stray datapackage.json has been seen inside
    ainkurunooru/normalized/) are filtered out by the caller via `load_verse`,
    which returns None for anything lacking an `id`.
    """
    normalized_dir = DATA_BASE / poem_id / "normalized"
    if not normalized_dir.is_dir():
        return []
    return sorted(normalized_dir.glob("*.json"))


def load_verse(path: Path) -> Optional[dict]:
    """Load a normalized verse record, or None if the file is not a verse."""
    try:
        record = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(record, dict) or not record.get("id"):
        return None
    return record


def discovered_poems() -> list[str]:
    """Poem ids present on disk: POEM_ORDER first, then any extras alphabetically."""
    on_disk = {p.parent.name for p in DATA_BASE.glob("*/normalized")}
    ordered = [poem for poem in POEM_ORDER if poem in on_disk]
    extras = sorted(on_disk - set(ordered))
    return ordered + extras
