"""Model configuration for the Sangam Avai agent swarm.

Default backend is OpenRouter (via LiteLLM), so the swarm runs against any
OpenRouter-hosted model with an OPENROUTER_API_KEY and no Google-specific
credentials. A direct Gemini backend remains available as an alternative for
users already holding a GEMINI_API_KEY.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from google.adk.models.lite_llm import LiteLlm

# load_dotenv() with no path searches upward from the current working
# directory, which misses agents/avai/.env whenever a command is run from
# agents/ (e.g. `python -m avai.evals.qa_smoke`, `pytest avai/tests`) rather
# than from inside agents/avai/ itself. Anchor to this file's directory so
# the key loads regardless of invocation cwd.
load_dotenv(Path(__file__).resolve().parent / ".env")

# google/gemma-3-27b-it does NOT do real tool calling through OpenRouter as of
# this writing — it emits the tool call as literal "```tool_code" text instead
# of an actual function call (verified against a live agent run). Default to
# a model confirmed to tool-call correctly over the same OpenRouter route;
# override with SANGAM_AGENT_MODEL if that changes.
DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash"
DEFAULT_OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_SELF_HOSTED_MODEL = "qwen2.5-7b-instruct"
DEFAULT_SELF_HOSTED_API_BASE = "http://127.0.0.1:8000/v1"
SELF_HOSTED_BACKENDS = {"vllm", "openai_compatible", "self_hosted"}


def get_model_config() -> dict:
    """Describe the selected backend without constructing a model or a client.

    Used by /avai/health/ready and /avai/capabilities. Never returns the API
    key itself — only whether one is configured.
    """
    backend = os.getenv("SANGAM_AGENT_BACKEND", "openrouter")
    if backend == "gemini":
        model_name = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_GEMINI_MODEL)
        api_base = None
        configured = bool(os.getenv("GEMINI_API_KEY"))
    elif backend in SELF_HOSTED_BACKENDS:
        model_name = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_SELF_HOSTED_MODEL)
        api_base = os.getenv("SANGAM_MODEL_API_BASE", DEFAULT_SELF_HOSTED_API_BASE)
        configured = bool(api_base)
    else:
        model_name = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_OPENROUTER_MODEL)
        api_base = os.getenv("OPENROUTER_API_BASE", DEFAULT_OPENROUTER_API_BASE)
        configured = bool(os.getenv("OPENROUTER_API_KEY"))
    return {
        "backend": backend,
        "model": model_name,
        "api_base": api_base,
        "configured": configured,
        "self_hosted": backend in SELF_HOSTED_BACKENDS,
    }


def get_model(**kwargs):
    """Return the ADK-compatible model object selected by env vars.

    SANGAM_AGENT_BACKEND=openrouter (default) → LiteLlm against OpenRouter.
    SANGAM_AGENT_BACKEND=gemini              → direct Gemini API model.
    SANGAM_AGENT_BACKEND=vllm                → self-hosted OpenAI-compatible
                                              endpoint (vLLM/TGI/llama.cpp).
    """
    backend = os.getenv("SANGAM_AGENT_BACKEND", "openrouter")

    if backend == "gemini":
        from google.adk.models import Gemini

        model_name = os.getenv("SANGAM_AGENT_MODEL", "gemini-2.5-flash")
        return Gemini(model=model_name, **kwargs)

    if backend in SELF_HOSTED_BACKENDS:
        model_name = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_SELF_HOSTED_MODEL)
        api_base = os.getenv("SANGAM_MODEL_API_BASE", DEFAULT_SELF_HOSTED_API_BASE)
        # vLLM and most self-hosted servers expose an OpenAI-compatible API.
        # LiteLLM's openai/ prefix with an explicit api_base keeps this
        # provider-neutral; SANGAM_MODEL_API_KEY is optional.
        return LiteLlm(
            model=f"openai/{model_name}",
            api_base=api_base,
            api_key=os.getenv("SANGAM_MODEL_API_KEY", "not-needed"),
            **kwargs
        )

    if backend == "openrouter":
        # Read via getenv (not environ[...]) so importing this module — and
        # anything that imports the avai package, including tool-only tests —
        # doesn't hard-fail at import time when no key is configured yet.
        # LiteLlm only needs a real key once a call is actually made.
        api_key = os.getenv("OPENROUTER_API_KEY")
        model_name = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_OPENROUTER_MODEL)
        api_base = os.getenv("OPENROUTER_API_BASE", DEFAULT_OPENROUTER_API_BASE)
        # LiteLLM's openrouter/ prefix routes through its OpenRouter provider
        # integration, which forwards api_base/api_key as OpenRouter expects.
        return LiteLlm(
            model=f"openrouter/{model_name}",
            api_base=api_base,
            api_key=api_key,
            **kwargs
        )

    raise ValueError(
        f"Unknown SANGAM_AGENT_BACKEND={backend!r}; expected one of "
        "'openrouter', 'gemini', 'vllm', 'openai_compatible', or 'self_hosted'"
    )
