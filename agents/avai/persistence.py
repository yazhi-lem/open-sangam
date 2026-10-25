"""Session persistence selection for the Avai API.

ADK ships both an in-memory and a SQL-backed session service. The API picks
the SQL service when `AVAI_DATABASE_URL` (or `DATABASE_URL`) is present, so a
deploy can move from ephemeral sessions to durable Postgres/SQLite without a
code change. Local development and the no-database test suite stay on memory.
"""

from __future__ import annotations

import os
from typing import Any

DEFAULT_DB_ENV_VARS = ("AVAI_DATABASE_URL", "DATABASE_URL")


def database_url() -> str | None:
    for name in DEFAULT_DB_ENV_VARS:
        value = os.getenv(name)
        if value:
            return value
    return None


def build_session_service() -> Any:
    """Return an ADK session service based on deployment configuration."""
    url = database_url()
    if url:
        from google.adk.sessions import DatabaseSessionService

        return DatabaseSessionService(db_url=url)

    from google.adk.sessions import InMemorySessionService

    return InMemorySessionService()


def describe() -> dict[str, Any]:
    """Capability/health description without opening a connection."""
    url = database_url()
    if not url:
        return {
            "backend": "memory",
            "durable": False,
            "detail": "set AVAI_DATABASE_URL to enable SQL session persistence",
        }
    # Never echo credentials; only the SQLAlchemy driver family is useful.
    driver = url.split("://", 1)[0] if "://" in url else "unknown"
    return {
        "backend": "database",
        "durable": True,
        "driver": driver,
    }


__all__ = ["build_session_service", "database_url", "describe"]
