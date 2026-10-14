"""Every tool on every agent must turn into an ADK function declaration.

ADK builds these declarations when a run starts, so a signature it can't parse
(e.g. a PEP 604 `str | None` under google-adk 1.18) fails every request with a
502 before the model is called — and no other test exercises that path.
"""

import pytest
from google.adk.tools import _automatic_function_calling_util as afc
from google.adk.utils.variant_utils import GoogleLLMVariant

from avai.api.app import _PULAVAR_AGENTS


def _all_function_tools():
    seen = {}
    stack = list(_PULAVAR_AGENTS.values())
    while stack:
        agent = stack.pop()
        for tool in getattr(agent, "tools", None) or []:
            if callable(tool) and not hasattr(tool, "process_llm_request"):
                seen[tool.__name__] = tool
        stack.extend(getattr(agent, "sub_agents", None) or [])
    return sorted(seen.items())


TOOLS = _all_function_tools()


def test_agents_expose_tools():
    assert len(TOOLS) >= 5


@pytest.mark.parametrize("variant", [GoogleLLMVariant.GEMINI_API, GoogleLLMVariant.VERTEX_AI])
@pytest.mark.parametrize("name,func", TOOLS, ids=[n for n, _ in TOOLS])
def test_tool_declaration_builds(name, func, variant):
    decl = afc.build_function_declaration(func=func, variant=variant)
    assert decl.name == name
