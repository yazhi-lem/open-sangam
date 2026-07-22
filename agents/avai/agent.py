"""Root agent for `adk run` / `adk web` — நக்கீரர் (Nakkirar) as sole entry point.

This is the M1 scaffold: one agent, three corpus/graph/tiṇai tools, wired to
an OpenRouter (or Gemini) model via config.get_model(). The full five-poet
peer mesh (swarm.py, poets/*.py) lands in M2.
"""

from google.adk.agents import LlmAgent

from .config import get_model
from .prompts import NAKKIRAR_INSTRUCTION
from .tools import get_tinai_context, get_verse, query_knowledge_graph, search_verses

root_agent = LlmAgent(
    name="nakkirar",
    model=get_model(),
    description="நக்கீரர் (Nakkirar) — convener of the Sangam Avai; answers questions on Sangam poems, poets, and tiṇai.",
    instruction=NAKKIRAR_INSTRUCTION,
    tools=[get_verse, search_verses, query_knowledge_graph, get_tinai_context],
)
