# Sangam Poet-Swarm Agent System — Implementation Plan

**Status:** Proposed · **Tracking label:** `agents` · **Milestones:** Agents M1–M3

Open Sangam gains an AI agent system — **சங்க அவை (Sangam Avai, "the assembly")** — a swarm of
peer agents named after famous Sangam-era poets. The assembly can:

1. **Answer questions** about Sangam literature (poems, poets, tiṇai, culture), grounded in the
   repo's 2,032 normalized verses and knowledge graph, citing verse ids.
2. **Recreate poems** — reimagine, restyle, or poetically translate verses honoring tiṇai
   conventions, always labeled AI-generated.
3. **Extract scenarios** — structured JSON (speaker, tiṇai, uripporul, karu flora/fauna,
   dramatic situation) from any verse.
4. **Recreate imagery** — turn a verse's scene into an image prompt and render it through a
   pluggable image backend.

Built on **Google ADK** (Python) with **Gemma** as the reasoning model, exposed via the
**A2A protocol**, with rich responses rendered through **A2UI** in the existing React frontend.

---

## 1. The Poet Swarm

Five peer agents. ADK agent names use transliterated identifiers; Tamil script names appear in
display names, AgentCards, and the UI.

| Agent id | Tamil | Role | Why this figure |
|---|---|---|---|
| `nakkirar` | நக்கீரர் | **Convener & critic** — default entry point; routes queries to the right poet; reviews/critiques outputs | Legendary president of the Madurai Sangam; famously stood by his critique of a poem even before Shiva |
| `avvaiyar` | ஔவையார் | **Q&A** — answers questions on poems/poets/tiṇai/culture, grounded via corpus + graph tools; cites verse ids | The wise itinerant counselor-poet |
| `kapilar` | கபிலர் | **Poem recreation** — recreates/reimagines/translates poems honoring tiṇai conventions; output governance-labeled | Most prolific Sangam poet (200+ verses), master of kuṟiñci akam |
| `tholkappiyar` | தொல்காப்பியர் | **Scenario extraction** — structured output via Pydantic schema | The grammarian whose Tholkāppiyam codified the tiṇai/poruḷ scenario taxonomy itself |
| `paranar` | பரணர் | **Imagery** — verse → scene description → image prompt → `generate_image` tool | Renowned for vivid landscape and historical imagery |

### Swarm topology (peer mesh, not a hierarchy)

```
                    Browser  /avai  (React chat, A2UI renderer)
                                │ A2A JSON-RPC (message/send · message/stream)
                                ▼
        ┌──────────────── Cloud Run: sangam-avai (one service) ────────────────┐
        │   /a2a/nakkirar   /a2a/avvaiyar   /a2a/kapilar                       │
        │   /a2a/tholkappiyar   /a2a/paranar     ← five mounted A2A apps,      │
        │                                          five AgentCards             │
        │                                                                      │
        │        நக்கீரர் ◄──────► ஔவையார்                                      │
        │           ▲  ╲          ╱  ▲          full peer mesh:                │
        │           │   ╲        ╱   │          any poet can hand off          │
        │           ▼    ╲      ╱    ▼          to any other (ADK              │
        │        கபிலர் ◄──╳────► தொல்காப்பியர்   agent transfer)               │
        │           ▲      ╲   ╱     ▲                                         │
        │           └────► பரணர் ◄───┘ ──► generate_image (pluggable backend)  │
        │                                                                      │
        │   shared tools: corpus search · knowledge graph · tiṇai context      │
        └──────────────────────────────────────────────────────────────────────┘
                                │
                     data/texts/**  ·  data/knowledge/*.json   (read-only)
```

- **Internal handoffs — full peer mesh.** Each poet lists the other four for ADK agent
  transfer, so any agent can hand off mid-conversation (Avvaiyar answering a question can hand
  to Paranar to illustrate it; Kapilar can consult Tholkappiyar on tiṇai conventions before
  composing). Nakkirar is the default entry/convener, not a boss. *Fallback:* if Gemma's free
  transfer proves flaky in routing evals, a config flag constrains the mesh to hub-and-spoke
  through Nakkirar.
- **A2A — every poet is addressable.** Each agent gets its own `to_a2a()` ASGI app and
  AgentCard, all mounted in **one uvicorn process / one Cloud Run service** under
  `/a2a/<poet>/` (cards at `/a2a/<poet>/.well-known/agent-card.json`). External A2A clients
  can address any poet directly; the frontend enters via Nakkirar. Any poet can later be split
  to its own service and re-attached via `RemoteA2aAgent` with no redesign.

---

## 2. Verified ecosystem facts

- **google-adk (Python):** `pip install "google-adk[a2a]"` (pin the version — ADK releases
  move fast). Core: `google.adk.agents.LlmAgent`, `google.adk.models.Gemini`,
  `google.adk.models.lite_llm.LiteLlm`. Hosted Gemma via the Gemini API supports **tool
  calling and structured output**: `Gemini(model="gemma-3-27b-it")`.
- **A2A exposure:** `from google.adk.a2a.utils.agent_to_a2a import to_a2a` →
  Starlette/ASGI app served with uvicorn; auto-generated AgentCard at
  `/.well-known/agent-card.json`. Consuming side available via
  `google.adk.agents.remote_a2a_agent.RemoteA2aAgent`.
- **A2UI:** v0.9.1 is current; v1.0 is a release candidate — **spec still evolving**. Web
  renderer is Lit-based: npm `@a2ui/lit` (Card, Row, Column, List, Tabs, Image, Text, Button,
  Modal, Divider) + `@a2ui/web_core` (`MessageProcessor`). A2UI rides on A2A as a protocol
  extension declared in the AgentCard. No official React renderer yet, but React 19 supports
  custom elements natively, so the Lit component embeds directly.
- **Gemma default:** `gemma-3-27b-it` via the hosted Gemini API endpoint, reusing the
  project's existing `GEMINI_API_KEY` secret. Model string is an env var
  (`SANGAM_AGENT_MODEL`) so upgrades are config changes.

Sources: [ADK models overview](https://google.github.io/adk-docs/agents/models/) ·
[ADK A2A exposing quickstart](https://github.com/google/adk-docs/blob/main/docs/a2a/quickstart-exposing.md) ·
[google/A2UI](https://github.com/google/A2UI) · [A2UI quickstart](https://a2ui.org/quickstart/) ·
[@a2ui/lit](https://www.npmjs.com/package/@a2ui/lit) ·
[adk-python releases](https://github.com/google/adk-python/releases) ·
[LiteLLM ADK tutorial](https://docs.litellm.ai/docs/tutorials/google_adk)

---

## 3. Package layout

```
backend/agents/
├── README.md                  # setup, adk web, uvicorn, curl smoke tests, Ollama alternative
├── requirements.txt           # google-adk[a2a] (pinned), google-genai, python-dotenv, pytest
├── .env.example               # GEMINI_API_KEY, SANGAM_AGENT_MODEL, SANGAM_AGENT_BACKEND,
│                              # SANGAM_AGENT_API_BASE, SANGAM_IMAGE_BACKEND, ALLOWED_ORIGINS
├── Dockerfile                 # python:3.12-slim; copies data/texts + data/knowledge
├── sangam_avai/
│   ├── __init__.py            # from . import agent   (adk CLI convention)
│   ├── agent.py               # assembles the swarm; root export for adk run/web
│   ├── swarm.py               # peer-mesh wiring + mounted A2A apps (Starlette routes)
│   ├── config.py              # model/backend selection from env
│   ├── prompts.py             # poet personas, tiṇai conventions, governance disclaimers
│   ├── schemas.py             # Pydantic: Scenario, ImagePromptSpec
│   ├── a2ui_templates.py      # deterministic tool-output → A2UI JSON formatters
│   ├── poets/
│   │   ├── nakkirar.py  avvaiyar.py  kapilar.py  tholkappiyar.py  paranar.py
│   └── tools/
│       ├── corpus.py          # load + index data/texts/**/normalized/*.json at startup
│       ├── graph.py           # query data/knowledge/graph.json
│       ├── tinai.py           # data/knowledge/tinai_context.json lookup
│       └── image_gen.py       # ImageBackend adapter + generate_image tool
├── tests/                     # pytest for tools (no LLM needed)
└── evals/                     # adk eval sets: qa.evalset.json, routing.evalset.json
```

Coexists with `backend/python/` untouched — that remains the offline scrape/normalize/translate
pipeline; `backend/agents/` is the online service.

**Model config** (`config.py`):

```python
# default: hosted Gemma via Gemini API (GEMINI_API_KEY)
model = Gemini(model=os.getenv("SANGAM_AGENT_MODEL", "gemma-3-27b-it"))
# alt: SANGAM_AGENT_BACKEND=litellm →
#   LiteLlm(model="openai/google/gemma-3-27b-it",
#           api_base=os.getenv("SANGAM_AGENT_API_BASE"))   # Ollama / vLLM
```

**Local dev:** `cd backend/agents && adk web` (dev UI) or
`uvicorn sangam_avai.swarm:app --port 8001`.

---

## 4. Shared tools

Plain Python functions — ADK auto-wraps them as `FunctionTool`s. Keep **≤3 tools per poet**
(Gemma's tool calling is younger than Gemini's; small toolsets route more reliably).

| Tool | Signature | Backing data |
|---|---|---|
| `get_verse` | `(verse_id: str) -> dict` | `data/texts/<poem>/normalized/<id>.json` |
| `search_verses` | `(query, tinai=None, poem=None, limit=10) -> list[dict]` | in-memory index of all 2,032 verses over `sangamTamil`/`urai`/`culturalNotes`; returns trimmed fields |
| `list_poems` | `() -> list[dict]` | directory scan + verse counts |
| `query_knowledge_graph` | `(node_id=None, node_type=None, edge_type=None) -> dict` | `data/knowledge/graph.json` (106 nodes / 283 edges) |
| `get_tinai_context` | `(tinai: str) -> dict` | `data/knowledge/tinai_context.json` |
| `generate_image` | `(prompt: str, aspect_ratio: str) -> dict` | `ImageBackend` adapter (below) |

Local JSON first — the corpus ships inside the container image. Firestore-backed variants are a
future issue if data volume or freshness demands it.

**Image backend** (`SANGAM_IMAGE_BACKEND`): Gemma cannot generate pixels, so Paranar extracts
the tiṇai landscape, karu elements, mood, and time-of-day, composes a detailed prompt, and calls
`generate_image`:

- `gemini` (default): `google-genai` SDK — Imagen / Gemini image model, same `GEMINI_API_KEY`.
- `none` (dev): returns the crafted prompt only.
- Documented alternative: any self-hosted OpenAI-compatible image endpoint (SDXL, FLUX, …).

Image bytes return as an A2A `FilePart` (data-URI in v1; Cloud Storage upload later).

---

## 5. A2UI strategy

LLM-written A2UI JSON is token-expensive and fragile with Gemma, so the swarm uses
**deterministic templating**: `a2ui_templates.py` converts structured tool outputs into fixed
A2UI component templates in code — the LLM never writes A2UI.

- **Verse card** — Tamil text (Noto Serif Tamil), urai/English layers, verse-id citation chip.
- **Scenario table** — Tholkappiyar's structured extraction rendered as labeled rows.
- **Image gallery** — Paranar's renders with the crafted prompt and AI-imagery label.

Delivery: A2UI parts attached via the A2A A2UI extension (declared in each AgentCard);
**plain markdown parts are always included as fallback** so the chat works even if the
renderer breaks or the extension is absent.

---

## 6. Frontend

- New route **`/avai`** (nav label "Ask the Sangam") — assembly chat surface; each reply is
  attributed to the responding poet with their Tamil name.
- `frontend/src/services/a2aClient.js` — thin hand-rolled A2A JSON-RPC client
  (`message/send`, `message/stream` SSE), mirroring the `geminiApi.js` pattern:
  base URL from `VITE_AGENT_URL`, **no API keys ever reach the browser** (the key lives only
  in the agent server, same trust model as the existing Cloud Functions).
- `<A2uiSurface>` React wrapper around the `@a2ui/lit` web component +
  `@a2ui/web_core` `MessageProcessor`; non-A2UI parts render as markdown bubbles.
- AI-generated badges reuse the existing `verified:false` indicator pattern.

---

## 7. Deployment

- **Cloud Run** service `sangam-avai` (fits the Firebase/Google stack): Dockerfile above,
  `GEMINI_API_KEY` via Secret Manager, `--allow-unauthenticated`, `min-instances=0`
  (cold start accepted and documented), CORS restricted to the Cloudflare Pages origin +
  localhost.
- Frontend gets `VITE_AGENT_URL` (mirrors `VITE_FUNCTIONS_URL` in the Pages deploy workflow).
- CI: `deploy-agent.yml` GitHub Actions workflow (build + `gcloud run deploy`), manual
  `workflow_dispatch` initially.
- Hardening (M3): rate limiting, optional Firebase App Check token header.

---

## 8. Data governance

Per [data-governance.md](./data-governance.md), which gains a new **§ Agent-generated
content** section:

- Recreated/reimagined poems and translations carry response metadata
  `{aiGenerated: true, verified: false}`, a mandatory in-prompt disclaimer line, and a visible
  UI badge. **Never written into `data/texts/`.**
- Extracted scenarios may optionally persist (follow-up issue) under
  `data/scenarios/<verse_id>.json` with `"verified": false`, entering the existing
  human-in-the-loop review protocol; `data/schema/scenario_schema.json` defines the shape.
- Q&A answers must cite verse ids (e.g. `purananooru_001`) so claims are checkable —
  enforced by instruction and the eval set.
- Generated images are labeled **"AI-recreated imagery — not a historical depiction."**

---

## 9. Roadmap — milestones & issues

New label **`agents`**; existing labels reused. Dependency spine:
**1 → (2,3) → 4 → (5,6,7) → 8 → 10 → 11 → 12**; 13 after 10; 9 and 14 trailing.

### Agents M1 — Foundations & ஔவையார் Q&A (due 2026-08-31)

1. **Scaffold `backend/agents` ADK package with Gemma model config** — layout, requirements,
   `.env.example`, Gemini/LiteLLM switching; hello-world agent under `adk web`.
2. **Corpus tools** — `corpus.py` loader/index + `get_verse`/`search_verses`/`list_poems`;
   pytest incl. Tamil-text queries and tiṇai filter.
3. **Knowledge-graph and tiṇai context tools** — `graph.py`, `tinai.py` + tests.
4. **ஔவையார் Avvaiyar Q&A agent with verse citations** — wired to tools 2–3; citation +
   contested-interpretation instructions; `evals/qa.evalset.json` (~10 cases) via `adk eval`.

### Agents M2 — The Poet Swarm (due 2026-09-30)

5. **தொல்காப்பியர் Tholkappiyar scenario-extraction agent** — `Scenario` Pydantic schema
   (speaker, addressee, tinai, uripporul, karu {flora, fauna, landscape}, dramaticSituation,
   evidenceLines) with `output_schema`; eval on 5 known verses.
6. **கபிலர் Kapilar poem-recreation agent** — Sangam-style recreation / modern reimagining /
   English poetic translation modes; tiṇai conventions via `get_tinai_context`; every output
   carries the AI-generated disclaimer + metadata.
7. **Image adapter + பரணர் Paranar imagery agent** — `ImageBackend` protocol (gemini / none /
   self-hosted docs); scene-extraction → prompt-crafting → `generate_image`; AI-imagery label.
8. **நக்கீரர் Nakkirar convener + swarm mesh** — peer-mesh transfer wiring, convener/critic
   instructions, routing eval set; decide mesh vs hub-and-spoke from eval results.
9. **Scenario persistence to `data/scenarios/`** *(stretch)* — `scenario_schema.json`, opt-in
   batch script, governance doc update.

### Agents M3 — A2A/A2UI Assembly & Deploy (due 2026-10-31)

10. **Expose all five poets via A2A** — five `to_a2a()` apps mounted at `/a2a/<poet>/` with
    CORS middleware; AgentCards validate; JSON-RPC curl + `a2a-sdk` client smoke test.
11. **Frontend `/avai` assembly chat (markdown fallback first)** — route, page,
    `a2aClient.js`, per-poet attribution, AI badges, `VITE_AGENT_URL`.
12. **A2UI rich responses** — `a2ui_templates.py` + `<A2uiSurface>` Lit renderer embed;
    graceful degradation to markdown; pin `@a2ui/*` versions.
13. **Cloud Run deployment + secrets + CI** — Dockerfile, Secret Manager, `deploy-agent.yml`,
    prod CORS, `VITE_AGENT_URL` in Pages config, prod smoke test.
14. **Docs, governance, hardening** — architecture.md agent section, api-contracts.md A2A
    endpoints, data-governance.md §agent content, rate limiting / optional App Check.

---

## 10. Testing & verification

| Phase | How |
|---|---|
| M1 | `pytest backend/agents/tests` (tools, no LLM); `adk web` manual REPL; `adk eval sangam_avai evals/qa.evalset.json` |
| M2 | Pydantic-validated scenario outputs; disclaimer-string assertions on recreation outputs; routing eval set (mesh reliability) |
| M3 | AgentCard + JSON-RPC curl; `a2a-sdk` Python client script; `npm run dev` against local uvicorn; prod smoke test post-deploy |

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **A2UI instability** (v0.9.1 / v1.0-RC, no official React renderer) | Ship markdown chat first (#11) before A2UI (#12); pin versions; fallback to custom React components over the same structured JSON |
| **Gemma tool-calling / agent-transfer reliability** (younger than Gemini's) | ≤3 tools per poet; deterministic A2UI templating; hub-and-spoke fallback flag; `SANGAM_AGENT_MODEL=gemini-2.5-flash` dev escape hatch to triage model- vs code-caused failures |
| **ADK API churn** (`to_a2a` surface, default-model changes) | Pin `google-adk` in requirements.txt; upgrade deliberately |
| **Abuse of an unauthenticated public endpoint** | CORS allow-list, Cloud Run rate limiting, optional Firebase App Check (issue #14) |
