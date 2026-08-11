import pytest
from ..poets.kapilar import kapilar_agent
from ..prompts import KAPILAR_INSTRUCTION
from ..tools import search_verses, get_verse, get_tinai_context

def test_kapilar_agent_instantiation():
    assert kapilar_agent.name == "kapilar"
    assert kapilar_agent.instruction == KAPILAR_INSTRUCTION
    
    # Ensure correct tools are loaded
    tool_names = [getattr(t, "name", getattr(t, "__name__", str(t))) for t in kapilar_agent.tools]
    assert "search_verses" in tool_names
    assert "get_verse" in tool_names
    assert "get_tinai_context" in tool_names
    # Ensure query_knowledge_graph is NOT loaded
    assert "query_knowledge_graph" not in tool_names

def test_kapilar_prompt_sanity():
    assert "Kurinji" in KAPILAR_INSTRUCTION
    assert "retrieval" in KAPILAR_INSTRUCTION
    assert "avvaiyar" not in KAPILAR_INSTRUCTION.lower() or "leave that to avvaiyar" in KAPILAR_INSTRUCTION.lower()
