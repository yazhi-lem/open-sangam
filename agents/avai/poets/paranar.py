"""Paranar — Imagery agent for the Sangam Avai.

Extracts visual scene descriptions from Sangam verses and crafts
image generation prompts. When SANGAM_IMAGE_BACKEND=gemini, generates
actual images via the Gemini image API. When =none (default), returns
the crafted prompt only.
"""

from google.adk.agents import LlmAgent

from ..config import get_model
from ..prompts import PARANAR_INSTRUCTION
from ..tools import get_tinai_context, get_verse, search_verses

paranar_agent = LlmAgent(
    name="paranar",
    model=get_model(),
    description="பரணர் (Paranar) — imagery agent. Extracts visual scene descriptions from Sangam verses and crafts image generation prompts.",
    instruction=PARANAR_INSTRUCTION,
    tools=[get_verse, search_verses, get_tinai_context],
)
