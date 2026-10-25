"""Production health and capability discovery for the Avai API.

The legacy ``GET /avai/health`` endpoint stays a tiny liveness check for
existing callers. This module adds the richer contracts Cloud Run and the
frontend can rely on:

* ``liveness()`` — is the process up? No dependency I/O.
* ``readiness()`` — are the corpus, knowledge graph, tiṇai data, and model
  configuration usable? Returns HTTP 503 only when the service cannot answer.
* ``capabilities()`` — what poets, workflows, tools, corpus, and runtime
  features are actually present in this build (no secrets included).

``AVAI_STRICT_READINESS=1`` makes a missing model API key fail readiness.
Deployments set it so a misconfigured secret never receives traffic; local
development and the no-key pytest suite leave it unset.
"""

import os
import time
from datetime import datetime, timezone

from . import config
from .store import interaction_graph
from .tools.corpus import corpus_stats
from .tools.graph import graph_stats
from .tools.tinai import tinai_stats

SERVICE_NAME = "avai-api"
# Injected by the deploy workflow as the git SHA; useful for correlating a
# running instance with the exact build that shipped it.
SERVICE_VERSION = os.getenv("AVAI_VERSION", "0.1.0")
_STARTED_AT = time.time()

# Display metadata for the five poets. Canonical ids/workflows live here and
# the REST API imports the maps below, so health, capabilities, and routing
# cannot drift apart.
AGENT_CATALOG = {
    "nakkirar": {
        "tamil_name": "நக்கீரர்",
        "english_name": "Nakkirar",
        "role": "convener",
        "workflows": ["general"],
    },
    "avvaiyar": {
        "tamil_name": "ஔவையார்",
        "english_name": "Avvaiyar",
        "role": "qa",
        "workflows": ["qa"],
    },
    "kapilar": {
        "tamil_name": "கபிலர்",
        "english_name": "Kapilar",
        "role": "poem_recreation_and_search",
        "workflows": ["search", "reimagine"],
    },
    "tholkappiyar": {
        "tamil_name": "தொல்காப்பியர்",
        "english_name": "Tholkappiyar",
        "role": "scenario_extraction",
        "workflows": ["scenario"],
    },
    "paranar": {
        "tamil_name": "பரணர்",
        "english_name": "Paranar",
        "role": "imagery",
        "workflows": ["imagery"],
    },
}

WORKFLOW_TO_PULAVAR = {
    "qa": "avvaiyar",
    "search": "kapilar",
    "reimagine": "kapilar",
    "scenario": "tholkappiyar",
    "imagery": "paranar",
    "general": "nakkirar",
}

PULAVAR_TO_DEFAULT_WORKFLOW = {
    "avvaiyar": "qa",
    "kapilar": "search",
    "tholkappiyar": "scenario",
    "paranar": "imagery",
    "nakkirar": "general",
    "swarm": "qa",
}


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def uptime_seconds() -> int:
    return int(time.time() - _STARTED_AT)


def liveness() -> dict:
    """Cheap process-level check. Deliberately does not touch the corpus."""
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "uptime_seconds": uptime_seconds(),
        "timestamp": _iso_now(),
    }


def _check(name: str, ok: bool, *, critical: bool = True, detail=None) -> dict:
    return {
        "name": name,
        "ok": ok,
        "critical": critical,
        "detail": detail,
    }


def readiness() -> tuple[dict, int]:
    """Validate the dependencies required to answer an /avai/ask request.

    Returns ``(payload, http_status)``. A missing API key is reported as
    ``degraded`` (HTTP 200) unless AVAI_STRICT_READINESS=1, in which case it is
    a hard failure — that is the production setting used by Cloud Run.
    """
    checks: list[dict] = []

    corpus = None
    try:
        corpus = corpus_stats()
        checks.append(
            _check(
                "corpus",
                corpus["verses"] > 0 and corpus["poems"] > 0,
                detail={"verses": corpus["verses"], "poems": corpus["poems"]},
            )
        )
    except Exception as exc:  # pragma: no cover - defensive for corrupt data
        checks.append(_check("corpus", False, detail=str(exc)))

    graph = None
    try:
        graph = graph_stats()
        checks.append(
            _check(
                "knowledge_graph",
                graph["nodes"] > 0 and graph["edges"] > 0,
                detail={"nodes": graph["nodes"], "edges": graph["edges"]},
            )
        )
    except Exception as exc:  # pragma: no cover
        checks.append(_check("knowledge_graph", False, detail=str(exc)))

    tinai = None
    try:
        tinai = tinai_stats()
        checks.append(
            _check(
                "tinai_context",
                tinai["count"] >= 5,
                detail={"count": tinai["count"]},
            )
        )
    except Exception as exc:  # pragma: no cover
        checks.append(_check("tinai_context", False, detail=str(exc)))

    model = config.get_model_config()
    strict = os.getenv("AVAI_STRICT_READINESS") == "1"
    checks.append(
        _check(
            "model_config",
            model["configured"] or not strict,
            critical=strict,
            detail={
                "backend": model["backend"],
                "model": model["model"],
                "api_key_configured": model["configured"],
            },
        )
    )

    critical_ok = all(c["ok"] for c in checks if c["critical"])
    status = "ready" if critical_ok and model["configured"] else "degraded"
    if not critical_ok:
        status = "not_ready"

    payload = {
        "status": status,
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "uptime_seconds": uptime_seconds(),
        "timestamp": _iso_now(),
        "strict": strict,
        "checks": checks,
        "corpus": {"verses": corpus["verses"], "poems": corpus["poems"]} if corpus else None,
        "knowledge_graph": {"nodes": graph["nodes"], "edges": graph["edges"]} if graph else None,
    }
    return payload, (200 if critical_ok else 503)


def _tool_names(agent) -> list[str]:
    names = []
    for tool in getattr(agent, "tools", []):
        name = getattr(tool, "name", None) or getattr(tool, "__name__", None)
        if name:
            names.append(name)
    return sorted(set(names))


def capabilities() -> dict:
    """Describe the agents and features this deployment actually exposes."""
    from .poets.avvaiyar import avvaiyar_agent
    from .poets.kapilar import kapilar_agent
    from .poets.nakkirar import nakkirar_agent
    from .poets.paranar import paranar_agent
    from .poets.tholkappiyar import tholkappiyar_agent

    agents = {
        "nakkirar": nakkirar_agent,
        "avvaiyar": avvaiyar_agent,
        "kapilar": kapilar_agent,
        "tholkappiyar": tholkappiyar_agent,
        "paranar": paranar_agent,
    }

    poets = []
    for agent_id, agent in agents.items():
        meta = AGENT_CATALOG[agent_id]
        poets.append(
            {
                "id": agent_id,
                **meta,
                "description": getattr(agent, "description", None),
                "tools": _tool_names(agent),
                "handoffs": sorted(
                    name
                    for name in _tool_names(agent)
                    if name in AGENT_CATALOG
                ),
            }
        )

    corpus = corpus_stats()
    graph = graph_stats()
    growth = interaction_graph.snapshot()
    model = config.get_model_config()
    rate_limit = int(os.getenv("AVAI_RATE_LIMIT_PER_MINUTE", "0"))
    image_backend = os.getenv("SANGAM_IMAGE_BACKEND", "none")

    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": _iso_now(),
        "model": {
            "backend": model["backend"],
            "name": model["model"],
            "configured": model["configured"],
            "tool_calling": True,
        },
        "poets": poets,
        "workflows": dict(WORKFLOW_TO_PULAVAR),
        "swarm": {
            "enabled": True,
            "entry_point": "nakkirar",
            "topology": "peer_mesh",
            "handoffs": {p["id"]: p["handoffs"] for p in poets},
        },
        "corpus": {
            "verses": corpus["verses"],
            "poems": corpus["poems"],
            "poem_ids": corpus["poem_ids"],
        },
        "knowledge_graph": {
            "nodes": graph["nodes"],
            "edges": graph["edges"],
            "live_nodes": len(growth["nodes"]),
            "live_edges": len(growth["edges"]),
        },
        "features": {
            "auto_intent_routing": True,
            "multi_turn_sessions": True,
            "verified_citations": True,
            "abstention_on_unsupported_claims": True,
            "rate_limiting": rate_limit > 0,
            "rate_limit_per_minute": rate_limit,
            "image_generation": image_backend not in ("none", ""),
            "image_backend": image_backend,
        },
    }
