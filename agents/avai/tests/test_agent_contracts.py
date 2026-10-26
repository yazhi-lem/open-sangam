"""Fast contract tests for every poet agent.

These run without model calls and catch the failures that otherwise only
appear during a live ADK run: missing tools, broken peer handoffs, routing
drift, and capability/agent mismatch.
"""

import pytest

from avai import health
from avai.api.app import _PULAVAR_AGENTS, _PULAVAR_TO_DEFAULT_WORKFLOW, _WORKFLOW_TO_PULAVAR
from avai.swarm import poets

AGENT_IDS = {"nakkirar", "avvaiyar", "kapilar", "tholkappiyar", "paranar"}

EXPECTED_TOOLS = {
    "nakkirar": {"get_verse", "retrieve_passages", "search_verses", "query_knowledge_graph", "get_tinai_context", "get_colophon_metadata", "find_parallel_verses"},
    "avvaiyar": {"get_verse", "retrieve_passages", "search_verses", "list_poems", "query_knowledge_graph", "get_tinai_context", "analyze_word_etymology", "get_colophon_metadata"},
    "kapilar": {"get_verse", "search_verses", "get_tinai_context", "find_parallel_verses"},
    "tholkappiyar": {"get_verse", "search_verses", "get_tinai_context", "analyze_prosody", "get_colophon_metadata"},
    "paranar": {"get_verse", "search_verses", "list_poems", "query_knowledge_graph", "get_tinai_context", "generate_image"},
}


def _tool_names(agent) -> set[str]:
    names = set()
    stack = [agent]
    while stack:
        current = stack.pop()
        for tool in getattr(current, "tools", []) or []:
            name = getattr(tool, "name", None) or getattr(tool, "__name__", None)
            if name:
                names.add(name)
        stack.extend(getattr(current, "sub_agents", None) or [])
    return names


def test_runtime_and_swarm_agents_match():
    assert set(_PULAVAR_AGENTS) == AGENT_IDS | {"swarm"}
    assert {poet.name for poet in poets} == AGENT_IDS


@pytest.mark.parametrize("agent_id", sorted(AGENT_IDS))
def test_agent_has_metadata_and_expected_tools(agent_id):
    agent = _PULAVAR_AGENTS[agent_id]
    assert agent.name == agent_id
    assert agent.description and agent.description.strip()
    if hasattr(agent, "instruction"):
        assert agent.instruction and agent.instruction.strip()
    if hasattr(agent, "model"):
        assert agent.model is not None

    tools = _tool_names(agent)
    missing = EXPECTED_TOOLS[agent_id] - tools
    assert not missing, f"{agent_id} missing tools: {sorted(missing)}"


@pytest.mark.parametrize("agent_id", sorted(AGENT_IDS))
def test_peer_mesh_exposes_other_poets(agent_id):
    tools = _tool_names(_PULAVAR_AGENTS[agent_id])
    peers = AGENT_IDS - {agent_id}
    missing = peers - tools
    assert not missing, f"{agent_id} cannot hand off to: {sorted(missing)}"


@pytest.mark.parametrize("agent_id", sorted(AGENT_IDS))
def test_tools_are_unique_per_agent(agent_id):
    raw = [
        getattr(tool, "name", None) or getattr(tool, "__name__", None)
        for tool in _PULAVAR_AGENTS[agent_id].tools
    ]
    names = [name for name in raw if name]
    assert len(names) == len(set(names)), f"{agent_id} has duplicate tools: {names}"


def test_workflow_routing_is_complete_and_valid():
    assert set(_WORKFLOW_TO_PULAVAR) == {
        "qa", "search", "reimagine", "scenario", "imagery", "general"
    }
    for workflow, agent_id in _WORKFLOW_TO_PULAVAR.items():
        assert agent_id in _PULAVAR_AGENTS, f"{workflow} routes to unknown {agent_id}"

    for agent_id, workflow in _PULAVAR_TO_DEFAULT_WORKFLOW.items():
        assert agent_id in _PULAVAR_AGENTS
        assert workflow in _WORKFLOW_TO_PULAVAR


def test_capability_catalogue_matches_runtime_agents():
    capabilities = health.capabilities()
    reported = {poet["id"] for poet in capabilities["poets"]}
    assert reported == AGENT_IDS
    assert capabilities["workflows"] == _WORKFLOW_TO_PULAVAR
    assert capabilities["swarm"]["enabled"] is True
