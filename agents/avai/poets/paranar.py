from google.adk.agents import LlmAgent, SequentialAgent
from google.genai import types

from ..config import get_model
from ..prompts import PARANAR_INSTRUCTION
from ..tools import (
    get_tinai_context,
    get_verse,
    list_poems,
    query_knowledge_graph,
    search_verses,
)
from ..tools.image import generate_image


def _debug_log(msg):
    import time
    with open("paranar_debug.log", "a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] {msg}\n")

_paranar_researcher = LlmAgent(
    name="_paranar_researcher",
    description="Research agent to pull verses and tinai context, and craft the image prompt.",
    instruction=PARANAR_INSTRUCTION,
    model=get_model(),
    tools=[get_verse, search_verses, list_poems, query_knowledge_graph, get_tinai_context]
)

from collections.abc import AsyncGenerator

from google.adk.agents.base_agent import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events.event import Event


class _DeterministicPainter(BaseAgent):
    name: str = "_paranar_painter"
    description: str = "Deterministic painter agent that directly calls the image generation tool."
    tools: list = [generate_image]

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        _debug_log(">>> _DeterministicPainter._run_async_impl ENTERED")
        researcher_text = ""
        for event in reversed(ctx.session.events):
            if event.author == "_paranar_researcher" and event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        researcher_text += part.text
                break
                
        if not researcher_text:
            researcher_text = "Beautiful Sangam landscape"
            
        try:
            image_result = generate_image(prompt=researcher_text, aspect_ratio="1:1")
            result_text = f"காட்சிப் படம் உருவாக்கப்பட்டது:\n\n![Generated Image]({image_result.image_data_uri})\n\n*{image_result.disclaimer}*"
            content = types.Content(
                parts=[types.Part.from_text(text=result_text)],
                role="model"
            )
            _debug_log(">>> _DeterministicPainter generated image successfully")
        except Exception as e:
            _debug_log(f">>> _DeterministicPainter exception: {e}")
            content = types.Content(
                parts=[types.Part.from_text(text=f"பட உருவாக்கம் தடைபட்டது: {e}")],
                role="model"
            )
            
        yield Event(author=self.name, content=content)

_paranar_painter = _DeterministicPainter()

class _ToolExposingSequentialAgent(SequentialAgent):
    _dummy_tools: list = []
    
    @property
    def tools(self):
        return self._dummy_tools
        
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        _debug_log(">>> paranar_agent TRIGGERED")
        async for event in super()._run_async_impl(ctx):
            yield event

paranar_agent = _ToolExposingSequentialAgent(
    name="paranar",
    description="பரணர் (Paranar) — Recreates imagery and visualizes scenes from Sangam poetry.",
    sub_agents=[_paranar_researcher, _paranar_painter],
)
