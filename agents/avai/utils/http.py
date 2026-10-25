"""HTTP request helpers shared by middleware and rate limiting."""

from __future__ import annotations

import os

from starlette.requests import Request


def allowed_origins() -> list[str]:
    """Comma-separated CORS allow-list; unset keeps the local-dev allow-all."""
    raw = os.getenv("AVAI_ALLOWED_ORIGINS", "*")
    return [origin.strip() for origin in raw.split(",") if origin.strip()] or ["*"]


def client_key(request: Request) -> str:
    """Use the rightmost X-Forwarded-For entry appended by the hosting front end."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"
