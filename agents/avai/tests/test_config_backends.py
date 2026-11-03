"""Backend-selection tests, including the Sarvam AI chat backend.

These construct the ADK model object but never make a network call.
"""

import pytest

from avai import config


def test_sarvam_backend_is_configured_from_subscription_key(monkeypatch):
    monkeypatch.setenv("SANGAM_AGENT_BACKEND", "sarvam")
    monkeypatch.setenv("SARVAM_API_KEY", "test-subscription-key")
    monkeypatch.delenv("SANGAM_AGENT_MODEL", raising=False)
    monkeypatch.delenv("SARVAM_API_BASE", raising=False)

    cfg = config.get_model_config()

    assert cfg["backend"] == "sarvam"
    assert cfg["model"] == config.DEFAULT_SARVAM_MODEL
    assert cfg["api_base"] == config.DEFAULT_SARVAM_API_BASE
    assert cfg["configured"] is True
    assert cfg["self_hosted"] is False


def test_sarvam_backend_without_key_is_not_configured(monkeypatch):
    monkeypatch.setenv("SANGAM_AGENT_BACKEND", "sarvam")
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)

    cfg = config.get_model_config()

    assert cfg["backend"] == "sarvam"
    assert cfg["configured"] is False


def test_sarvam_model_uses_openai_compatible_route(monkeypatch):
    monkeypatch.setenv("SANGAM_AGENT_BACKEND", "sarvam")
    monkeypatch.setenv("SARVAM_API_KEY", "test-subscription-key")
    monkeypatch.setenv("SANGAM_AGENT_MODEL", "sarvam-105b")

    model = config.get_model()

    # LiteLLM's openai/ prefix + Sarvam's OpenAI-compatible /v1 endpoint.
    assert model.model == "openai/sarvam-105b"


def test_unknown_backend_names_sarvam_in_the_error(monkeypatch):
    monkeypatch.setenv("SANGAM_AGENT_BACKEND", "not-a-backend")

    with pytest.raises(ValueError) as excinfo:
        config.get_model()

    assert "sarvam" in str(excinfo.value)
