"""கபிலர் (Kapilar) — Search/Retrieval agent, M1 issue #4.

Answers queries by retrieving and ranking Sangam verses, grounded in the corpus
tools, with a focus on Kurinji tiṇai and nature imagery.
"""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import KAPILAR_INSTRUCTION
from ..tools import get_tinai_context, get_verse, search_verses

kapilar_agent = LlmAgent(
    name="kapilar",
    model=get_model(),
    description="கபிலர் (Kapilar) — retrieves and ranks relevant verses based on search queries, without deep interpretive commentary.",
    instruction=KAPILAR_INSTRUCTION,
    tools=[get_verse, search_verses, get_tinai_context],
)
