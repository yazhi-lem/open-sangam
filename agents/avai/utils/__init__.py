"""Small, dependency-light helpers shared across the Avai packages.

Keep this package pure: no FastAPI app state, no ADK runners, no network I/O.
"""

from .context import augment_with_context
from .http import allowed_origins, client_key
from .ids import (
    format_traceparent,
    hash_id,
    new_request_id,
    new_span_id,
    new_trace_id,
    parse_traceparent,
)
from .usage import (
    estimate_cost_inr,
    estimate_cost_usd,
    extract_usage,
    usd_inr_rate,
    usd_to_inr,
)

__all__ = [
    "allowed_origins",
    "augment_with_context",
    "client_key",
    "estimate_cost_inr",
    "estimate_cost_usd",
    "extract_usage",
    "format_traceparent",
    "hash_id",
    "new_request_id",
    "new_span_id",
    "new_trace_id",
    "parse_traceparent",
    "usd_inr_rate",
    "usd_to_inr",
]
