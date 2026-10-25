"""FastAPI app exposing POST /avai/ask — the REST entry point for the Avai
agent swarm, built for the chat.yazhi.dev integration.
"""

import logging
import os
import re
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from starlette.exceptions import HTTPException as StarletteHTTPException

from .. import health, telemetry
from ..citation_validator import PulavarCitationValidator
from ..poets.avvaiyar import avvaiyar_agent
from ..poets.kapilar import kapilar_agent
from ..poets.nakkirar import nakkirar_agent
from ..poets.paranar import paranar_agent
from ..poets.tholkappiyar import tholkappiyar_agent
from ..store import artifacts, interaction_graph
from ..swarm import root_agent
from ..tools.corpus import get_verse
from . import sessions
from .schemas import (
    AskMetadata,
    AskRequest,
    AskResponse,
    Citation,
    PulavarAnswer,
    PulavarClaim,
)

logger = logging.getLogger(__name__)

telemetry.configure_logging()
app = FastAPI(title="Avai Ask API", version="0.1.0")
app.add_middleware(telemetry.TelemetryMiddleware)
_citation_validator = PulavarCitationValidator()


def _allowed_origins() -> list[str]:
    # Comma-separated list, e.g. "https://sangam.yazhi.dev,https://yazhi.dev".
    # Unset (local dev) keeps the old allow-all behaviour.
    raw = os.getenv("AVAI_ALLOWED_ORIGINS", "*")
    return [o.strip() for o in raw.split(",") if o.strip()] or ["*"]


# The browser client never sends cookies or auth headers, so credentials stay
# off; that also keeps a "*" origin list valid per the CORS spec.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# Per-client sliding-window limit on POST /avai/ask. The public read mode has
# no login, and every ask spends model tokens, so a deployed instance sets
# AVAI_RATE_LIMIT_PER_MINUTE; 0 (the default) disables it for local dev/tests.
# In-process only, like the session store: good enough for one Cloud Run
# instance, not a substitute for an edge limit once traffic needs more.
_RATE_WINDOW_SECONDS = 60.0
_rate_hits: dict[str, deque] = defaultdict(deque)


def _client_key(request: Request) -> str:
    # Use the RIGHTMOST X-Forwarded-For entry: it is the one appended by the
    # hosting front end (Cloud Run), while earlier entries are client-supplied
    # and could be rotated to dodge the limit.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(request: Request) -> None:
    limit = int(os.getenv("AVAI_RATE_LIMIT_PER_MINUTE", "0"))
    if limit <= 0:
        return
    now = time.monotonic()
    hits = _rate_hits[_client_key(request)]
    while hits and now - hits[0] > _RATE_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= limit:
        retry_after = max(1, int(_RATE_WINDOW_SECONDS - (now - hits[0])) + 1)
        raise HTTPException(
            status_code=429,
            detail="Too many questions in a short time. Please wait a minute and ask again.",
            headers={"Retry-After": str(retry_after)},
        )
    hits.append(now)

_session_service = InMemorySessionService()

_PULAVAR_AGENTS = {
    "avvaiyar": avvaiyar_agent,
    "kapilar": kapilar_agent,
    "nakkirar": nakkirar_agent,
    "tholkappiyar": tholkappiyar_agent,
    "paranar": paranar_agent,
    "swarm": root_agent,
}

_RUNNERS = {
    name: Runner(app_name=sessions.APP_NAME, agent=agent, session_service=_session_service)
    for name, agent in _PULAVAR_AGENTS.items()
}

# Shared with health.py's capability catalogue so routing and discovery
# cannot drift apart.
_WORKFLOW_TO_PULAVAR = health.WORKFLOW_TO_PULAVAR
_PULAVAR_TO_DEFAULT_WORKFLOW = health.PULAVAR_TO_DEFAULT_WORKFLOW


def classify_message(message: str) -> tuple[str, str]:
    """Classifies user message into (workflow, routing_reason).
    Default for greetings, meta questions, and unknown intent is ('general', ...).
    """
    msg = message.strip()
    msg_lower = msg.lower()

    # 1. Greetings & meta questions -> general (nakkirar)
    meta_patterns = [
        r"^(hi+|hello|hey|vanakkam|வணக்கம்|நலமா)[!.,?\s]*$",
        r"\b(who are you|what is your workflow|how do you work|your workflow)\b",
        r"(?:^|[^\w])(நீ\s*யார்|யார்\s*நீ|உன்\s*பணி|உன்\s*வேலை|அவை\s*எவ்வாறு\s*செயல்படுகிறது)(?:[^\w]|$)",
        r"\b(vera edhum|pesa mttiya)\b|(?:^|[^\w])(வேற\s*எதுவும்|பேச\s*மாட்டியா)(?:[^\w]|$)",
    ]
    for pat in meta_patterns:
        if re.search(pat, msg_lower):
            return "general", "greeting_or_meta"

    # 2. Verse search & discovery -> search (kapilar)
    search_patterns = [
        r"\b(find|search|look for|discover|list|show)\b.*(?:\b(verse|verses|poem|poems|song|songs)\b|(?:^|[^\w])(பாடல்|பாடல்கள்)(?:[^\w]|$))",
        r"\b(verses|poems|songs)\b.*\b(about|on|for)\b",
        r"(பாடல்களைத்\s*தேடு|பாடல்\s*தேடல்|பாடல்கள்\s*தேடு|தேடித்\s*தருக|கண்டுபிடி)",
        r"(பற்றிய\s*பாடல்கள்|குறித்த\s*பாடல்கள்|பாடல்கள்\s*(?:எவை|யாவை)|வருணிக்கும்.*பாடல்கள்)",
    ]
    for pat in search_patterns:
        if re.search(pat, msg_lower):
            return "search", "verse_search_intent"

    # 3. Visual & Imagery -> imagery (paranar)
    imagery_patterns = [
        r"\b(draw|paint|illustrate)\b",
        r"\b(generate|create|make)\s+(an?\s+)?(image|picture)\b",
        r"\bpicture\s+of\b",
        r"(?:ஓவியம்|படம்|காட்சி|சித்திரம்)\s*(?:வரை|வரைக|வரையவும்|வரைந்து)|காட்சிப்படுத்து",
    ]
    for pat in imagery_patterns:
        if re.search(pat, msg_lower):
            return "imagery", "imagery_intent"

    # 4. Grammar, prosody, linguistics -> scenario (tholkappiyar)
    grammar_patterns = [
        r"\b(grammar|meter|prosody|poetics|tholkappiyam|tolkappiyam|rule)\b",
        r"(இலக்கணம்|யாப்பு|தொல்காப்பியம்|சூத்திரம்|அணி)",
    ]
    for pat in grammar_patterns:
        if re.search(pat, msg_lower):
            return "scenario", "grammar_scenario_intent"

    # 5. Verse commentary / explanation / Q&A -> qa (avvaiyar)
    qa_patterns = [
        r"\b[a-z]+_\d{2,4}\b",
        r"\b(meaning|explain|commentary|philosoph|significance|tiṇai|tinai)\b",
        r"(பொருள்|விளக்கம்|விளக்குக|கருத்து|தத்துவம்|திணை)",
    ]
    for pat in qa_patterns:
        if re.search(pat, msg_lower):
            return "qa", "qa_commentary_intent"

    # 6. Default for unknown intent -> nakkirar
    return "general", "default_convener"

_VERSE_ID_PATTERN = re.compile(r"\b[a-z]+_\d{2,4}\b")

_MODEL_LABEL = "{}:{}".format(
    os.getenv("SANGAM_AGENT_BACKEND", "openrouter"),
    os.getenv("SANGAM_AGENT_MODEL", "google/gemini-2.5-flash"),
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    first_error = exc.errors()[0]
    field = ".".join(str(loc) for loc in first_error["loc"] if loc != "body")
    return JSONResponse(
        status_code=400,
        content={"message": f"`{field}` invalid: {first_error['msg']}"},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
        headers=getattr(exc, "headers", None),
    )


def _augment_with_context(message: str, context) -> str:
    hints = []
    if context.tinai:
        hints.append(f"tiṇai={context.tinai}")
    if context.poem:
        hints.append(f"poem={context.poem}")
    if context.limit != 10:
        hints.append(f"limit={context.limit}")
    if not hints:
        return message
    return f"{message}\n\n[Context hints: {', '.join(hints)}]"


def _extract_citations(text: str) -> list[Citation]:
    citations = []
    seen = set()
    for match in _VERSE_ID_PATTERN.findall(text.lower()):
        if match in seen:
            continue
        seen.add(match)
        verse = get_verse(match)
        if "error" in verse:
            continue
        citations.append(
            Citation(
                verse_id=verse["id"],
                poem=verse.get("poem"),
                tinai=verse.get("tinai"),
                poet=verse.get("poet"),
                pulavar=verse.get("poet"),
            )
        )
    return citations


@app.get("/avai/health")
async def health_check() -> dict:
    # Kept byte-for-byte compatible with the original contract; richer probes
    # live at the explicit /live, /ready, and /capabilities routes below.
    return {"status": "ok"}


@app.get("/avai/health/live")
async def health_live() -> dict:
    return health.liveness()


@app.get("/avai/health/ready")
async def health_ready() -> JSONResponse:
    payload, status_code = health.readiness()
    return JSONResponse(
        status_code=status_code,
        content=payload,
        headers={"Cache-Control": "no-store"},
    )


@app.get("/avai/capabilities")
async def avai_capabilities() -> JSONResponse:
    return JSONResponse(
        content=health.capabilities(),
        headers={"Cache-Control": "public, max-age=300"},
    )


@app.get("/avai/metrics")
async def avai_metrics() -> JSONResponse:
    """Aggregate in-process telemetry for dashboards and smoke checks.

    Contains counters/histograms only — no prompts, responses, or secrets.
    """
    return JSONResponse(
        content=telemetry.snapshot(),
        headers={"Cache-Control": "no-store"},
    )


@app.get("/avai/dataset/stats")
async def dataset_stats() -> dict:
    """Observability for the continuous enrichment loop: how big the agent
    artifact dataset has grown, and how big the usage-driven interaction
    graph layer is (see store/artifacts.py, store/interaction_graph.py)."""
    growth = interaction_graph.snapshot()
    return {
        "artifact_count": artifacts.count_artifacts(),
        "interaction_graph": {
            "nodes": len(growth["nodes"]),
            "edges": len(growth["edges"]),
        },
    }


def _capture_artifact(
    *,
    session_id: str,
    user_id: str,
    workflow: str,
    pulavar: str,
    message: str,
    response_text: str,
    citations: list[Citation],
    elapsed_ms: int,
) -> None:
    """Runs after the response is sent (see BackgroundTasks below) so dataset
    persistence and graph growth never add latency to /avai/ask."""
    citation_dicts = [c.model_dump() for c in citations]
    with telemetry.timer("avai_artifact_persist_duration_ms", pulavar=pulavar):
        artifacts.record_artifact(
            session_id=session_id,
            user_id=user_id,
            workflow=workflow,
            pulavar=pulavar,
            message=message,
            response_text=response_text,
            citations=citation_dicts,
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
        )
        interaction_graph.record_interaction(pulavar, citation_dicts)
    telemetry.inc("avai_artifacts_total", pulavar=pulavar, workflow=workflow)


@app.post("/avai/ask", response_model=AskResponse)
async def ask(
    request: AskRequest, background_tasks: BackgroundTasks, http_request: Request
) -> AskResponse:
    _check_rate_limit(http_request)
    target_pulavar = request.pulavar or request.poet
    if target_pulavar:
        effective_workflow = request.workflow or _PULAVAR_TO_DEFAULT_WORKFLOW.get(
            target_pulavar, "general"
        )
        routing_reason = "explicit_pulavar_selected"
    elif request.workflow:
        effective_workflow = request.workflow
        target_pulavar = _WORKFLOW_TO_PULAVAR.get(request.workflow, "nakkirar")
        routing_reason = "explicit_workflow_selected"
    else:
        effective_workflow, routing_reason = classify_message(request.message)
        target_pulavar = _WORKFLOW_TO_PULAVAR.get(effective_workflow, "nakkirar")

    runner = _RUNNERS.get(target_pulavar, _RUNNERS["nakkirar"])
    telemetry.set_request_identity(
        workflow=effective_workflow, pulavar=target_pulavar
    )
    telemetry.inc(
        "avai_route_total",
        workflow=effective_workflow,
        pulavar=target_pulavar,
        reason=routing_reason,
    )

    sessions.prune_expired()

    session_id = request.session_id or str(uuid.uuid4())
    user_id = request.user_id or "anonymous"
    telemetry.set_request_identity(session_id=session_id, user_id=user_id)

    if not sessions.exists(session_id):
        await _session_service.create_session(
            app_name=sessions.APP_NAME, user_id=user_id, session_id=session_id
        )
    sessions.touch(session_id, user_id)

    outgoing_message = _augment_with_context(request.message, request.context)
    content = types.Content(role="user", parts=[types.Part(text=outgoing_message)])

    provider, model_name = _MODEL_LABEL.split(":", 1)
    start = time.monotonic()
    final_text = ""
    token_in_total = 0
    token_out_total = 0
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            token_in, token_out = telemetry.extract_usage(event)
            token_in_total += token_in
            token_out_total += token_out
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text += part.text
    except Exception as exc:
        # Provider errors can carry request ids, quota details or key hints;
        # log them server-side and give the public a generic message.
        logger.exception("Agent execution failed for pulavar=%s", target_pulavar)
        telemetry.record_model_call(
            provider=provider,
            model=model_name,
            latency_ms=(time.monotonic() - start) * 1000,
            status="error",
        )
        telemetry.inc(
            "avai_agent_errors_total",
            pulavar=target_pulavar,
            error_type=type(exc).__name__,
        )
        detail = "Agent execution failed. Please try again."
        if os.getenv("AVAI_DEBUG_ERRORS") == "1":
            detail = f"Agent execution failed: {exc}"
        raise HTTPException(status_code=502, detail=detail) from exc

    elapsed_ms = int((time.monotonic() - start) * 1000)
    cost_usd = telemetry.record_model_call(
        provider=provider,
        model=model_name,
        latency_ms=elapsed_ms,
        token_in=token_in_total,
        token_out=token_out_total,
        status="ok",
    )
    raw_response_text = final_text.strip()

    # The model proposes; Python decides.
    pulavar_answer = _citation_validator.validate_answer(
        raw_response_text, user_query=request.message
    )

    for citation in pulavar_answer.citations:
        telemetry.inc("avai_citation_validations_total", valid=str(citation.is_valid))

    if pulavar_answer.is_abstained:
        response_text = pulavar_answer.answer_text
        citations: list[Citation] = []
        effective_claims = pulavar_answer.claims
        is_abstained = True
        abstention_reason = pulavar_answer.abstention_reason
        evidence_status = "abstained"
        telemetry.inc("avai_abstentions_total", reason=abstention_reason)
    else:
        response_text = pulavar_answer.answer_text
        effective_claims = pulavar_answer.claims
        is_abstained = False
        abstention_reason = "none"
        evidence_status = pulavar_answer.evidence_status
        citations = [
            Citation(
                verse_id=c.source_id,
                poem=c.source.poem if c.source else None,
                tinai=c.source.tinai if c.source else None,
                poet=c.source.poet if c.source else None,
                pulavar=c.source.poet if c.source else None,
                citation_id=c.citation_id,
                quote=c.quote,
                verified=c.is_valid,
                is_valid=c.is_valid,
            )
            for c in pulavar_answer.citations
            if c.is_valid
        ]

    background_tasks.add_task(
        _capture_artifact,
        session_id=session_id,
        user_id=user_id,
        workflow=effective_workflow,
        pulavar=target_pulavar,
        message=request.message,
        response_text=response_text,
        citations=citations,
        elapsed_ms=elapsed_ms,
    )

    return AskResponse(
        session_id=session_id,
        workflow=effective_workflow,
        pulavar=target_pulavar,
        poet=target_pulavar,
        routing_reason=routing_reason,
        response_text=response_text,
        citations=citations,
        claims=effective_claims,
        is_abstained=is_abstained,
        abstention_reason=abstention_reason,
        evidence_status=evidence_status,
        pulavar_answer=pulavar_answer,
        metadata=AskMetadata(
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
            workflow=effective_workflow,
            routed_pulavar=target_pulavar,
            routing_reason=routing_reason,
            token_in=token_in_total,
            token_out=token_out_total,
            cost_usd=cost_usd,
            cost_inr=telemetry.usd_to_inr(cost_usd),
        ),
    )
