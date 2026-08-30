from avai.tools.graph import query_knowledge_graph


def test_query_with_no_args_returns_meta():
    meta = query_knowledge_graph()
    assert meta["nodes"] == 109
    assert meta["edges"] == 292


def test_query_by_node_id():
    result = query_knowledge_graph(node_id="tinai:kurinji")
    assert result["node"]["id"] == "tinai:kurinji"
    assert len(result["edges"]) > 0
    assert all(
        e["source"] == "tinai:kurinji" or e["target"] == "tinai:kurinji"
        for e in result["edges"]
    )


def test_query_by_node_type():
    result = query_knowledge_graph(node_type="tinai")
    # 5 classical tinai + 1 "unknown/unclassified" bucket in the graph data
    assert len(result["nodes"]) == 6
    assert all(n["type"] == "tinai" for n in result["nodes"])


def test_query_by_edge_type():
    result = query_knowledge_graph(edge_type="HAS_TINAI")
    assert len(result["edges"]) > 0
    assert all(e["rel"] == "HAS_TINAI" for e in result["edges"])
