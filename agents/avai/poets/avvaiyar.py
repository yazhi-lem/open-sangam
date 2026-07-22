"""ஔவையார் (Avvaiyar) — Q&A agent, M1 issue #4.

Answers questions on Sangam poems, poets, and tiṇai, grounded in the corpus
and knowledge-graph tools, always citing verse ids.
"""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import AVVAIYAR_INSTRUCTION
from ..tools import get_tinai_context, get_verse, list_poems, query_knowledge_graph, search_verses

avvaiyar_agent = LlmAgent(
    name="avvaiyar",
    model=get_model(),
    description="ஔவையார் (Avvaiyar) — answers questions on Sangam poems, poets, and tiṇai, citing verse ids.",
    instruction=AVVAIYAR_INSTRUCTION,
    tools=[get_verse, search_verses, list_poems, query_knowledge_graph, get_tinai_context],
)
