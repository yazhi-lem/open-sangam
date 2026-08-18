"""Tests for the English Scholar agent: instantiation, prompt, and swarm wiring."""

from ..poets.english_scholar import english_scholar_agent
from ..prompts import ENGLISH_SCHOLAR_INSTRUCTION
from ..tools import get_verse, search_verses, query_knowledge_graph, get_tinai_context


def test_english_scholar_agent_instantiation():
    assert english_scholar_agent.name == "english_scholar"
    assert english_scholar_agent.instruction == ENGLISH_SCHOLAR_INSTRUCTION

    tool_names = [t.__name__ for t in english_scholar_agent.tools]
    assert "get_verse" in tool_names
    assert "search_verses" in tool_names
    assert "query_knowledge_graph" in tool_names
    assert "get_tinai_context" in tool_names


def test_english_scholar_prompt_mentions_key_scholars():
    assert "G.U. Pope" in ENGLISH_SCHOLAR_INSTRUCTION
    assert "Ellis" in ENGLISH_SCHOLAR_INSTRUCTION
    assert "Percival" in ENGLISH_SCHOLAR_INSTRUCTION
    assert "Thirukkural" in ENGLISH_SCHOLAR_INSTRUCTION


def test_english_scholar_prompt_has_citation_rule():
    assert "cite its verse id" in ENGLISH_SCHOLAR_INSTRUCTION.lower()


def test_english_scholar_prompt_has_contested_rule():
    assert "contested" in ENGLISH_SCHOLAR_INSTRUCTION.lower()
