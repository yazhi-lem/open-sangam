"""In-memory session bookkeeping for the /avai/ask REST API.

MVP session store: conversation state itself lives inside ADK's
`InMemorySessionService` (one instance per process, created in app.py). This
module only tracks which session ids exist and when they were last touched,
so a request can tell "reuse this session" apart from "first turn", and idle
sessions can be pruned. It does not survive a process restart and does not
scale past a single instance — swap for Redis/Postgres before that matters
(see docs/api/avai-ask-prd.md §Phase 5, Session Persistence).
"""

import os
import time
from dataclasses import dataclass, field

APP_NAME = "avai-ask-api"


def _ttl_seconds() -> int:
    return int(os.getenv("AVAI_SESSION_TTL_SECONDS", "3600"))


@dataclass
class _SessionRecord:
    user_id: str
    last_touched: float = field(default_factory=time.time)


_sessions: dict[str, _SessionRecord] = {}


def touch(session_id: str, user_id: str) -> None:
    """Record that `session_id` was just used (creating or refreshing it)."""
    _sessions[session_id] = _SessionRecord(user_id=user_id, last_touched=time.time())


def exists(session_id: str) -> bool:
    return session_id in _sessions


def prune_expired(ttl_seconds: int = None) -> int:
    """Drop bookkeeping for sessions idle past `ttl_seconds`; returns count pruned.

    Defaults to the AVAI_SESSION_TTL_SECONDS env var (see .env.example),
    re-read on each call so tests/deployments can override it without a
    process restart. This does not evict the underlying ADK session (no
    public eviction API on InMemorySessionService) — it only stops
    /avai/ask from treating a stale session id as continuable, so a pruned
    id starts a fresh conversation on next use rather than silently
    resuming ancient context.
    """
    if ttl_seconds is None:
        ttl_seconds = _ttl_seconds()
    now = time.time()
    expired = [sid for sid, rec in _sessions.items() if now - rec.last_touched > ttl_seconds]
    for sid in expired:
        del _sessions[sid]
    return len(expired)
