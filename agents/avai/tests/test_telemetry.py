"""No-LLM tests for telemetry: request ids, metrics, and cost attribution."""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from avai import telemetry
from avai.api import app as app_module

client = TestClient(app_module.app)


class _FakePart:
    def __init__(self, text):
        self.text = text


class _FakeEvent:
    def __init__(self, text, token_in=0, token_out=0):
        self.content = SimpleNamespace(parts=[_FakePart(text)])
        self.usage_metadata = SimpleNamespace(
            prompt_token_count=token_in,
            candidates_token_count=token_out,
        )


@pytest.fixture(autouse=True)
def _clean_metrics():
    telemetry.reset_metrics()
    yield
    telemetry.reset_metrics()


def _fake_run_async_factory(reply_text: str, token_in=0, token_out=0):
    async def _fake_run_async(*, user_id, session_id, new_message):
        yield _FakeEvent(reply_text, token_in=token_in, token_out=token_out)

    return _fake_run_async


def test_request_id_and_traceparent_headers():
    resp = client.get(
        "/avai/health/live",
        headers={"X-Request-Id": "req-test-123"},
    )

    assert resp.status_code == 200
    assert resp.headers["X-Request-Id"] == "req-test-123"
    assert telemetry.parse_traceparent(resp.headers["traceparent"])


def test_upstream_traceparent_is_preserved():
    trace_id = "a" * 32
    resp = client.get(
        "/avai/health/live",
        headers={"traceparent": f"00-{trace_id}-{'b' * 16}-01"},
    )

    assert resp.headers["traceparent"].startswith(f"00-{trace_id}-")


def test_ask_records_tokens_cost_and_metrics(monkeypatch):
    monkeypatch.setattr(
        app_module._RUNNERS["avvaiyar"],
        "run_async",
        _fake_run_async_factory("kurunthokai_100 is kurinji.", token_in=1000, token_out=500),
    )

    resp = client.post(
        "/avai/ask",
        json={"message": "What tiṇai is kurunthokai_100?", "workflow": "qa"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["metadata"]["token_in"] == 1000
    assert body["metadata"]["token_out"] == 500
    assert body["metadata"]["cost_usd"] > 0
    assert body["metadata"]["cost_inr"] > 0

    metrics = client.get("/avai/metrics").json()
    counters = metrics["counters"]
    assert any(name.startswith("avai_model_calls_total") for name in counters)
    assert any("direction=\"input\"" in name for name in counters)
    assert any(name.startswith("avai_model_cost_usd_total") for name in counters)
    assert any(name.startswith("avai_model_cost_inr_total") for name in counters)
    assert any(name.startswith("avai_route_total") for name in counters)
    assert any(name.startswith("avai_http_requests_total") for name in counters)


def test_metrics_never_contain_prompt_or_user_id(monkeypatch):
    monkeypatch.setattr(
        app_module._RUNNERS["nakkirar"],
        "run_async",
        _fake_run_async_factory("வணக்கம்"),
    )
    user_id = "sensitive-user-42"
    resp = client.post("/avai/ask", json={"message": "hello", "user_id": user_id})

    assert resp.status_code == 200
    metrics = client.get("/avai/metrics")
    assert user_id not in metrics.text
    assert "hello" not in metrics.text


def test_extract_usage_and_cost_estimation():
    event = _FakeEvent("ok", token_in=2_000_000, token_out=1_000_000)
    assert telemetry.extract_usage(event) == (2_000_000, 1_000_000)

    cost = telemetry.estimate_cost_usd("gemini-2.5-flash", 2_000_000, 1_000_000)
    assert cost == pytest.approx(0.60 + 2.50)
    cost_inr = telemetry.estimate_cost_inr("gemini-2.5-flash", 2_000_000, 1_000_000)
    assert cost_inr == pytest.approx((0.60 + 2.50) * telemetry.usd_inr_rate(), abs=0.01)


def test_hash_id_is_stable_and_not_raw():
    hashed = telemetry.hash_id("session-abc")
    assert hashed == telemetry.hash_id("session-abc")
    assert hashed != "session-abc"
    assert len(hashed) == 16
