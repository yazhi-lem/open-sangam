"""Deterministic Tamil grounding plugin for ADK Web.

Small local models often fail to call `get_verse` with the right id even when
the Tamil question is unambiguous. This plugin detects Tamil/English poem
names plus verse numbers, prefetches the canonical verse, and appends verified
evidence to the model request. The model still answers; Python supplies the
grounding and the Tamil-language instruction.

Enable in ADK Web:
    adk web --extra_plugins avai.grounding.TamilGroundingPlugin
"""

from __future__ import annotations

import re

from google.adk.plugins.base_plugin import BasePlugin
from google.genai import types

from .tools.corpus import get_verse

POEM_NAMES = {
    "குறுந்தொகை": "kurunthokai",
    "புறநானூறு": "purananooru",
    "நற்றிணை": "natrinai",
    "அகநானூறு": "akananooru",
    "கலித்தொகை": "kalithokai",
    "பதிற்றுப்பத்து": "pathitrupathu",
    "பரிபாடல்": "paripadal",
    "ஐங்குறுநூறு": "ainkurunooru",
    "மதுரைக்காஞ்சி": "maduraikanchi",
    "முல்லைப்பாட்டு": "mullaippattu",
    "நெடுநல்வாடை": "nedunalvadai",
    "பட்டினப்பாலை": "pattinappalai",
    "பொருநராற்றுப்படை": "porunaratrupadai",
    "சிறுபாணாற்றுப்படை": "sirupanatrupadai",
    "பெரும்பாணாற்றுப்படை": "perumpanatrupadai",
    "திருமுருகாற்றுப்படை": "thirumurugatrupadai",
    "குறிஞ்சிப்பாட்டு": "kurinjipattu",
    "மலைபடுகடாம்": "malaipadukadam",
}

_TAMIL_DIGITS = str.maketrans("௦௧௨௩௪௫௬௭௮௯", "0123456789")
_LATIN_VERSE_RE = re.compile(r"\b([a-z][a-z0-9]+)_(\d{1,4})\b", re.I)
_TAMIL_SCRIPT_RE = re.compile(r"[\u0B80-\u0BFF]")


def _normalise_digits(text: str) -> str:
    return text.translate(_TAMIL_DIGITS)


def extract_verse_id(text: str) -> str | None:
    """Return a canonical verse id from a Tamil or English query, if present."""
    normalized = _normalise_digits(text or "")
    match = _LATIN_VERSE_RE.search(normalized)
    if match:
        return f"{match.group(1).lower()}_{int(match.group(2))}"

    for tamil_name, poem_id in POEM_NAMES.items():
        match = re.search(re.escape(tamil_name) + r"\s*[_\-–—]?\s*(\d{1,4})", normalized)
        if match:
            return f"{poem_id}_{int(match.group(1))}"
    return None


def _evidence_hint(verse_id: str) -> str | None:
    verse = get_verse(verse_id)
    if "error" in verse:
        return None
    text = (verse.get("sangamTamil") or "").strip()
    if len(text) > 700:
        text = text[:700] + "…"
    return (
        "\n\n[Verified corpus evidence — use this instead of calling get_verse "
        "again. Cite the verse id exactly.]\n"
        f"verse_id={verse.get('id')}\n"
        f"poem={verse.get('poem')}\n"
        f"tinai={verse.get('tinai')}\n"
        f"poet={verse.get('poet')}\n"
        f"tamil={text}\n"
    )


class TamilGroundingPlugin(BasePlugin):
    """Prefetch verse evidence and enforce Tamil replies for Tamil inputs."""

    def __init__(self):
        super().__init__(name="tamil_grounding")

    async def before_model_callback(self, callback_context, llm_request):
        user_text = ""
        user_content = None
        for content in reversed(llm_request.contents or []):
            if getattr(content, "role", None) == "user":
                user_content = content
                for part in content.parts or []:
                    if getattr(part, "text", None):
                        user_text += part.text
                break

        if not user_text or user_content is None:
            return None

        hint = ""
        verse_id = extract_verse_id(user_text)
        if verse_id:
            evidence = _evidence_hint(verse_id)
            if evidence:
                hint += evidence

        if _TAMIL_SCRIPT_RE.search(user_text):
            hint += "\n[Reply in Tamil because the user wrote in Tamil.]\n"

        if not hint or hint.strip() in user_text:
            return None

        parts = list(user_content.parts or [])
        for index, part in enumerate(parts):
            if getattr(part, "text", None):
                parts[index] = types.Part(text=part.text + hint)
                break
        else:
            parts.append(types.Part(text=hint))
        user_content.parts = parts
        return None


__all__ = ["TamilGroundingPlugin", "extract_verse_id"]
