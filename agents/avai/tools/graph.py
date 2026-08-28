"""Knowledge-graph tool: query data/knowledge/graph.json (nodes/edges),
merged live with the usage-driven interaction graph (store/interaction_graph.py)
so agents see graph growth from real traffic immediately, not just on disk.
"""

import json
from pathlib import Path

from ..store import interaction_graph

GRAPH_FILE = Path(__file__).resolve().parents[3] / "data" / "knowledge" / "graph.json"

_GRAPH = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))


def _merged_nodes_edges() -> tuple[list[dict], list[dict]]:
    growth = interaction_graph.snapshot()
    return _GRAPH["nodes"] + growth["nodes"], _GRAPH["edges"] + growth["edges"]


def query_knowledge_graph(
    node_id: str | None = None,
    node_type: str | None = None,
    edge_type: str | None = None,
) -> dict:
    """சங்க இலக்கிய அறிவுக் வரைபடத்திலிருந்து புலவர்கள், நூல்கள், திணைகள் மற்றும் கருப்பொருள்களுக்கிடையேயான தொடர்புகளை ஆராயும் கருவி.
    """
    nodes, edges = _merged_nodes_edges()

    if node_id:
        node = next((n for n in nodes if n["id"] == node_id), None)
        node_edges = [e for e in edges if e["source"] == node_id or e["target"] == node_id]
        return {"node": node, "edges": node_edges}

    if node_type or edge_type:
        filtered_nodes = nodes
        filtered_edges = edges
        if node_type:
            filtered_nodes = [n for n in filtered_nodes if n.get("type") == node_type]
        if edge_type:
            filtered_edges = [e for e in filtered_edges if e.get("rel") == edge_type]
        return {"nodes": filtered_nodes, "edges": filtered_edges}

    return _GRAPH["meta"]
