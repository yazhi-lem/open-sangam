"""No-LLM tests for production health and capability discovery endpoints."""

from fastapi.testclient import TestClient

from avai.api import app as app_module

client = TestClient(app_module.app)


def test_legacy_health_contract_is_unchanged():
    resp = client.get("/avai/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_liveness_reports_build_and_uptime():
    resp = client.get("/avai/health/live")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "avai-api"
    assert body["version"]
    assert body["uptime_seconds"] >= 0


def test_readiness_checks_corpus_graph_and_tinai():
    resp = client.get("/avai/health/ready")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] in {"ready", "degraded"}
    checks = {check["name"]: check for check in body["checks"]}
    assert checks["corpus"]["ok"] is True
    assert checks["knowledge_graph"]["ok"] is True
    assert checks["tinai_context"]["ok"] is True
    assert body["corpus"]["verses"] > 2000
    assert body["knowledge_graph"]["nodes"] > 100


def test_strict_readiness_fails_without_model_key(monkeypatch):
    monkeypatch.setenv("AVAI_STRICT_READINESS", "1")
    monkeypatch.setenv("SANGAM_AGENT_BACKEND", "openrouter")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    resp = client.get("/avai/health/ready")

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "not_ready"
    model_check = next(c for c in body["checks"] if c["name"] == "model_config")
    assert model_check["ok"] is False
    assert model_check["critical"] is True


def test_capabilities_describe_all_five_poets_and_workflows():
    resp = client.get("/avai/capabilities")
    assert resp.status_code == 200
    body = resp.json()

    poets = {poet["id"]: poet for poet in body["poets"]}
    assert set(poets) == {"nakkirar", "avvaiyar", "kapilar", "tholkappiyar", "paranar"}
    assert poets["avvaiyar"]["tamil_name"] == "ஔவையார்"
    assert "get_verse" in poets["avvaiyar"]["tools"]
    assert "retrieve_passages" in poets["avvaiyar"]["tools"]

    assert body["workflows"]["qa"] == "avvaiyar"
    assert body["workflows"]["scenario"] == "tholkappiyar"
    assert body["swarm"]["enabled"] is True
    assert body["corpus"]["verses"] > 2000
    assert body["features"]["verified_citations"] is True

    # Capability discovery is public: never echo an API key or its value.
    serialized = resp.text
    assert "OPENROUTER_API_KEY" not in serialized
    assert "api_key" not in serialized
