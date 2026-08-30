"""கபிலர் (Kapilar) — Search/Retrieval agent."""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import KAPILAR_INSTRUCTION
from ..tools import (
    get_tinai_context,
    get_verse,
    list_poems,
    query_knowledge_graph,
    search_verses,
)

kapilar_agent = LlmAgent(
    name="kapilar",
    model=get_model(),
    description="கபிலர் (Kapilar) — retrieves and ranks relevant verses based on search queries.",
    instruction=KAPILAR_INSTRUCTION,
    tools=[get_verse, search_verses, list_poems, query_knowledge_graph, get_tinai_context],
)
