"""Tests for durable-session selection and the distributed rate limiter."""

import asyncio

import pytest
from google.adk.sessions import DatabaseSessionService, InMemorySessionService

from avai import persistence
from avai.rate_limit import AsyncRateLimiter, RateLimitExceeded


def test_memory_is_default_without_database_url(monkeypatch):
    monkeypatch.delenv("AVAI_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert isinstance(persistence.build_session_service(), InMemorySessionService)
    assert persistence.describe()["backend"] == "memory"
    assert persistence.describe()["durable"] is False


def test_database_backend_selected_when_url_present(monkeypatch, tmp_path):
    db_path = tmp_path / "avai-sessions.db"
    monkeypatch.setenv("AVAI_DATABASE_URL", f"sqlite:///{db_path}")

    service = persistence.build_session_service()

    assert isinstance(service, DatabaseSessionService)
    assert db_path.exists()
    assert persistence.describe() == {
        "backend": "database",
        "durable": True,
        "driver": "sqlite",
    }


def _run_limiter(limiter: AsyncRateLimiter, calls: list[tuple[str, int]]):
    async def runner():
        results = []
        for key, limit in calls:
            try:
                await limiter.hit(key, limit)
                results.append("ok")
            except RateLimitExceeded as exc:
                results.append(exc.retry_after)
        return results

    return asyncio.run(runner())


def test_in_memory_rate_limiter_enforces_per_key():
    limiter = AsyncRateLimiter(None)

    results = _run_limiter(limiter, [("a", 2), ("a", 2), ("a", 2), ("b", 2)])

    assert results[0] == "ok"
    assert results[1] == "ok"
    assert isinstance(results[2], int) and results[2] >= 1
    assert results[3] == "ok"


class _FakePipeline:
    def __init__(self, store):
        self.store = store
        self.key = None

    def incr(self, key):
        self.key = key
        return self

    def expire(self, key, seconds):
        return self

    async def execute(self):
        self.store[self.key] = self.store.get(self.key, 0) + 1
        return [self.store[self.key], True]


class _FakeRedis:
    def __init__(self):
        self.store = {}

    def pipeline(self):
        return _FakePipeline(self.store)


def test_redis_rate_limiter_uses_shared_counter():
    limiter = AsyncRateLimiter(None)
    limiter._redis = _FakeRedis()

    results = _run_limiter(limiter, [("shared", 2), ("shared", 2), ("shared", 2)])

    assert results[0] == "ok"
    assert results[1] == "ok"
    assert isinstance(results[2], int) and results[2] >= 1
    assert limiter.backend == "redis"


class _BrokenRedis:
    def pipeline(self):
        raise RuntimeError("redis down")


def test_redis_failure_falls_back_instead_of_breaking_requests():
    limiter = AsyncRateLimiter(None)
    limiter._redis = _BrokenRedis()

    results = _run_limiter(limiter, [("x", 1), ("x", 1)])

    assert results[0] == "ok"
    assert isinstance(results[1], int) and results[1] >= 1
