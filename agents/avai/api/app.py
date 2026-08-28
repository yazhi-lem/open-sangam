"""FastAPI app exposing POST /avai/ask — the REST entry point for the Avai
agent swarm, built for the chat.yazhi.dev integration.
"""

import os
import re
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..poets.avvaiyar import avvaiyar_agent
from ..poets.kapilar import kapilar_agent
from ..poets.nakkirar import nakkirar_agent
from ..poets.paranar import paranar_agent
from ..poets.tholkappiyar import tholkappiyar_agent
from ..swarm import root_agent
from ..tools.corpus import get_verse
from . import sessions
from .schemas import AskMetadata, AskRequest, AskResponse, Citation

app = FastAPI(title="Avai Ask API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

_WORKFLOW_TO_PULAVAR = {
    "qa": "avvaiyar",
    "search": "kapilar",
    "reimagine": "kapilar",
    "scenario": "tholkappiyar",
    "imagery": "paranar",
    "general": "nakkirar",
}

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
async def health() -> dict:
    return {"status": "ok"}


@app.post("/avai/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    target_pulavar = request.pulavar or request.poet
    if not target_pulavar:
        target_pulavar = _WORKFLOW_TO_PULAVAR.get(request.workflow or "qa", "avvaiyar")

    runner = _RUNNERS.get(target_pulavar, _RUNNERS["avvaiyar"])

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
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent execution failed: {exc}") from exc

    elapsed_ms = int((time.monotonic() - start) * 1000)
    effective_workflow = request.workflow or "qa"

    return AskResponse(
        session_id=session_id,
        workflow=effective_workflow,
        pulavar=target_pulavar,
        poet=target_pulavar,
        response_text=final_text.strip(),
        citations=_extract_citations(final_text),
        metadata=AskMetadata(
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )
