"""ஔவையார் (Avvaiyar) — Q&A agent, M1 issue #4.

Answers questions on Sangam poems, poets, and tiṇai, grounded in the corpus
and knowledge-graph tools, always citing verse ids.
"""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..instructions import AVVAIYAR_INSTRUCTION
from ..tools import analyze_word_etymology, get_colophon_metadata, get_tinai_context, get_verse, list_poems, query_knowledge_graph, retrieve_passages, search_verses

avvaiyar_agent = LlmAgent(
    name="avvaiyar",
    model=get_model(),
    description="ஔவையார் (Avvaiyar) — சங்கப் பாடல்கள், புலவர்கள், திணைகள் பற்றிய வினாக்களுக்குப் பாடல் அடையாள எண்களுடன் சான்றளித்துப் பதிலளிக்கும் வினா-விடை வல்லுநர்.",
    instruction=AVVAIYAR_INSTRUCTION,
    tools=[get_verse, retrieve_passages, search_verses, list_poems, query_knowledge_graph, get_tinai_context, analyze_word_etymology, get_colophon_metadata],
)


