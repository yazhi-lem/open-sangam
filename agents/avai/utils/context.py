"""Prompt-context helpers."""

from __future__ import annotations

from typing import Any


def augment_with_context(message: str, context: Any) -> str:
    """Append optional tinai/poem/limit hints to the user message."""
    hints = []
    if getattr(context, "tinai", None):
        hints.append(f"tiṇai={context.tinai}")
    if getattr(context, "poem", None):
        hints.append(f"poem={context.poem}")
    if getattr(context, "limit", 10) != 10:
        hints.append(f"limit={context.limit}")
    if not hints:
        return message
    return f"{message}\n\n[Context hints: {', '.join(hints)}]"
