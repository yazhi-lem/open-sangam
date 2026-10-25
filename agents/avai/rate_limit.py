"""Distributed rate limiting with a safe in-process fallback.

Production deployments set `AVAI_REDIS_URL` (or `REDIS_URL`) so every Cloud
Run instance shares the same counters. If Redis is absent or temporarily
unreachable, the limiter falls back to its local sliding window rather than
failing requests — safe for a demo, and never more permissive than Redis.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import defaultdict, deque
from typing import Any

from . import telemetry
from .utils.http import client_key

logger = logging.getLogger(__name__)

WINDOW_SECONDS = 60.0


class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int):
        super().__init__("rate limit exceeded")
        self.retry_after = max(1, int(retry_after))


class AsyncRateLimiter:
    def __init__(
        self,
        redis_url: str | None = None,
        *,
        window_seconds: float = WINDOW_SECONDS,
    ):
        self.window_seconds = window_seconds
        self._redis: Any = None
        self._fallback: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        if redis_url:
            try:
                from redis.asyncio import from_url

                self._redis = from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=0.25,
                    socket_timeout=0.25,
                )
                logger.info("rate limiter: redis backend enabled")
            except Exception:
                logger.warning(
                    "rate limiter: redis unavailable, using in-process fallback",
                    exc_info=True,
                )

    @property
    def backend(self) -> str:
        return "redis" if self._redis is not None else "in_memory"

    async def hit(self, key: str, limit: int) -> None:
        if limit <= 0:
            return

        if self._redis is not None:
            try:
                await self._hit_redis(key, limit)
                return
            except RateLimitExceeded:
                raise
            except Exception:
                logger.warning(
                    "rate limiter: redis request failed, using fallback",
                    exc_info=True,
                )

        await self._hit_fallback(key, limit)

    async def _hit_redis(self, key: str, limit: int) -> None:
        now = time.time()
        window_id = int(now // self.window_seconds)
        redis_key = f"avai:rl:{key}:{window_id}"
        pipe = self._redis.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, int(self.window_seconds) + 1)
        count, _ = await pipe.execute()
        if int(count) > limit:
            retry_after = int(self.window_seconds - (now % self.window_seconds)) + 1
            telemetry.inc("avai_rate_limited_total", backend="redis")
            raise RateLimitExceeded(retry_after)

    async def _hit_fallback(self, key: str, limit: int) -> None:
        now = time.monotonic()
        async with self._lock:
            hits = self._fallback[key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                retry_after = max(
                    1, int(self.window_seconds - (now - hits[0])) + 1
                )
                telemetry.inc("avai_rate_limited_total", backend="in_memory")
                raise RateLimitExceeded(retry_after)
            hits.append(now)

    def reset(self) -> None:
        """Test helper; does not flush shared Redis keys."""
        self._fallback.clear()

    async def close(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception:
                pass


def describe(limiter: AsyncRateLimiter | None = None) -> dict[str, Any]:
    return {
        "backend": limiter.backend if limiter is not None else "unknown",
        "window_seconds": int(WINDOW_SECONDS),
        "distributed": limiter.backend == "redis" if limiter is not None else False,
        "redis_configured": bool(os.getenv("AVAI_REDIS_URL") or os.getenv("REDIS_URL")),
    }


__all__ = [
    "AsyncRateLimiter",
    "RateLimitExceeded",
    "client_key",
    "describe",
]
