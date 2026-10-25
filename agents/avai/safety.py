"""Deterministic pre/post safety guards for Avai.

This is not a replacement for a full moderation model. It catches the
highest-risk, low-ambiguity cases cheaply:

- prompt-injection attempts that try to override system instructions
- credential/secret leakage in model output
- obvious script/URL injection in markdown output

Literary discussion of violence, war, or ethics is intentionally allowed —
Sangam poetry contains all of those. Tamil and transliterated variants are
covered alongside English.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class SafetyResult:
    allowed: bool
    category: str = "ok"
    reason: str = ""
    matched: str | None = None


_PROMPT_INJECTION_PATTERNS = [
    re.compile(r"\bignore\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions?\b", re.I),
    re.compile(r"\bdisregard\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions?\b", re.I),
    re.compile(r"\b(reveal|show|print|repeat)\s+(the\s+)?(system|developer)\s+(prompt|instructions?)\b", re.I),
    re.compile(r"\byou\s+are\s+now\s+(in\s+)?(developer|god|admin|jailbreak)\s*mode\b", re.I),
    re.compile(r"\b(jailbreak|developer\s+mode|do\s+anything\s+now)\b", re.I),
    re.compile(
        r"(முந்தைய|முன்னைய|மேலேயுள்ள)\s*(வழிமுறைகளை|கட்டளைகளை|அறிவுறுத்தல்களை).{0,24}(புறக்கணி|மறந்து|மீறு)",
        re.I,
    ),
    re.compile(
        r"(உள்|சிஸ்டம்|முறைமை)\s*(வழிமுறைகளை|கட்டளைகளை|ப்ராம்ப்ட்|prompt).{0,24}(காட்டு|வெளிப்படுத்து|சொல்)",
        re.I,
    ),
    re.compile(r"\b(munnadiya|munnadi|previous)\s+(instruction|vazhimurai|kattalai)\b", re.I),
]

_SECRET_PATTERNS = [
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b"),
    re.compile(r"\bAIza[0-9A-Za-z_-]{20,}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    re.compile(r"\b(postgres(?:ql)?|mysql|redis)://[^\s\"']+", re.I),
    re.compile(r"\bBearer\s+[A-Za-z0-9._-]{16,}\b", re.I),
]

_SCRIPT_PATTERNS = [
    re.compile(r"<\s*script\b", re.I),
    re.compile(r"javascript\s*:", re.I),
    re.compile(r"\bon(?:error|load|click)\s*=", re.I),
]

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text or "")


def inspect_input(message: str) -> SafetyResult:
    text = normalize_text(message)
    if not text.strip():
        return SafetyResult(False, "empty_input", "message is empty")
    if _CONTROL_CHARS.search(text):
        return SafetyResult(False, "control_characters", "message contains control characters")

    for pattern in _PROMPT_INJECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            return SafetyResult(
                False,
                "prompt_injection",
                "message attempts to override Avai instructions",
                match.group(0)[:80],
            )
    return SafetyResult(True)


def inspect_output(text: str) -> SafetyResult:
    for pattern in _SECRET_PATTERNS:
        match = pattern.search(text or "")
        if match:
            return SafetyResult(
                False,
                "secret_leak",
                "output contains a credential-like value",
                match.group(0)[:24],
            )
    for pattern in _SCRIPT_PATTERNS:
        match = pattern.search(text or "")
        if match:
            return SafetyResult(
                False,
                "script_injection",
                "output contains executable markup",
                match.group(0)[:40],
            )
    return SafetyResult(True)


def redact_secrets(text: str) -> str:
    redacted = text or ""
    for pattern in _SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED]", redacted)
    return redacted


def sanitize_output(text: str) -> str:
    """Redact secrets and neutralize executable markup before returning text."""
    safe = redact_secrets(text)
    for pattern in _SCRIPT_PATTERNS:
        safe = pattern.sub("[BLOCKED]", safe)
    return safe


__all__ = [
    "SafetyResult",
    "inspect_input",
    "inspect_output",
    "normalize_text",
    "redact_secrets",
    "sanitize_output",
]
