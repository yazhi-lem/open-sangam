"""தொல்காப்பியர் (Tholkappiyar) — Scenario extraction specialist."""

from google.adk.agents import LlmAgent, SequentialAgent

from ..config import get_model
from ..prompts import THOLKAPPIYAR_INSTRUCTION
from ..schemas import Scenario
from ..tools import (
    get_tinai_context,
    get_verse,
    list_poems,
    query_knowledge_graph,
    search_verses,
)

_tholkappiyar_researcher = LlmAgent(
    name="_tholkappiyar_researcher",
    model=get_model(),
    description="Research agent to pull verses and tinai context.",
    instruction=THOLKAPPIYAR_INSTRUCTION,
    tools=[get_verse, search_verses, list_poems, query_knowledge_graph, get_tinai_context],
)

_tholkappiyar_formatter = LlmAgent(
    name="_tholkappiyar_formatter",
    model=get_model(),
    description="Formatter agent to output structured Scenario.",
    instruction="Format findings in Tamil matching the requested scenario.",
    output_schema=Scenario,
)

class _ToolExposingSequentialAgent(SequentialAgent):
    """Wrapper to expose dummy tools list so swarm.py can inject peer agent tools."""
    
    _dummy_tools: list = []
    
    @property
    def tools(self):
        return self._dummy_tools

tholkappiyar_agent = _ToolExposingSequentialAgent(
    name="tholkappiyar",
    description="தொல்காப்பியர் (Tholkappiyar) — Sangam grammarian; extracts structured scenarios from verses.",
    sub_agents=[_tholkappiyar_researcher, _tholkappiyar_formatter],
)
