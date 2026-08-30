"""Tiṇai context tool: query data/knowledge/tinai_context.json."""

import json
from pathlib import Path

TINAI_FILE = Path(__file__).resolve().parents[3] / "data" / "knowledge" / "tinai_context.json"

_TINAI_CONTEXT = json.loads(TINAI_FILE.read_text(encoding="utf-8"))


def get_tinai_context(tinai: str) -> dict:
    """குறிஞ்சி, முல்லை, மருதம், நெய்தல், பாலை ஆகிய ஐந்து திணைகளின் நிலம், உரிப்பொருள், கருப்பொருள் மற்றும் பாடல்களைப் பெற்றுத் தரும் கருவி.
    """
    context = _TINAI_CONTEXT.get(tinai)
    if context is None:
        return {"error": f"திணை சூழல் கிடைக்கவில்லை: {tinai!r}; எதிர்பார்க்கப்படும் திணைகள்: {list(_TINAI_CONTEXT)}"}
    return context
