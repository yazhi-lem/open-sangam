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


def get_model(**kwargs):
    """Return the ADK-compatible model object selected by env vars.

    SANGAM_AGENT_BACKEND=openrouter (default) → LiteLlm against OpenRouter.
    SANGAM_AGENT_BACKEND=gemini              → direct Gemini API model.
    """
    backend = os.getenv("SANGAM_AGENT_BACKEND", "openrouter")

    if backend == "gemini":
        from google.adk.models import Gemini

        model_name = os.getenv("SANGAM_AGENT_MODEL", "gemini-2.5-flash")
        return Gemini(model=model_name, **kwargs)

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
        f"Unknown SANGAM_AGENT_BACKEND={backend!r}; expected 'openrouter' or 'gemini'"
    )
