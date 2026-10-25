"""Token-usage extraction and USD/INR cost attribution helpers."""

from __future__ import annotations

import os
from typing import Any

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
