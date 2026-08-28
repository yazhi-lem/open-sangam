"""Knowledge-graph tool: query data/knowledge/graph.json (nodes/edges)."""

import json
from pathlib import Path

GRAPH_FILE = Path(__file__).resolve().parents[3] / "data" / "knowledge" / "graph.json"

_GRAPH = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))


def query_knowledge_graph(
    node_id: str | None = None,
    node_type: str | None = None,
    edge_type: str | None = None,
) -> dict:
    """சங்க இலக்கிய அறிவுக் வரைபடத்திலிருந்து புலவர்கள், நூல்கள், திணைகள் மற்றும் கருப்பொருள்களுக்கிடையேயான தொடர்புகளை ஆராயும் கருவி.
    """
    if node_id:
        node = next((n for n in _GRAPH["nodes"] if n["id"] == node_id), None)
        edges = [
            e for e in _GRAPH["edges"] if e["source"] == node_id or e["target"] == node_id
        ]
        return {"node": node, "edges": edges}

    if node_type or edge_type:
        nodes = _GRAPH["nodes"]
        edges = _GRAPH["edges"]
        if node_type:
            nodes = [n for n in nodes if n.get("type") == node_type]
        if edge_type:
            edges = [e for e in edges if e.get("rel") == edge_type]
        return {"nodes": nodes, "edges": edges}

    return _GRAPH["meta"]
