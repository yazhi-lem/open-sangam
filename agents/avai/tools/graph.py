"""Knowledge-graph tool: query data/knowledge/graph.json (nodes/edges)."""

import json
from pathlib import Path
from typing import Optional

GRAPH_FILE = Path(__file__).resolve().parents[3] / "data" / "knowledge" / "graph.json"

_GRAPH = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))


def query_knowledge_graph(
    node_id: Optional[str] = None,
    node_type: Optional[str] = None,
    edge_type: Optional[str] = None,
) -> dict:
    """Query the Sangam knowledge graph (poets, poems, tinai, karu — 106 nodes / 283 edges).

    - node_id: return that node plus every edge touching it.
    - node_type: filter nodes by type ('tinai' | 'poem' | 'poet' | 'karu').
    - edge_type: filter edges by relation ('HAS_TINAI' | 'WROTE_IN' | 'COMPOSED' | 'ATTESTS').
    With no arguments, returns the graph's summary metadata.
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
