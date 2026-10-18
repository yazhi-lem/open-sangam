"""Tests for agent test prompts suite in prompts.py."""

from avai.prompts import (
    ALL_TEST_PROMPTS,
    TEST_PROMPTS_BY_AGENT,
    TEST_PROMPTS_NAKKIRAR,
    TEST_PROMPTS_AVVAIYAR,
    TEST_PROMPTS_KAPILAR,
    TEST_PROMPTS_THOLKAPPIYAR,
    TEST_PROMPTS_PARANAR,
    get_test_prompts,
    NAKKIRAR_INSTRUCTION,
    AVVAIYAR_INSTRUCTION,
    KAPILAR_INSTRUCTION,
    THOLKAPPIYAR_INSTRUCTION,
    PARANAR_INSTRUCTION,
)


def test_test_prompts_completeness():
    expected_agents = {"nakkirar", "avvaiyar", "kapilar", "tholkappiyar", "paranar"}
    assert set(TEST_PROMPTS_BY_AGENT.keys()) == expected_agents
    
    assert len(TEST_PROMPTS_NAKKIRAR) > 0
    assert len(TEST_PROMPTS_AVVAIYAR) > 0
    assert len(TEST_PROMPTS_KAPILAR) > 0
    assert len(TEST_PROMPTS_THOLKAPPIYAR) > 0
    assert len(TEST_PROMPTS_PARANAR) > 0
    
    for prompt_obj in ALL_TEST_PROMPTS:
        assert "id" in prompt_obj
        assert "agent" in prompt_obj
        assert "prompt" in prompt_obj
        assert "expected_tools" in prompt_obj
        assert "expected_behavior" in prompt_obj


def test_get_test_prompts_filter():
    nakkirar_prompts = get_test_prompts(agent_name="nakkirar")
    assert len(nakkirar_prompts) == len(TEST_PROMPTS_NAKKIRAR)
    assert all(p["agent"] == "nakkirar" for p in nakkirar_prompts)

    routing_prompts = get_test_prompts(category="routing_image")
    assert len(routing_prompts) > 0
    assert all(p["category"] == "routing_image" for p in routing_prompts)


def test_reexported_instructions():
    assert len(NAKKIRAR_INSTRUCTION) > 0
    assert len(AVVAIYAR_INSTRUCTION) > 0
    assert len(KAPILAR_INSTRUCTION) > 0
    assert len(THOLKAPPIYAR_INSTRUCTION) > 0
    assert len(PARANAR_INSTRUCTION) > 0


def test_reflection_rule_is_in_every_pulavar_persona():
    from avai.instructions import (
        AVVAIYAR_INSTRUCTION,
        KAPILAR_INSTRUCTION,
        NAKKIRAR_INSTRUCTION,
        PARANAR_INSTRUCTION,
        REFLECTION_RULE,
        THOLKAPPIYAR_INSTRUCTION,
    )

    for instruction in (
        NAKKIRAR_INSTRUCTION,
        AVVAIYAR_INSTRUCTION,
        KAPILAR_INSTRUCTION,
        THOLKAPPIYAR_INSTRUCTION,
        PARANAR_INSTRUCTION,
    ):
        assert REFLECTION_RULE in instruction
