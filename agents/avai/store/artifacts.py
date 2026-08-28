"""Continuous dataset of agent response artifacts — Avai as a content
generator for the Adhan Tamil SLM.

Every /avai/ask turn is appended as one JSON line to
data/generated/agent_artifacts.jsonl — a growing, replayable record of what
was asked, which pulavar answered, what it said, and what it cited. This is
the raw material for future eval sets, fine-tuning data, and usage analytics;
agents/avai/store/interaction_graph.py derives the live knowledge-graph layer
from the same citations.

The `id` / `text` / `source` / `tier` / `quality_score` fields mirror the
shape adhan/data/raw/thirukkural/thirukkural_corpus.jsonl already uses, so a
future adhan-side ingestion step (see adhan/scripts/cron_yazhi_one_ingest.sh,
which already takes a --sangam-path) can pick this file up the same way.
`swaram_aksharas` pre-segments `text` with the vendored Layer A tokenizer
(store/swaram.py) so Adhan's pipeline can skip straight to Layer B BPE.

Not committed to git (see .gitignore) — it accumulates live user input, so it
stays a local/deployment-scoped runtime artifact rather than checked-in data.
"""

import json
import logging
import threading
import time
import uuid
from pathlib import Path
from typing import Any

from .swaram import segment_aksharas

logger = logging.getLogger(__name__)

DATASET_FILE = Path(__file__).resolve().parents[3] / "data" / "generated" / "agent_artifacts.jsonl"

SOURCE = "avai-agent-swarm"
# AI-generated, corpus-grounded conversational content — one tier below the
# tier-1 primary/classical sources (e.g. thirukkural-classical).
TIER = 2

_LOCK = threading.Lock()


def record_artifact(
    *,
    session_id: str,
    user_id: str,
    workflow: str,
    pulavar: str,
    message: str,
    response_text: str,
    citations: list[dict[str, Any]],
    model: str,
    elapsed_ms: int,
) -> dict[str, Any]:
    """Append one agent-response artifact to the dataset. Never raises —
    a storage hiccup should not fail the API response it is recording."""
    aksharas = segment_aksharas(response_text) if response_text.strip() else []
    record = {
        "id": str(uuid.uuid4()),
        "text": response_text,
        "source": SOURCE,
        "tier": TIER,
        # Grounded (cites real verses) scores higher than free-form chat —
        # a cheap proxy until adhan's own validation pass scores it properly.
        "quality_score": 1.0 if citations else 0.6,
        "timestamp": time.time(),
        "session_id": session_id,
        "user_id": user_id,
        "workflow": workflow,
        "pulavar": pulavar,
        "message": message,
        "response_text": response_text,
        "citations": citations,
        "model": model,
        "elapsed_ms": elapsed_ms,
        "swaram_aksharas": aksharas,
        "akshara_count": len(aksharas),
    }
    try:
        with _LOCK:
            DATASET_FILE.parent.mkdir(parents=True, exist_ok=True)
            with DATASET_FILE.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        logger.exception("Failed to persist agent artifact %s", record["id"])
    return record


def count_artifacts() -> int:
    """Cheap line count for the /avai/dataset/stats endpoint. Returns 0 if the
    dataset does not exist yet (no traffic recorded since last reset)."""
    if not DATASET_FILE.exists():
        return 0
    with DATASET_FILE.open("r", encoding="utf-8") as f:
        return sum(1 for _ in f)


def iter_artifacts():
    """Yield recorded artifacts oldest-first, for offline analysis/export."""
    if not DATASET_FILE.exists():
        return
    with DATASET_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)
