"""English Scholar agent — represents the tradition of British Tamil
philologists (G.U. Pope, Ellis, Percival, Robinson) who contributed
significantly to the study, translation, and preservation of classical
Tamil literature for the English-speaking world.
"""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import ENGLISH_SCHOLAR_INSTRUCTION
from ..tools import get_tinai_context, get_verse, query_knowledge_graph, search_verses

english_scholar_agent = LlmAgent(
    name="english_scholar",
    model=get_model(),
    description="English Scholar — represents the British Tamil philological tradition (G.U. Pope, Ellis, Percival). Answers questions about Tamil literature through the lens of Western scholarship, translation history, and cross-cultural scholarly context.",
    instruction=ENGLISH_SCHOLAR_INSTRUCTION,
    tools=[get_verse, search_verses, query_knowledge_graph, get_tinai_context],
)
