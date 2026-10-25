"""Request/trace identifier helpers."""

from __future__ import annotations

import hashlib
import re
import uuid

_TRACEPARENT_RE = re.compile(r"^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$")


def hash_id(value: str | None) -> str | None:
    """Stable, non-reversible id for logs/metrics. Never emit the raw value."""
    if not value:
        return None
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def new_request_id() -> str:
    return uuid.uuid4().hex


def new_trace_id() -> str:
    return uuid.uuid4().hex


def new_span_id() -> str:
    return uuid.uuid4().hex[:16]


def parse_traceparent(header: str | None) -> str | None:
    """Return the 32-hex trace id from a W3C traceparent header, if valid."""
    if not header:
        return None
    match = _TRACEPARENT_RE.match(header.strip().lower())
    return match.group(1) if match else None


def format_traceparent(trace_id: str, span_id: str, sampled: bool = True) -> str:
    flags = "01" if sampled else "00"
    return f"00-{trace_id}-{span_id}-{flags}"
