import pytest
from agents.avai.poets.paranar import paranar_agent, _paranar_researcher, _paranar_painter
from agents.avai.prompts import PARANAR_INSTRUCTION
from agents.avai.tools import search_verses, get_verse, get_tinai_context
from agents.avai.tools.image import generate_image
from agents.avai.swarm import wire_mesh
from google.adk.agents import SequentialAgent

def test_paranar_agent_configuration():
    assert paranar_agent.name == "paranar"
    assert isinstance(paranar_agent, SequentialAgent)
    
    assert _paranar_researcher.instruction == PARANAR_INSTRUCTION
    
    researcher_tool_names = [getattr(t, '__name__', getattr(t, 'name', str(t))) for t in _paranar_researcher.tools]
    assert "get_verse" in researcher_tool_names
    assert "search_verses" in researcher_tool_names
    assert "get_tinai_context" in researcher_tool_names
    
    painter_tool_names = [getattr(t, '__name__', getattr(t, 'name', str(t))) for t in _paranar_painter.tools]
    assert "generate_image" in painter_tool_names

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
    assert "ALWAYS call the `generate_image` tool" in PARANAR_INSTRUCTION
    assert "NEVER describe the scene from memory" in PARANAR_INSTRUCTION
