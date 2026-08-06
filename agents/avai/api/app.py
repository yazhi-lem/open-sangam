"""FastAPI app exposing POST /avai/ask — the REST entry point for the Avai
agent swarm, built for the chat.yazhi.dev integration. See
docs/api/avai-ask-prd.md for the full PRD and
docs/integration/chat-yazhi-integration.md for the integration guide.

M1 scope: only the "qa" workflow is wired, routed to the ஔவையார் (Avvaiyar)
Q&A agent. Other workflow values validate and are accepted by the request
schema (so callers can code against the full contract now) but return 501
until their agents land in M2 — see poets/avvaiyar.py and
docs/agent-implementation-plan.md §9 for the M2 roadmap.

Run from `agents/` (same cwd convention as `adk run avai`):
    uvicorn avai.api.app:app --reload --port 8080
"""

import os
import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..poets.avvaiyar import avvaiyar_agent
from ..tools.corpus import get_verse
from . import sessions
from .schemas import AskMetadata, AskRequest, AskResponse, Citation

app = FastAPI(title="Avai Ask API", version="0.1.0")

_session_service = InMemorySessionService()
_runner = Runner(
    app_name=sessions.APP_NAME, agent=avvaiyar_agent, session_service=_session_service
)

# verse ids are always <poem>_<number>, e.g. purananooru_001 (see tools/corpus.py).
_VERSE_ID_PATTERN = re.compile(r"\b[a-z]+_\d{2,4}\b")

_MODEL_LABEL = "{}:{}".format(
    os.getenv("SANGAM_AGENT_BACKEND", "openrouter"),
    os.getenv("SANGAM_AGENT_MODEL", "google/gemini-2.5-flash"),
)

_UNIMPLEMENTED_WORKFLOWS = {
    "search": "Poem search & discovery lands with the poet swarm (M2).",
    "reimagine": "Poem reimagining is Kapilar's workflow (M2), not yet wired.",
    "scenario": "Scenario extraction is Tholkappiyar's workflow (M2), not yet wired.",
    "imagery": "Image-prompt generation is Paranar's workflow (M2), not yet wired.",
}


# Normalize error shapes to {"message": "..."} to match the existing Cloud
# Functions contract (docs/api-contracts.md), rather than FastAPI's default
# {"detail": ...} shape — one error contract for callers across both APIs.
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
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


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
    """Pull verse-id-shaped tokens out of the response and keep only real ones.

    The LLM is instructed to cite verse ids inline (see prompts.py's
    CITATION_RULE); this re-derives structured citations from that text by
    checking each candidate against the corpus rather than trusting the LLM's
    formatting, so a hallucinated id is silently dropped instead of returned.
    """
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
            )
        )
    return citations


@app.get("/avai/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/avai/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    if request.workflow != "qa":
        reason = _UNIMPLEMENTED_WORKFLOWS.get(
            request.workflow, f"Unknown workflow {request.workflow!r}."
        )
        raise HTTPException(status_code=501, detail=reason)

    sessions.prune_expired()

    session_id = request.session_id or str(uuid.uuid4())
    user_id = request.user_id or "anonymous"

    if not sessions.exists(session_id):
        await _session_service.create_session(
            app_name=sessions.APP_NAME, user_id=user_id, session_id=session_id
        )
    sessions.touch(session_id, user_id)

    outgoing_message = _augment_with_context(request.message, request.context)
    content = types.Content(role="user", parts=[types.Part(text=outgoing_message)])

    start = time.monotonic()
    final_text = ""
    try:
        async for event in _runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text += part.text
    except Exception as exc:  # noqa: BLE001 — don't leak internals to callers
        raise HTTPException(status_code=502, detail="Agent execution failed") from exc

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return AskResponse(
        session_id=session_id,
        workflow="qa",
        poet="avvaiyar",
        response_text=final_text.strip(),
        citations=_extract_citations(final_text),
        metadata=AskMetadata(
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )
