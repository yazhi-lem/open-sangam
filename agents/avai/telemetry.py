"""Lightweight, dependency-free telemetry for the Avai API.

This is the first observability layer: structured JSON logs, W3C-compatible
request/trace ids, in-process counters/histograms, and model cost attribution.
It deliberately has no hard OpenTelemetry dependency so the API keeps working
on minimal images; the same request/trace ids can later be exported to OTel
without changing call sites.

Design rules:
- Never log raw prompts, responses, API keys, or user ids.
- Hash session/user identifiers before they leave the request.
- Expose aggregate metrics only via /avai/metrics (no secrets/content).
"""

from __future__ import annotations

import contextvars
import hashlib
import json
import logging
import os
import re
import threading
import time
import uuid
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterator

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

SERVICE_NAME = "avai-api"
SERVICE_VERSION = os.getenv("AVAI_VERSION", "0.1.0")
REQUEST_ID_HEADER = "X-Request-Id"
TRACEPARENT_HEADER = "traceparent"

_TRACEPARENT_RE = re.compile(r"^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$")


@dataclass
class RequestContext:
    request_id: str
    trace_id: str
    span_id: str
    route: str = ""
    workflow: str | None = None
    pulavar: str | None = None
    session_id_hash: str | None = None
    user_id_hash: str | None = None


_current: contextvars.ContextVar[RequestContext | None] = contextvars.ContextVar(
    "avai_request_context", default=None
)


def hash_id(value: str | None) -> str | None:
    """Stable, non-reversible id for logs/metrics. Never emit the raw value."""
    if not value:
        return None
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


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


def current_context() -> RequestContext | None:
    return _current.get()


def bind_request_context(
    *,
    request_id: str | None = None,
    trace_id: str | None = None,
    route: str = "",
) -> RequestContext:
    existing = _current.get()
    if existing and request_id is None and trace_id is None:
        existing.route = route or existing.route
        return existing
    ctx = RequestContext(
        request_id=request_id or uuid.uuid4().hex,
        trace_id=trace_id or new_trace_id(),
        span_id=new_span_id(),
        route=route,
    )
    _current.set(ctx)
    return ctx


def reset_request_context() -> None:
    _current.set(None)


def set_request_identity(
    *,
    session_id: str | None = None,
    user_id: str | None = None,
    workflow: str | None = None,
    pulavar: str | None = None,
) -> None:
    ctx = _current.get()
    if ctx is None:
        return
    if session_id is not None:
        ctx.session_id_hash = hash_id(session_id)
    if user_id is not None:
        ctx.user_id_hash = hash_id(user_id)
    if workflow is not None:
        ctx.workflow = workflow
    if pulavar is not None:
        ctx.pulavar = pulavar


class JsonLogFormatter(logging.Formatter):
    """Single-line JSON logs with trace correlation and no free-form payloads."""

    _EXTRA_FIELDS = (
        "request_id",
        "trace_id",
        "span_id",
        "route",
        "status_code",
        "duration_ms",
        "workflow",
        "pulavar",
        "provider",
        "model",
        "token_in",
        "token_out",
        "cost_usd",
        "session_id_hash",
        "user_id_hash",
        "error_code",
    )

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "severity": record.levelname,
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in self._EXTRA_FIELDS:
            if hasattr(record, field):
                payload[field] = getattr(record, field)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


_CONFIGURED = False


def configure_logging() -> None:
    """Install JSON logging once, unless AVAI_LOG_JSON=0 is set."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True
    level = os.getenv("AVAI_LOG_LEVEL", "INFO").upper()
    root = logging.getLogger()
    root.setLevel(level)
    if os.getenv("AVAI_LOG_JSON", "1") == "0":
        return
    handler = logging.StreamHandler()
    handler.setFormatter(JsonLogFormatter())
    root.handlers = [handler]


# --- metrics -------------------------------------------------------------

_LOCK = threading.Lock()
_COUNTERS: dict[str, float] = defaultdict(float)
_HISTOGRAMS: dict[str, list[float]] = defaultdict(list)
_MAX_SAMPLES = 2048


def _key(name: str, labels: dict[str, Any] | None) -> str:
    if not labels:
        return name
    rendered = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()) if v is not None)
    return f"{name}{{{rendered}}}" if rendered else name


def inc(name: str, value: float = 1.0, **labels: Any) -> None:
    with _LOCK:
        _COUNTERS[_key(name, labels)] += value


def observe(name: str, value: float, **labels: Any) -> None:
    with _LOCK:
        samples = _HISTOGRAMS[_key(name, labels)]
        samples.append(float(value))
        if len(samples) > _MAX_SAMPLES:
            del samples[: len(samples) - _MAX_SAMPLES]


def _percentile(sorted_values: list[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    index = min(len(sorted_values) - 1, max(0, int(round((pct / 100) * (len(sorted_values) - 1)))))
    return sorted_values[index]


def snapshot() -> dict[str, Any]:
    """Aggregate counters and histogram summaries for /avai/metrics."""
    with _LOCK:
        counters = dict(_COUNTERS)
        histograms = {name: list(values) for name, values in _HISTOGRAMS.items()}

    summary: dict[str, Any] = {}
    for name, values in histograms.items():
        ordered = sorted(values)
        count = len(ordered)
        total = sum(ordered)
        summary[name] = {
            "count": count,
            "sum": round(total, 3),
            "avg": round(total / count, 3) if count else 0.0,
            "p50": round(_percentile(ordered, 50), 3),
            "p95": round(_percentile(ordered, 95), 3),
            "p99": round(_percentile(ordered, 99), 3),
            "min": round(ordered[0], 3) if ordered else 0.0,
            "max": round(ordered[-1], 3) if ordered else 0.0,
        }
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "exchange_rate_usd_inr": usd_inr_rate(),
        "counters": counters,
        "histograms": summary,
    }


def reset_metrics() -> None:
    """Test helper — also useful after a canary reset."""
    with _LOCK:
        _COUNTERS.clear()
        _HISTOGRAMS.clear()


# --- model cost attribution ---------------------------------------------

# INR attribution is configurable because FX moves; the default is only a
# fallback for local dev. Set AVAI_USD_INR_RATE in production.
DEFAULT_USD_INR_RATE = 88.0

# USD per 1M tokens. Override per deployment without changing code.
_DEFAULT_PRICING_PER_MTOK = {
    "google/gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash": (0.30, 2.50),
    "google/gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.5-flash-lite": (0.10, 0.40),
}


def usd_inr_rate() -> float:
    return float(os.getenv("AVAI_USD_INR_RATE", str(DEFAULT_USD_INR_RATE)))


def usd_to_inr(cost_usd: float) -> float:
    return round(cost_usd * usd_inr_rate(), 4)


def estimate_cost_usd(model: str, token_in: int, token_out: int) -> float:
    input_price = os.getenv("AVAI_MODEL_INPUT_PRICE_PER_MTOK")
    output_price = os.getenv("AVAI_MODEL_OUTPUT_PRICE_PER_MTOK")
    if input_price and output_price:
        in_per_m, out_per_m = float(input_price), float(output_price)
    else:
        in_per_m, out_per_m = _DEFAULT_PRICING_PER_MTOK.get(model, (0.0, 0.0))
    return round((token_in / 1_000_000) * in_per_m + (token_out / 1_000_000) * out_per_m, 8)


def estimate_cost_inr(model: str, token_in: int, token_out: int) -> float:
    return usd_to_inr(estimate_cost_usd(model, token_in, token_out))


def extract_usage(event: Any) -> tuple[int, int]:
    """Best-effort token usage from an ADK event; returns (input, output)."""
    usage = getattr(event, "usage_metadata", None) or getattr(event, "usageMetadata", None)
    if usage is None:
        return 0, 0
    token_in = (
        getattr(usage, "prompt_token_count", None)
        or getattr(usage, "promptTokenCount", None)
        or 0
    )
    token_out = (
        getattr(usage, "candidates_token_count", None)
        or getattr(usage, "candidatesTokenCount", None)
        or 0
    )
    return int(token_in or 0), int(token_out or 0)


def record_model_call(
    *,
    provider: str,
    model: str,
    latency_ms: float,
    token_in: int = 0,
    token_out: int = 0,
    status: str = "ok",
) -> float:
    cost = estimate_cost_usd(model, token_in, token_out)
    cost_inr = usd_to_inr(cost)
    labels = {"provider": provider, "model": model, "status": status}
    inc("avai_model_calls_total", **labels)
    observe("avai_model_duration_ms", latency_ms, **labels)
    if token_in:
        inc("avai_model_tokens_total", token_in, **labels, direction="input")
    if token_out:
        inc("avai_model_tokens_total", token_out, **labels, direction="output")
    if cost:
        inc("avai_model_cost_usd_total", cost, **labels)
        inc("avai_model_cost_inr_total", cost_inr, **labels)
    return cost


@contextmanager
def timer(name: str, **labels: Any) -> Iterator[dict[str, Any]]:
    """Measure a block and record it as a histogram; yields a mutable result."""
    start = time.monotonic()
    result: dict[str, Any] = {}
    try:
        yield result
    finally:
        elapsed = (time.monotonic() - start) * 1000
        result["duration_ms"] = round(elapsed, 3)
        observe(name, elapsed, **labels)


# --- HTTP middleware -----------------------------------------------------


class TelemetryMiddleware(BaseHTTPMiddleware):
    """Bind request/trace ids, log one structured access record, add headers."""

    async def dispatch(self, request: Request, call_next):
        trace_id = parse_traceparent(request.headers.get(TRACEPARENT_HEADER))
        ctx = bind_request_context(
            request_id=request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex,
            trace_id=trace_id,
            route=request.url.path,
        )
        start = time.monotonic()
        logger = logging.getLogger("avai.access")
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            logger.exception(
                "request failed",
                extra={
                    "request_id": ctx.request_id,
                    "trace_id": ctx.trace_id,
                    "route": ctx.route,
                    "error_code": "unhandled_exception",
                },
            )
            inc("avai_http_errors_total", route=ctx.route)
            raise
        finally:
            elapsed_ms = round((time.monotonic() - start) * 1000, 3)
            inc("avai_http_requests_total", route=ctx.route, status=str(status_code))
            observe("avai_http_duration_ms", elapsed_ms, route=ctx.route)
            logger.info(
                "request completed",
                extra={
                    "request_id": ctx.request_id,
                    "trace_id": ctx.trace_id,
                    "route": ctx.route,
                    "status_code": status_code,
                    "duration_ms": elapsed_ms,
                    "workflow": ctx.workflow,
                    "pulavar": ctx.pulavar,
                    "session_id_hash": ctx.session_id_hash,
                    "user_id_hash": ctx.user_id_hash,
                },
            )
            if "response" in locals():
                response.headers[REQUEST_ID_HEADER] = ctx.request_id
                response.headers[TRACEPARENT_HEADER] = format_traceparent(
                    ctx.trace_id, ctx.span_id
                )
            reset_request_context()


__all__ = [
    "REQUEST_ID_HEADER",
    "TRACEPARENT_HEADER",
    "TelemetryMiddleware",
    "bind_request_context",
    "configure_logging",
    "current_context",
    "estimate_cost_inr",
    "estimate_cost_usd",
    "extract_usage",
    "format_traceparent",
    "hash_id",
    "inc",
    "observe",
    "parse_traceparent",
    "record_model_call",
    "reset_metrics",
    "reset_request_context",
    "set_request_identity",
    "snapshot",
    "timer",
    "usd_inr_rate",
    "usd_to_inr",
]
