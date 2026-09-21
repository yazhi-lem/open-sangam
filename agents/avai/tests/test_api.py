"""No-LLM tests for the /avai/ask REST API: schema validation, error shapes,
citation extraction, and session id handling. The agent Runner is monkeypatched
so this suite runs without an OPENROUTER_API_KEY, matching the rest of
avai/tests (see avai/evals/qa_smoke.py for the live-LLM equivalent).
"""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from avai.api import app as app_module

client = TestClient(app_module.app)


class _FakePart:
    def __init__(self, text):
        self.text = text


class _FakeEvent:
    def __init__(self, text):
        self.content = SimpleNamespace(parts=[_FakePart(text)])


def _fake_run_async_factory(reply_text: str):
    async def _fake_run_async(*, user_id, session_id, new_message):
        yield _FakeEvent(reply_text)

    return _fake_run_async


@pytest.fixture(autouse=True)
def _reset_sessions():
    app_module.sessions._sessions.clear()
    yield
    app_module.sessions._sessions.clear()


def test_health():
    resp = client.get("/avai/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ask_qa_workflow_extracts_real_citation(monkeypatch):
    monkeypatch.setattr(
        app_module._RUNNERS["avvaiyar"],
        "run_async",
        _fake_run_async_factory("kurunthokai_100 is in the kurinji tiṇai."),
    )

    resp = client.post("/avai/ask", json={"message": "What tiṇai is kurunthokai_100?"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["workflow"] == "qa"
    assert body["poet"] == "avvaiyar"
    assert body["response_text"] == "kurunthokai_100 is in the kurinji tiṇai."
    assert len(body["citations"]) == 1
    assert body["citations"][0]["verse_id"] == "kurunthokai_100"
    assert body["citations"][0]["tinai"] == "kurinji"
    assert body["session_id"]
    assert body["metadata"]["elapsed_ms"] >= 0


def test_ask_drops_hallucinated_citation(monkeypatch):
    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(
            runner,
            "run_async",
            _fake_run_async_factory("See not_a_real_id for details."),
        )

    resp = client.post("/avai/ask", json={"message": "hello"})

    assert resp.status_code == 200
    assert resp.json()["citations"] == []


def test_ask_reuses_supplied_session_id(monkeypatch):
    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(runner, "run_async", _fake_run_async_factory("ok"))

    resp = client.post(
        "/avai/ask", json={"message": "hello", "session_id": "sess-fixed-1"}
    )

    assert resp.status_code == 200
    assert resp.json()["session_id"] == "sess-fixed-1"
    assert app_module.sessions.exists("sess-fixed-1")


def test_ask_requires_message():
    resp = client.post("/avai/ask", json={})
    assert resp.status_code == 400
    assert "message" in resp.json()["message"]


def test_ask_rejects_empty_message():
    resp = client.post("/avai/ask", json={"message": ""})
    assert resp.status_code == 400


@pytest.mark.parametrize(
    "workflow,expected_pulavar",
    [("search", "kapilar"), ("reimagine", "kapilar"), ("scenario", "tholkappiyar"), ("imagery", "paranar")],
)
def test_ask_routes_workflow_to_expected_pulavar(monkeypatch, workflow, expected_pulavar):
    monkeypatch.setattr(
        app_module._RUNNERS[expected_pulavar], "run_async", _fake_run_async_factory("ok")
    )

    resp = client.post("/avai/ask", json={"message": "hi", "workflow": workflow})

    assert resp.status_code == 200
    assert resp.json()["pulavar"] == expected_pulavar


@pytest.mark.parametrize(
    "payload,expected_workflow,expected_pulavar",
    [
        ({"message": "find verses about love"}, "search", "kapilar"),
        ({"message": "முல்லை நிலத்து மழை பற்றிய பாடல்கள்"}, "search", "kapilar"),
        ({"message": "hii"}, "general", "nakkirar"),
        ({"message": "what is your workflow?"}, "general", "nakkirar"),
        ({"message": "who are you?"}, "general", "nakkirar"),
        (
            {"message": "find verses about love", "pulavar": "nakkirar"},
            "general",
            "nakkirar",
        ),
        ({"message": "காதல் பற்றிய பாடல்களைத் தேடு"}, "search", "kapilar"),
        ({"message": "மழையையும் மேகங்களையும் கார் காலத்தையும் வருணிக்கும் முல்லைப் பாடல்கள் எவை?"}, "search", "kapilar"),
        ({"message": "draw a scene of the seashore"}, "imagery", "paranar"),
        ({"message": "explain grammar and prosody rules in tolkappiyam"}, "scenario", "tholkappiyar"),
        ({"message": "what is the meaning of kurunthokai_40?"}, "qa", "avvaiyar"),
        ({"message": "குறுந்தொகை 40 பாடலின் பொருள் என்ன?"}, "qa", "avvaiyar"),
        ({"message": "நேற்று வரை இந்த பாடலின் பொருள் என்ன?"}, "qa", "avvaiyar"),
        ({"message": "இதுவரை எத்தனை பாடல்கள் உள்ளன?"}, "general", "nakkirar"),
        ({"message": "ஒரு காட்சி வரை"}, "imagery", "paranar"),
        ({"message": "ஓவியம் வரை"}, "imagery", "paranar"),
        ({"message": "படம் வரை"}, "imagery", "paranar"),
        ({"message": "ஒரு ஓவியம் வரைந்து தா"}, "imagery", "paranar"),
        ({"message": "xyz random unrecognized query 12345"}, "general", "nakkirar"),
    ],
)
def test_routing_regression(monkeypatch, payload, expected_workflow, expected_pulavar):
    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(runner, "run_async", _fake_run_async_factory("ok"))

    resp = client.post("/avai/ask", json=payload)

    assert resp.status_code == 200
    body = resp.json()
    assert body["workflow"] == expected_workflow
    assert body["pulavar"] == expected_pulavar
    assert body["metadata"]["routed_pulavar"] == expected_pulavar
    assert body["metadata"]["routing_reason"] is not None
    if payload.get("pulavar"):
        assert body["metadata"]["routing_reason"] == "explicit_pulavar_selected"
        assert body.get("routing_reason") == "explicit_pulavar_selected"


def test_intent_routing_ordinary_word_image(monkeypatch):
    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(runner, "run_async", _fake_run_async_factory("ok"))

    resp = client.post(
        "/avai/ask",
        json={"message": "What is the image of a king in classical society?"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["workflow"] != "imagery", "Ordinary use of 'image' must not route to imagery"
    assert body["pulavar"] != "paranar", "Ordinary use of 'image' must not route to paranar"
    assert body["workflow"] == "general"
    assert body["pulavar"] == "nakkirar"
    assert body["metadata"]["routing_reason"] == "default_convener"


def test_explicit_pulavar_routing_reason(monkeypatch):
    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(runner, "run_async", _fake_run_async_factory("ok"))

    resp = client.post(
        "/avai/ask",
        json={"message": "find verses about love", "pulavar": "nakkirar"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["pulavar"] == "nakkirar"
    assert body["metadata"]["routing_reason"] == "explicit_pulavar_selected"
    assert body.get("routing_reason") == "explicit_pulavar_selected"


def test_ask_agent_failure_returns_502(monkeypatch):
    async def _raise(*, user_id, session_id, new_message):
        raise RuntimeError("boom")
        yield  # pragma: no cover — makes this an async generator

    for runner in app_module._RUNNERS.values():
        monkeypatch.setattr(runner, "run_async", _raise)

    resp = client.post("/avai/ask", json={"message": "hello"})

    assert resp.status_code == 502
    assert resp.json()["message"] == "Agent execution failed: boom"
