"""Runtime data stores fed by live /avai/ask traffic — the artifact dataset
(store.artifacts) and the usage-driven interaction graph (store.interaction_graph).

Kept separate from the curated data/knowledge/graph.json ("nothing is
hand-asserted" — see docs/data-collection-plan.md §7): these modules record
what actually happened at inference time, not corpus-derived facts.
"""
