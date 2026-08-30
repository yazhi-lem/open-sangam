"""Tests for the continuous-enrichment dataset (store.artifacts) and the
usage-driven interaction graph (store.interaction_graph)."""

import json

import pytest

from avai.store import artifacts, interaction_graph, swaram
from avai.tools import graph as graph_tool


@pytest.fixture(autouse=True)
def _isolated_dataset_file(tmp_path, monkeypatch):
    monkeypatch.setattr(artifacts, "DATASET_FILE", tmp_path / "agent_artifacts.jsonl")
    yield


@pytest.fixture(autouse=True)
def _isolated_interaction_graph(tmp_path, monkeypatch):
    monkeypatch.setattr(interaction_graph, "_INTERACTION_GRAPH", interaction_graph._empty_graph())
    monkeypatch.setattr(interaction_graph, "GRAPH_FILE", tmp_path / "interaction_graph.json")
    yield


def test_segment_aksharas_is_lossless():
    text = "படித்துக்கொண்டிருந்தேன்"
    pieces = swaram.segment_aksharas(text)
    assert "".join(pieces) == text
    assert len(pieces) < len(text)


def test_record_artifact_appends_jsonl_and_matches_adhan_shape():
    record = artifacts.record_artifact(
        session_id="s1",
        user_id="u1",
        workflow="qa",
        pulavar="avvaiyar",
        message="குறுந்தொகை 40 விளக்கு",
        response_text="இது ஒரு விளக்கம்.",
        citations=[{"verse_id": "kurunthokai_040", "poem": "kurunthokai", "tinai": "kurinji"}],
        model="test:model",
        elapsed_ms=42,
    )

    assert record["source"] == "avai-agent-swarm"
    assert record["tier"] == 2
    assert record["quality_score"] == 1.0  # has citations -> grounded
    assert record["text"] == "இது ஒரு விளக்கம்."
    assert record["swaram_aksharas"]
    assert record["akshara_count"] == len(record["swaram_aksharas"])

    assert artifacts.count_artifacts() == 1
    on_disk = list(artifacts.iter_artifacts())
    assert on_disk == [record]

    with artifacts.DATASET_FILE.open(encoding="utf-8") as f:
        line = f.readline()
    assert json.loads(line)["id"] == record["id"]


def test_record_artifact_without_citations_scores_lower():
    record = artifacts.record_artifact(
        session_id="s1",
        user_id="u1",
        workflow="general",
        pulavar="nakkirar",
        message="hello",
        response_text="hi there",
        citations=[],
        model="test:model",
        elapsed_ms=5,
    )
    assert record["quality_score"] == 0.6


def test_record_interaction_grows_agent_and_topic_edges():
    interaction_graph.record_interaction(
        "kapilar",
        [{"verse_id": "kurunthokai_040", "poem": "kurunthokai", "tinai": "kurinji"}],
    )

    snap = interaction_graph.snapshot()
    node_ids = {n["id"] for n in snap["nodes"]}
    assert "agent:kapilar" in node_ids

    edges = {(e["source"], e["target"], e["rel"]) for e in snap["edges"]}
    assert ("agent:kapilar", "poem:kurunthokai", "DISCUSSED") in edges
    assert ("agent:kapilar", "tinai:kurinji", "DISCUSSED") in edges


def test_record_interaction_reinforces_weight_on_repeat():
    citations = [{"verse_id": "kurunthokai_040", "poem": "kurunthokai", "tinai": "kurinji"}]
    interaction_graph.record_interaction("kapilar", citations)
    interaction_graph.record_interaction("kapilar", citations)

    snap = interaction_graph.snapshot()
    edge = next(
        e for e in snap["edges"] if e["source"] == "agent:kapilar" and e["target"] == "poem:kurunthokai"
    )
    assert edge["weight"] == 2


def test_record_interaction_noop_without_citations():
    interaction_graph.record_interaction("kapilar", [])
    assert interaction_graph.snapshot()["nodes"] == []


def test_query_knowledge_graph_sees_interaction_growth():
    interaction_graph.record_interaction(
        "paranar",
        [{"verse_id": "purananooru_001", "poem": "purananooru", "tinai": "puram"}],
    )

    result = graph_tool.query_knowledge_graph(node_id="agent:paranar")
    assert result["node"]["id"] == "agent:paranar"
    assert any(e["target"] == "poem:purananooru" for e in result["edges"])
