"""நக்கீரர் (Nakkirar) — Convener and critic of the Sangam Avai."""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..instructions import NAKKIRAR_INSTRUCTION
from ..tools import find_parallel_verses, get_colophon_metadata, get_tinai_context, get_verse, query_knowledge_graph, retrieve_passages, search_verses

nakkirar_agent = LlmAgent(
    name="nakkirar",
    model=get_model(),
    description="நக்கீரர் (Nakkirar) — சங்க இலக்கிய அவையின் தலைவர் மற்றும் நடுவர்; சங்கப் பாடல்கள், புலவர்கள், திணைகள் பற்றிய கேள்விகளுக்குப் பதிலளிப்பவர் மற்றும் பிற புலவர்களுக்குப் பணிகளைப் பகிர்ந்தளிப்பவர்.",
    instruction=NAKKIRAR_INSTRUCTION,
    tools=[get_verse, retrieve_passages, search_verses, query_knowledge_graph, get_tinai_context, get_colophon_metadata, find_parallel_verses],
)


