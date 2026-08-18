"""Tests for the Paranar imagery agent: instantiation, prompt, and swarm wiring."""

from ..poets.paranar import paranar_agent
from ..prompts import PARANAR_INSTRUCTION
from ..tools import get_verse, search_verses, get_tinai_context


def test_paranar_agent_instantiation():
    assert paranar_agent.name == "paranar"
    assert paranar_agent.instruction == PARANAR_INSTRUCTION

    tool_names = [t.__name__ for t in paranar_agent.tools]
    assert "get_verse" in tool_names
    assert "search_verses" in tool_names
    assert "get_tinai_context" in tool_names


def test_paranar_prompt_mentions_imagery():
    assert "imagery" in PARANAR_INSTRUCTION.lower()
    assert "image" in PARANAR_INSTRUCTION.lower()


def test_paranar_prompt_mentions_style():
    assert "style" in PARANAR_INSTRUCTION.lower()


def test_paranar_prompt_has_citation_rule():
    assert "cite its verse id" in PARANAR_INSTRUCTION.lower()


def test_paranar_prompt_mentions_ai_label():
    assert "AI-recreated" in PARANAR_INSTRUCTION
