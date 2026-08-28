"""Usage-driven interaction graph — grows from live /avai/ask traffic.

Kept separate from the curated data/knowledge/graph.json ("nothing is
hand-asserted" — see docs/data-collection-plan.md §7, and
backend/python/knowledge/build_graph.py's "base world graph" design goal).
Each turn's citations strengthen agent -> poem / agent -> tiṇai edges, so the
graph keeps growing from real usage without touching the corpus-derived base
graph. Persisted to data/generated/interaction_graph.json and merged into
tools.graph.query_knowledge_graph at query time, so the growth is visible to
agents and callers immediately, not just on disk.
"""

import json
import threading
from pathlib import Path
from typing import Any

GRAPH_FILE = Path(__file__).resolve().parents[3] / "data" / "generated" / "interaction_graph.json"

_LOCK = threading.Lock()


def _empty_graph() -> dict[str, Any]:
    return {
        "meta": {
            "nodeTypes": ["agent"],
            "relTypes": ["DISCUSSED"],
            "generatedFrom": "live /avai/ask traffic",
        },
        "nodes": [],
        "edges": [],
    }


def _load() -> dict[str, Any]:
    if GRAPH_FILE.exists():
        try:
            return json.loads(GRAPH_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return _empty_graph()


_INTERACTION_GRAPH = _load()


def _save() -> None:
    GRAPH_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = GRAPH_FILE.with_suffix(".json.tmp")
    tmp.write_text(
        json.dumps(_INTERACTION_GRAPH, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    tmp.replace(GRAPH_FILE)


def _upsert_node(node_id: str, node_type: str, label: str) -> dict:
    node = next((n for n in _INTERACTION_GRAPH["nodes"] if n["id"] == node_id), None)
    if node is None:
        node = {"id": node_id, "label": label, "type": node_type, "weight": 0}
        _INTERACTION_GRAPH["nodes"].append(node)
    node["weight"] += 1
    return node


def _upsert_edge(source: str, target: str, rel: str) -> dict:
    edge = next(
        (
            e
            for e in _INTERACTION_GRAPH["edges"]
            if e["source"] == source and e["target"] == target and e["rel"] == rel
        ),
        None,
    )
    if edge is None:
        edge = {"source": source, "target": target, "rel": rel, "weight": 0}
        _INTERACTION_GRAPH["edges"].append(edge)
    edge["weight"] += 1
    return edge


def record_interaction(pulavar: str, citations: list[dict[str, Any]]) -> None:
    """Grow the interaction graph from one agent turn's citations. A no-op
    (and never raises) when there is nothing to attribute — an uncited
    response teaches the graph nothing."""
    if not citations:
        return
    agent_id = f"agent:{pulavar}"
    try:
        with _LOCK:
            _upsert_node(agent_id, "agent", pulavar)
            for citation in citations:
                poem = citation.get("poem")
                tinai = citation.get("tinai")
                if poem:
                    _upsert_edge(agent_id, f"poem:{poem}", "DISCUSSED")
                if tinai:
                    _upsert_edge(agent_id, f"tinai:{tinai}", "DISCUSSED")
            _save()
    except OSError:
        pass


def snapshot() -> dict[str, Any]:
    """Read-only copy of the current interaction graph — used to merge into
    query_knowledge_graph and to report growth via /avai/dataset/stats."""
    with _LOCK:
        return json.loads(json.dumps(_INTERACTION_GRAPH))
