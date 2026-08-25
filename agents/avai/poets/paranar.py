from google.adk.agents import LlmAgent, SequentialAgent
from google.genai import types

from ..config import get_model
from ..prompts import PARANAR_INSTRUCTION
from ..tools import search_verses, get_verse, get_tinai_context
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
    tools=[get_verse, search_verses, get_tinai_context]
)

from typing import AsyncGenerator
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
        # Find the last text output from the researcher
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
            result_text = f"Here is the generated visualization:\n\n![Generated Image]({image_result.image_data_uri})\n\n*{image_result.disclaimer}*"
            content = types.Content(
                parts=[types.Part.from_text(text=result_text)],
                role="model"
            )
            _debug_log(f">>> _DeterministicPainter generated image successfully, URI length: {len(image_result.image_data_uri) if image_result.image_data_uri else 'None'}")
        except Exception as e:
            _debug_log(f">>> _DeterministicPainter exception: {e}")
            content = types.Content(
                parts=[types.Part.from_text(text=f"Failed to generate image: {e}")],
                role="model"
            )
            
        _debug_log(">>> _DeterministicPainter YIELDING event")
        yield Event(author=self.name, content=content)

_paranar_painter = _DeterministicPainter()

class _ToolExposingSequentialAgent(SequentialAgent):
    """Wrapper to expose a dummy tools list so swarm.py can inject peer agent tools.
    We return a separate list rather than the sub-agent's tools to ensure peer-transfer
    tools are NOT added to the researcher, keeping the two-step extraction pipeline strictly deterministic."""
    
    _dummy_tools: list = []
    
    @property
    def tools(self):
        return self._dummy_tools
        
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        _debug_log(f">>> paranar_agent (_ToolExposingSequentialAgent) TRIGGERED with prompt: {ctx.user_content.parts[0].text if ctx.user_content and ctx.user_content.parts else 'No prompt'}")
        async for event in super()._run_async_impl(ctx):
            yield event
        _debug_log(">>> paranar_agent FINISHED")

paranar_agent = _ToolExposingSequentialAgent(
    name="paranar",
    description="பரணர் (Paranar) — Recreates imagery and visualizes scenes from Sangam poetry. (Note: This agent CAN generate real image files, always route image requests to him instead of declining.)",
    sub_agents=[_paranar_researcher, _paranar_painter],
)
