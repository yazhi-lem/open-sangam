import pytest
from avai.poets.paranar import paranar_agent, _paranar_researcher, _paranar_painter, _DeterministicPainter
from avai.prompts import PARANAR_INSTRUCTION
from avai.tools import search_verses, get_verse, get_tinai_context
from avai.tools.image import generate_image
from avai.swarm import wire_mesh
from google.adk.agents import SequentialAgent

def test_paranar_agent_configuration():
    assert paranar_agent.name == "paranar"
    assert isinstance(paranar_agent, SequentialAgent)

    assert _paranar_researcher.instruction == PARANAR_INSTRUCTION

    researcher_tool_names = [getattr(t, '__name__', getattr(t, 'name', str(t))) for t in _paranar_researcher.tools]
    assert "get_verse" in researcher_tool_names
    assert "search_verses" in researcher_tool_names
    assert "get_tinai_context" in researcher_tool_names

    # The painter is a deterministic BaseAgent (not LLM-driven), so it has no
    # LLM-exposed `tools` list — it calls `generate_image` directly in code,
    # guaranteeing an image is produced instead of depending on tool-calling.
    assert isinstance(_paranar_painter, _DeterministicPainter)
    assert _paranar_painter.name == "_paranar_painter"

def test_paranar_wired_in_mesh():
    wire_mesh()
    # Check that paranar_agent received transfer tools via dummy list
    tool_names = [getattr(t, 'name', getattr(t, '__name__', '')) for t in paranar_agent.tools]
    assert "nakkirar" in tool_names
    assert "avvaiyar" in tool_names
    assert "kapilar" in tool_names
    assert "tholkappiyar" in tool_names

    # Check isolation pattern: researcher doesn't get peer tools
    researcher_tool_names = [getattr(t, 'name', getattr(t, '__name__', '')) for t in _paranar_researcher.tools]
    assert "nakkirar" not in researcher_tool_names

def test_paranar_instruction_regression():
    # The researcher's job is to produce a detailed scene description for the
    # deterministic painter sub-agent to consume — it never calls
    # `generate_image` itself, so the instruction must say so explicitly
    # rather than asking the LLM to invoke a tool that isn't on its list.
    assert "generate_image" not in PARANAR_INSTRUCTION
    assert "passed to the painter sub-agent" in PARANAR_INSTRUCTION
    assert "highly detailed scene description" in PARANAR_INSTRUCTION
