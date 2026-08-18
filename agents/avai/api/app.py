"""FastAPI app exposing POST /avai/ask — the REST entry point for the Avai
agent swarm, built for the chat.yazhi.dev integration. See
docs/api/avai-ask-prd.md for the full PRD and
docs/integration/chat-yazhi-integration.md for the integration guide.

The `agent` field selects which poet agent to route to (defaults to nakkirar).
The `workflow` field selects the workflow type. Currently wired:
- "qa" → any agent (Q&A mode)
- "imagery" → paranar (image prompt generation)

Other workflow values return 501 until M2 lands.

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
from ..poets.english_scholar import english_scholar_agent
from ..poets.kapilar import kapilar_agent
from ..poets.nakkirar import nakkirar_agent
from ..poets.paranar import paranar_agent
from ..poets.tholkappiyar import tholkappiyar_agent
from ..tools.corpus import get_verse
from ..tools.image_gen import get_image_backend
from . import sessions
from .schemas import AskMetadata, AskRequest, AskResponse, Citation

app = FastAPI(title="Avai Ask API", version="0.3.0")

_session_service = InMemorySessionService()

# Per-agent runners — one Runner per poet agent, all sharing the same session service.
_AGENTS = {
    "nakkirar": nakkirar_agent,
    "avvaiyar": avvaiyar_agent,
    "kapilar": kapilar_agent,
    "tholkappiyar": tholkappiyar_agent,
    "english_scholar": english_scholar_agent,
    "paranar": paranar_agent,
}

_RUNNERS = {
    name: Runner(
        app_name=sessions.APP_NAME, agent=agent, session_service=_session_service
    )
    for name, agent in _AGENTS.items()
}

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
}

# Workflows that are wired to specific agents.
_WIRED_WORKFLOWS = {"qa", "imagery"}


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
    if request.workflow not in _WIRED_WORKFLOWS:
        reason = _UNIMPLEMENTED_WORKFLOWS.get(
            request.workflow, f"Unknown workflow {request.workflow!r}."
        )
        raise HTTPException(status_code=501, detail=reason)

    # For imagery workflow, default to paranar agent.
    agent_key = request.agent
    if request.workflow == "imagery" and agent_key not in ("paranar",):
        agent_key = "paranar"

    runner = _RUNNERS.get(agent_key)
    if runner is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent {agent_key!r}.",
        )

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
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text += part.text
    except Exception as exc:  # noqa: BLE001 — don't leak internals to callers
        raise HTTPException(status_code=502, detail="Agent execution failed") from exc

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # For imagery workflow, try to generate an image from the crafted prompt.
    image_url = None
    image_prompt = None
    if request.workflow == "imagery":
        backend = get_image_backend()
        # Extract the prompt from the response (Paranar returns it as text).
        image_prompt = final_text.strip()
        result = backend.generate(image_prompt)
        image_url = result.get("image_url")

    return AskResponse(
        session_id=session_id,
        workflow=request.workflow,
        poet=agent_key,
        response_text=final_text.strip(),
        citations=_extract_citations(final_text),
        metadata=AskMetadata(
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
        image_url=image_url,
        image_prompt=image_prompt,
    )
