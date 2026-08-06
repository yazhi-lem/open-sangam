"""நக்கீரர் (Nakkirar) — Convener and critic of the Sangam Avai."""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import NAKKIRAR_INSTRUCTION
from ..tools import get_tinai_context, get_verse, query_knowledge_graph, search_verses

nakkirar_agent = LlmAgent(
    name="nakkirar",
    model=get_model(),
    description="நக்கீரர் (Nakkirar) — convener of the Sangam Avai; answers questions on Sangam poems, poets, and tiṇai. Can hand off to other poets for specific tasks.",
    instruction=NAKKIRAR_INSTRUCTION,
    tools=[get_verse, search_verses, query_knowledge_graph, get_tinai_context],
)
