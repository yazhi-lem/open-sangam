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
        app_module._runner,
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
    monkeypatch.setattr(
        app_module._runner,
        "run_async",
        _fake_run_async_factory("See not_a_real_id for details."),
    )

    resp = client.post("/avai/ask", json={"message": "hello"})

    assert resp.status_code == 200
    assert resp.json()["citations"] == []


def test_ask_reuses_supplied_session_id(monkeypatch):
    monkeypatch.setattr(
        app_module._runner, "run_async", _fake_run_async_factory("ok")
    )

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


@pytest.mark.parametrize("workflow", ["search", "reimagine", "scenario", "imagery"])
def test_ask_unimplemented_workflows_return_501(workflow):
    resp = client.post("/avai/ask", json={"message": "hi", "workflow": workflow})
    assert resp.status_code == 501
    assert "message" in resp.json()


def test_ask_agent_failure_returns_502(monkeypatch):
    async def _raise(*, user_id, session_id, new_message):
        raise RuntimeError("boom")
        yield  # pragma: no cover — makes this an async generator

    monkeypatch.setattr(app_module._runner, "run_async", _raise)

    resp = client.post("/avai/ask", json={"message": "hello"})

    assert resp.status_code == 502
    assert resp.json()["message"] == "Agent execution failed"
