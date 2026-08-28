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
    allow_origins=[
        "http://localhost:5173",  # Frontend default for Vite
        "http://127.0.0.1:5173",
        # Add other frontend origins if necessary, e.g., for deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_session_service = InMemorySessionService()

_POET_AGENTS = {
    "avvaiyar": avvaiyar_agent,
    "kapilar": kapilar_agent,
    "nakkirar": nakkirar_agent,
    "tholkappiyar": tholkappiyar_agent,
    "paranar": paranar_agent,
    "swarm": root_agent,
}

_RUNNERS = {
    name: Runner(app_name="poets", agent=agent, session_service=_session_service)
    for name, agent in _POET_AGENTS.items()
}
_runner = _RUNNERS["avvaiyar"]

_UNIMPLEMENTED_WORKFLOWS = {
    "search": "Poem search & discovery lands with the poet swarm (M2).",
    "reimagine": "Poem reimagining is Kapilar's workflow (M2), not yet wired.",
    "scenario": "Scenario extraction is Tholkappiyar's workflow (M2), not yet wired.",
    "imagery": "Image-prompt generation is Paranar's workflow (M2), not yet wired.",
}

_WORKFLOW_TO_POET = {
    "qa": "avvaiyar",
    "search": "kapilar",
    "reimagine": "kapilar",
    "scenario": "tholkappiyar",
    "imagery": "paranar",
    "general": "nakkirar",
}

# verse ids are always <poem>_<number>, e.g. purananooru_001 (see tools/corpus.py).
_VERSE_ID_PATTERN = re.compile(r"\b[a-z]+_\d{2,4}\b")

_MODEL_LABEL = "{}:{}".format(
    os.getenv("SANGAM_AGENT_BACKEND", "openrouter"),
    os.getenv("SANGAM_AGENT_MODEL", "google/gemini-2.5-flash"),
)


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


@app.get("/avai/poets")
async def get_poets() -> list[dict]:
    return [
        {
            "id": "avvaiyar",
            "name_ta": "ஔவையார்",
            "name_en": "Avvaiyar",
            "role_ta": "தத்துவ & வினா-விடைப் புலவர்",
            "role_en": "Philosopher & Q&A Scholar",
            "description": "Answers questions on Sangam poems, poets, and tiṇai with deep philosophical commentary and verse citations.",
            "workflow": "qa",
            "avatar": "👵",
            "tag": "வினா-விடை • Q&A",
            "default_tinai": "அனைத்தும்",
            "suggested_prompts": [
                "யாதும் ஊரே யாவரும் கேளிர் பாடலின் தத்துவ விளக்கம் என்ன?",
                "குறுந்தொகை 40 (செம்புலப் பெயல் நீர் போல) பாடலை விளக்குங்கள்.",
                "அதியமானுக்கு நெல்லிக்கனி தந்த வரலாற்றுப் பின்னணி என்ன?",
            ],
        },
        {
            "id": "kapilar",
            "name_ta": "கபிலர்",
            "name_en": "Kapilar",
            "role_ta": "குறிஞ்சிக் கோ & பாடல் தேடல்",
            "role_en": "Master of Nature & Verse Discovery",
            "description": "Specialist in mountain ecosystems, natural imagery, and retrieving relevant Sangam verses across the corpus.",
            "workflow": "search",
            "avatar": "🏔️",
            "tag": "பாடல் தேடல் • Discovery",
            "default_tinai": "குறிஞ்சி",
            "suggested_prompts": [
                "குறிஞ்சித் திணையில் பூக்கும் மலர்கள் மற்றும் இயற்கை காட்சிகள் பற்றிய பாடல்களைக் காட்டு.",
                "மழை மற்றும் மேகங்களை வர்ணிக்கும் சங்கப் பாடல்கள் எவை?",
                "வேங்கை மரம் மற்றும் யானை இடம்பெறும் குறிஞ்சிப் பாடல்களைத் தேடு.",
            ],
        },
        {
            "id": "nakkirar",
            "name_ta": "நக்கீரர்",
            "name_en": "Nakkirar",
            "role_ta": "தலைமைப் புலவர் & சங்கத் தலைவர்",
            "role_en": "Convener & Critical Scholar",
            "description": "Leader and literary judge of the Sangam Avai; evaluates poetics, debates classical themes, and coordinates the council.",
            "workflow": "general",
            "avatar": "👑",
            "tag": "தலைமை • Convener",
            "default_tinai": "அனைத்தும்",
            "suggested_prompts": [
                "சங்க அவையின் நோக்கம் மற்றும் எட்டுத்தொகை, பத்துப்பாட்டு சிறப்புகள் என்ன?",
                "இறையனார் அகப்பொருள் உரை உருவான விதம் பற்றி கூறுங்கள்.",
                "சங்கப் புலவர்களின் கவிதை நடை மற்றும் விவாத மரபுகளை விளக்குக.",
            ],
        },
        {
            "id": "tholkappiyar",
            "name_ta": "தொல்காப்பியர்",
            "name_en": "Tholkappiyar",
            "role_ta": "பேரிலக்கண ஆசிரியர் & சூழல் ஆய்வாளர்",
            "role_en": "Master Grammarian & Scenario Extractor",
            "description": "Analyzes poetic structure, Muthal-Karu-Uri porul elements, dramatic speakers, and grammatical conventions.",
            "workflow": "scenario",
            "avatar": "📜",
            "tag": "சூழல் ஆய்வு • Structure",
            "default_tinai": "இலக்கணம்",
            "suggested_prompts": [
                "நற்றிணை 1 ஆம் பாடலின் முதல், கரு, உரிப் பொருள் சூழலை பகுப்பாய்வு செய்க.",
                "தலைவி தோழியிடம் கூறும் கூற்றுகளின் இலக்கண மரபுகள் யாவை?",
                "அகத்திணைக்குரிய ஐந்து நிலங்களின் உரிப்பொருள்களை வகைப்படுத்துக.",
            ],
        },
        {
            "id": "paranar",
            "name_ta": "பரணர்",
            "name_en": "Paranar",
            "role_ta": "வரலாற்றுச் சித்தர் & காட்சி வடிவாளர்",
            "role_en": "Visualizer & Historical Imagery",
            "description": "Recreates visual scenes, vivid historical metaphors, and crafts generative visual prompts for classical verses.",
            "workflow": "imagery",
            "avatar": "🎨",
            "tag": "காட்சி உருவாக்கம் • Visualizer",
            "default_tinai": "வரலாறு / காட்சி",
            "suggested_prompts": [
                "நெய்தல் நிலத்து மாலையும் அலைகளும் படர்க்கும் காட்சியை உருவாக்குக.",
                "பாலை நிலத்தின் கடும் வெப்பமும் நிழலற்ற மரங்களும் கொண்ட காட்சியைச் சித்தரி.",
                "சேரன் செங்குட்டுவன் காலத்துக் கடற்கரைத் துறைமுகத்தை விவரித்து காட்சிப்படுத்து.",
            ],
        },
        {
            "id": "swarm",
            "name_ta": "சங்க அவை",
            "name_en": "Sangam Avai Swarm",
            "role_ta": "ஒருங்கிணைந்த புலவர் பேரவை",
            "role_en": "Full Council Peer Mesh",
            "description": "Full multi-agent assembly where Nakkirar convenes all 5 Pulavar scholars collaboratively.",
            "workflow": "qa",
            "avatar": "🏛️",
            "tag": "முழுப் பேரவை • Swarm",
            "default_tinai": "முழு சங்கம்",
            "suggested_prompts": [
                "முல்லைத் திணையின் காதலும் காத்திருத்தலும் — இலக்கணம், பாடல், காட்சி மூன்றையும் விளக்குங்கள்.",
                "கபிலரும் பரணரும் இணைந்து பாடிய பாடல்களின் சிறப்புகள் யாவை?",
            ],
        },
    ]


@app.post("/avai/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    if not request.poet and request.workflow in _UNIMPLEMENTED_WORKFLOWS:
        reason = _UNIMPLEMENTED_WORKFLOWS.get(
            request.workflow, f"Unknown workflow {request.workflow!r}."
        )
        raise HTTPException(status_code=501, detail=reason)

    target_poet = request.poet
    if not target_poet:
        target_poet = _WORKFLOW_TO_POET.get(request.workflow or "qa", "avvaiyar")

    runner = _runner if target_poet == "avvaiyar" else _RUNNERS.get(target_poet, _runner)

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

    effective_workflow = request.workflow or "qa"

    return AskResponse(
        session_id=session_id,
        workflow=effective_workflow,
        poet=target_poet,
        response_text=final_text.strip(),
        citations=_extract_citations(final_text),
        metadata=AskMetadata(
            model=_MODEL_LABEL,
            elapsed_ms=elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )
