import pytest
from ..poets.tholkappiyar import tholkappiyar_agent, _tholkappiyar_researcher, _tholkappiyar_formatter
from ..prompts import THOLKAPPIYAR_INSTRUCTION
from ..schemas import Scenario
from ..swarm import wire_mesh

def test_tholkappiyar_agent_instantiation():
    # 1. tholkappiyar_agent.name == "tholkappiyar"
    assert tholkappiyar_agent.name == "tholkappiyar"
    
    # 2. _tholkappiyar_researcher.tools contains exactly get_verse, search_verses, get_tinai_context and nothing else
    researcher_tool_names = {t.__name__ for t in _tholkappiyar_researcher.tools}
    assert researcher_tool_names == {"get_verse", "search_verses", "get_tinai_context"}
    
    # 3. _tholkappiyar_formatter.output_schema == Scenario
    assert _tholkappiyar_formatter.output_schema == Scenario
    
    # 4. _tholkappiyar_formatter.tools is empty
    assert len(_tholkappiyar_formatter.tools) == 0

def test_tholkappiyar_isolation_after_wire_mesh():
    # 5. After wire_mesh() runs, confirm _tholkappiyar_researcher.tools STILL only contains the original 3 tools
    wire_mesh()
    
    researcher_tool_names = {getattr(t, 'name', getattr(t, '__name__', '')) for t in _tholkappiyar_researcher.tools}
    assert researcher_tool_names == {"get_verse", "search_verses", "get_tinai_context"}
    
    # Verify the dummy tools actually got the peer-transfer tools (to ensure wire_mesh did something to it)
    dummy_tools = {getattr(t, 'name', getattr(t, '__name__', '')) for t in tholkappiyar_agent.tools}
    assert "nakkirar" in dummy_tools or "kapilar" in dummy_tools or "avvaiyar" in dummy_tools

def test_tholkappiyar_prompt_sanity():
    # 6. Sanity check on THOLKAPPIYAR_INSTRUCTION containing the evidenceLines selectivity guidance
    assert "1-3" in THOLKAPPIYAR_INSTRUCTION, "Prompt is missing the '1-3' lines selectivity guidance for evidenceLines"
    assert "evidenceLines" in THOLKAPPIYAR_INSTRUCTION
