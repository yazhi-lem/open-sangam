"""Optional service-to-service authentication for /avai/ask.

Set `AVAI_API_TOKEN` in production to require a bearer token. Health,
readiness, capabilities, and metrics stay public so probes and the frontend
status badge keep working. Leave it unset for local development and tests.
"""

from __future__ import annotations

import hmac
import os

from fastapi import HTTPException, Request

from . import telemetry


def require_api_token(request: Request) -> None:
    expected = os.getenv("AVAI_API_TOKEN")
    if not expected:
        return

    header = request.headers.get("authorization", "")
    scheme, _, provided = header.partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(provided, expected):
        telemetry.inc("avai_auth_failures_total", route=request.url.path)
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Avai API token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


__all__ = ["require_api_token"]
