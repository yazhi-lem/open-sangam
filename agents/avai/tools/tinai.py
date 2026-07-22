"""Tiṇai context tool: query data/knowledge/tinai_context.json."""

import json
from pathlib import Path

TINAI_FILE = Path(__file__).resolve().parents[3] / "data" / "knowledge" / "tinai_context.json"

_TINAI_CONTEXT = json.loads(TINAI_FILE.read_text(encoding="utf-8"))


def get_tinai_context(tinai: str) -> dict:
    """Return cultural context for a tiṇai: verse counts, top poets, poem breakdown,
    and attested karu (flora/fauna/landscape/people/deity) with sample verse ids.

    Valid tinai values: 'kurinji', 'mullai', 'marutam', 'neytal', 'palai'.
    """
    context = _TINAI_CONTEXT.get(tinai)
    if context is None:
        return {"error": f"no tinai context for {tinai!r}; expected one of {list(_TINAI_CONTEXT)}"}
    return context
