# Sangam Poet-Swarm Agent System — Implementation Plan

**Status:** M1 scaffolding in progress (`agents/avai/`) · **Tracking label:** `agents` ·
**Milestones:** Agents M1–M3

> **2026-07-22 revision:** default model backend switched from hosted Gemini/Gemma to
> **OpenRouter** (§2, §3); package path moved from `backend/agents/sangam_avai/` to
> **`agents/avai/`** (top-level, flat package — no backend/ nesting); §12 "Gaps found in
> review" and §13 "M1 scaffold — what exists now" added below.

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

Built on **Google ADK** (Python) with a model served through **OpenRouter** as the default
reasoning backend, exposed via the **A2A protocol**, with rich responses rendered through
**A2UI** in the existing React frontend.

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

- **Model default — OpenRouter via LiteLLM:** `LiteLlm(model="openrouter/<model-id>",
  api_base="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)`. LiteLLM's
  `openrouter/` provider prefix routes tool-calling and structured-output requests through
  OpenRouter's OpenAI-compatible endpoint. Default model id is `google/gemma-3-27b-it`
  (matches OpenRouter's catalog naming, no `models/` prefix). Model id is an env var
  (`SANGAM_AGENT_MODEL`) so swapping to any other OpenRouter-hosted model — including
  non-Gemma models if Gemma's tool-calling proves unreliable — is a config change, not a
  code change. A direct-Gemini backend (`SANGAM_AGENT_BACKEND=gemini` +
  `GEMINI_API_KEY`) remains as a documented alternative for users who already hold a
  Gemini key and want to bypass OpenRouter. Verified end-to-end in the M1 scaffold with a
  real `OPENROUTER_API_KEY`: `adk run` reaches OpenRouter and gets back real model replies —
  **but the plan's originally-named model, `google/gemma-3-27b-it`, does not reliably
  tool-call over OpenRouter** (it emits the call as literal `` ```tool_code `` text instead
  of invoking the tool); the default was changed to `google/gemini-2.5-flash`, confirmed
  live to tool-call correctly on the same route. See §13.
- **google-adk (Python):** `pip install "google-adk[a2a]"` (pinned to `1.18.0` in
  `agents/avai/requirements.txt`). Core: `google.adk.agents.LlmAgent`,
  `google.adk.models.lite_llm.LiteLlm` (used for the OpenRouter default),
  `google.adk.models.Gemini` (direct-Gemini alternative).
- **A2A exposure:** `from google.adk.a2a.utils.agent_to_a2a import to_a2a` →
  Starlette/ASGI app served with uvicorn; auto-generated AgentCard at
  `/.well-known/agent-card.json`. Consuming side available via
  `google.adk.agents.remote_a2a_agent.RemoteA2aAgent`.
- **A2UI:** v0.9.1 is current; v1.0 is a release candidate — **spec still evolving**. Web
  renderer is Lit-based: npm `@a2ui/lit` (Card, Row, Column, List, Tabs, Image, Text, Button,
  Modal, Divider) + `@a2ui/web_core` (`MessageProcessor`). A2UI rides on A2A as a protocol
  extension declared in the AgentCard. No official React renderer yet, but React 19 supports
  custom elements natively, so the Lit component embeds directly.

Sources: [ADK models overview](https://google.github.io/adk-docs/agents/models/) ·
[ADK A2A exposing quickstart](https://github.com/google/adk-docs/blob/main/docs/a2a/quickstart-exposing.md) ·
[google/A2UI](https://github.com/google/A2UI) · [A2UI quickstart](https://a2ui.org/quickstart/) ·
[@a2ui/lit](https://www.npmjs.com/package/@a2ui/lit) ·
[adk-python releases](https://github.com/google/adk-python/releases) ·
[LiteLLM ADK tutorial](https://docs.litellm.ai/docs/tutorials/google_adk) ·
[OpenRouter models](https://openrouter.ai/models) ·
[LiteLLM OpenRouter provider docs](https://docs.litellm.ai/docs/providers/openrouter)

---

## 3. Package layout

Lives at the repo root as **`agents/avai/`** — a peer of `frontend/`, `backend/`, `data/`,
not nested under `backend/`. `agents/` is the parent from which the ADK CLI resolves the
`avai` package by name (`adk run avai`, `adk web` + pick "avai").

```
agents/
└── avai/
    ├── README.md               # setup, adk run/web (CLI vs browser), OpenRouter model switch
    ├── requirements.txt        # google-adk[a2a] (pinned), litellm, python-dotenv, pytest
    ├── .env.example            # OPENROUTER_API_KEY, SANGAM_AGENT_MODEL, SANGAM_AGENT_BACKEND,
    │                           # OPENROUTER_API_BASE, GEMINI_API_KEY (alt), SANGAM_IMAGE_BACKEND,
    │                           # ALLOWED_ORIGINS
    ├── Dockerfile              # python:3.12-slim; copies data/texts + data/knowledge  (M3)
    ├── __init__.py             # from . import agent   (adk CLI convention)
    ├── agent.py                # root_agent export for adk run/web — M1: Nakkirar only
    ├── swarm.py                # peer-mesh wiring + mounted A2A apps (Starlette routes)  (M2/M3)
    ├── config.py               # model/backend selection from env (OpenRouter default)
    ├── prompts.py               # poet personas, tiṇai conventions, governance disclaimers
    ├── schemas.py               # Pydantic: Scenario, ImagePromptSpec  (M2)
    ├── a2ui_templates.py        # deterministic tool-output → A2UI JSON formatters  (M3)
    ├── poets/
    │   └── nakkirar.py  avvaiyar.py  kapilar.py  tholkappiyar.py  paranar.py   (M2)
    ├── tools/
    │   ├── corpus.py            # load + index data/texts/**/normalized/*.json at import time
    │   ├── graph.py             # query data/knowledge/graph.json
    │   ├── tinai.py             # data/knowledge/tinai_context.json lookup
    │   └── image_gen.py         # ImageBackend adapter + generate_image tool  (M2)
    ├── tests/                   # pytest for tools (no LLM needed)
    └── evals/                   # adk eval sets: qa.evalset.json, routing.evalset.json  (M1/M2)
```

Coexists with `backend/python/` untouched — that remains the offline scrape/normalize/translate
pipeline; `agents/avai/` is the online agent service, deployed separately (§7).

**Model config** (`config.py`) — OpenRouter is the default, not an alternative:

```python
def get_model():
    backend = os.getenv("SANGAM_AGENT_BACKEND", "openrouter")
    if backend == "gemini":
        from google.adk.models import Gemini
        return Gemini(model=os.getenv("SANGAM_AGENT_MODEL", "gemini-2.5-flash"))
    # default: openrouter
    return LiteLlm(
        model=f"openrouter/{os.getenv('SANGAM_AGENT_MODEL', 'google/gemma-3-27b-it')}",
        api_base=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1"),
        api_key=os.getenv("OPENROUTER_API_KEY"),   # getenv, not environ[...] — see §12
    )
```

**Local dev — CLI first:** from `agents/` (the parent of `avai/`):

```bash
adk run avai     # interactive terminal REPL — real CLI, no browser, verified in §13
adk web          # optional browser dev UI, same directory
```

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

- `none` (**scaffold default** — `.env.example` ships this): returns the crafted prompt only,
  no key required. Keeps the M1/M2 scaffold runnable with only `OPENROUTER_API_KEY` set.
- `gemini` (opt-in, production target for M2 issue 7): `google-genai` SDK — Imagen / Gemini
  image model, needs its own `GEMINI_API_KEY` — **independent of the OpenRouter
  reasoning-model key**, since OpenRouter's image-generation model support is inconsistent
  across providers and not worth routing through for this one feature.
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
  `OPENROUTER_API_KEY` via Secret Manager (plus `GEMINI_API_KEY` only if
  `SANGAM_IMAGE_BACKEND=gemini` is enabled), `--allow-unauthenticated`, `min-instances=0`
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

1. **Scaffold `agents/avai` ADK package with OpenRouter model config** *(done —
   see §13)* — layout, requirements, `.env.example`, OpenRouter/Gemini switching;
   hello-world agent (Nakkirar) verified under `adk run`.
2. **Corpus tools** *(done — see §13)* — `corpus.py` loader/index +
   `get_verse`/`search_verses`/`list_poems`; pytest incl. Tamil-text queries and tiṇai filter.
3. **Knowledge-graph and tiṇai context tools** *(done — see §13)* — `graph.py`, `tinai.py` + tests.
4. **ஔவையார் Avvaiyar Q&A agent with verse citations** *(scaffolded and live-tested — see
   §13; not yet a formal `adk eval` evalset)* — `poets/avvaiyar.py`, a dedicated Q&A agent
   separate from the Nakkirar root agent, with citation + contested-interpretation
   instructions; `evals/qa_smoke.py` runs 3 live cases against the real Runner API (2/3
   passed on first run — see §13 for the failure). A formal `evals/qa.evalset.json` +
   `adk eval` run (ADK's structured trajectory format) is the remaining refinement.

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
| M1 | `pytest agents/avai/tests` (tools, no LLM, run from `agents/` — done, 12 pass); `adk run avai` interactive terminal REPL (done — see §13); `adk eval avai evals/qa.evalset.json` (needs a real key, not yet run) |
| M2 | Pydantic-validated scenario outputs; disclaimer-string assertions on recreation outputs; routing eval set (mesh reliability) |
| M3 | AgentCard + JSON-RPC curl; `a2a-sdk` Python client script; `npm run dev` against local uvicorn; prod smoke test post-deploy |

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **A2UI instability** (v0.9.1 / v1.0-RC, no official React renderer) | Ship markdown chat first (#11) before A2UI (#12); pin versions; fallback to custom React components over the same structured JSON |
| **Gemma tool-calling / agent-transfer reliability, now specifically via OpenRouter** (a third hop — OpenRouter → underlying provider — adds its own translation-layer risk on top of Gemma's younger tool-calling) | ≤3 tools per poet; deterministic A2UI templating; hub-and-spoke fallback flag; `SANGAM_AGENT_MODEL=google/gemini-2.5-flash` (still via OpenRouter) or `SANGAM_AGENT_BACKEND=gemini` dev escape hatch to triage model- vs OpenRouter- vs code-caused failures |
| **OpenRouter as a single point of failure / cost surface** for every poet (unlike direct-vendor billing) | Model id is a env var, not hardcoded, so a provider swap is a config change; document the direct-Gemini fallback path (§2, §3) as a working escape hatch, not just a hypothetical |
| **ADK API churn** (`to_a2a` surface, default-model changes) | Pin `google-adk` (`1.18.0`) and `litellm` (`1.78.5`) in `requirements.txt` (verified installable together, §13); upgrade deliberately |
| **Abuse of an unauthenticated public endpoint** | CORS allow-list, Cloud Run rate limiting, optional Firebase App Check (issue #14) |
| **Data hygiene in `data/texts/**/normalized/`** — a stray non-verse file (`ainkurunooru/normalized/datapackage.json`) sits alongside verse JSON and has no `id` field | `corpus.py`'s loader now skips any file lacking an `id` key instead of crashing at import (§12); worth a follow-up data-pipeline fix so `normalized/` only ever contains verse files |

---

## 12. Gaps found in review (2026-07-22)

Found while scaffolding M1 issues #1–#3 against the real data and a real ADK install —
not hypothetical, each one hit a concrete failure before being fixed:

1. **Original plan assumed hosted Gemini/Gemma as the default backend; the actual
   requirement is OpenRouter.** Addressed by making `LiteLlm` + OpenRouter the default in
   `config.py` (§2, §3), with direct-Gemini demoted to an explicit opt-in
   (`SANGAM_AGENT_BACKEND=gemini`). This also changes the risk profile (§11): OpenRouter
   adds a routing hop on top of Gemma's already-younger tool-calling support.
2. **The plan never distinguished `adk run` (terminal CLI) from `adk web` (browser dev UI)**
   — both were referred to loosely as "adk web (dev UI)". Since a CLI-first workflow was a
   specific requirement, §3 and the scaffold README now lead with `adk run`, and §13 records
   an actual smoke test proving it's a real terminal REPL that reaches the network, not a
   browser tool.
3. **`agents/avai/__init__.py` does `from . import agent` (the required ADK CLI
   discovery convention), which eagerly constructed the model — including calling
   `os.environ["OPENROUTER_API_KEY"]` — the instant *anything* under the package was
   imported.** This broke the plan's own stated goal of tool tests needing "no LLM" (§10):
   `pytest agents/avai/tests` failed at collection with `KeyError: 'OPENROUTER_API_KEY'`
   before a single test ran, because importing `avai.tools.corpus` still runs
   `avai/__init__.py` first. Fixed by reading the key with `os.getenv` (returns `None`)
   instead of `os.environ[...]` (raises) — `LiteLlm` only needs a real key once a call is
   actually made, so construction stays side-effect-free and only fails, correctly, when the
   agent is actually run without a key.
4. **`data/texts/ainkurunooru/normalized/datapackage.json` is not a verse file** (it's
   dataset metadata, no `id` field) but sits inside a `normalized/` directory the corpus
   loader globs indiscriminately. Crashed the same test collection with `KeyError: 'id'`.
   Fixed defensively in `corpus.py` (skip any file without an `id`); flagged in §11 as a
   data-pipeline issue worth fixing at the source separately.
5. **The knowledge graph has a 6th tiṇai node, `tinai:unknown` ("Unclassified", weight 822),
   alongside the 5 classical tiṇai** the plan's tiṇai-context/graph descriptions implicitly
   assumed were exhaustive (§4's `get_tinai_context` docstring lists exactly five). Tools and
   tests now account for it explicitly (`query_knowledge_graph(node_type="tinai")` returns 6,
   not 5) rather than silently mismatching real data.
6. **Path/package location was unspecified beyond `backend/agents/sangam_avai/`** — this
   review relocates the whole scaffold to top-level `agents/avai/` (confirmed with the user
   directly, not inferred), which changes every path reference throughout this doc, the
   Dockerfile's build context (M3, not yet written), and the eventual `deploy-agent.yml`
   working directory (M3, not yet written).
7. **No CLI verification without a real API key was previously possible per the plan as
   written** — `evals/qa.evalset.json` and `adk eval` (issue #4) both require a live model
   call. A real `OPENROUTER_API_KEY` was obtained mid-review and used for actual live
   verification (§13), which is how gaps #8 and the Gemma tool-calling finding (§2) were
   caught — neither would have surfaced from static review.
8. **`config.py` called `load_dotenv()` with no path**, which searches upward from the
   *current working directory*, not from the package's own location. Worked by luck when
   invoked from inside `agents/avai/`, but silently loaded no `.env` at all — and so no
   `OPENROUTER_API_KEY` — when run as `python -m avai.evals.qa_smoke` or `pytest` from
   `agents/` (the directory this doc's own §3 instructs as the correct working directory for
   `adk run`/`pytest`). Manifested as `litellm.AuthenticationError: "No cookie auth
   credentials found"` even with a real, valid key sitting in `agents/avai/.env`. Fixed by
   anchoring `load_dotenv(Path(__file__).resolve().parent / ".env")` to the package
   directory, independent of invocation cwd.

## 13. M1 scaffold — what exists now and what was verified

Scaffolded and committed to disk at `agents/avai/` (issues #1–#3 substantially, #4 not yet
split out of the root agent):

- `config.py`, `prompts.py`, `agent.py` — single root agent (`nakkirar`), OpenRouter-default
  model selection, wired to all three corpus/graph/tiṇai tools (no separate poet personas
  yet — that's M2 issue #8's peer mesh).
- `tools/corpus.py`, `tools/graph.py`, `tools/tinai.py` — real implementations against the
  actual `data/texts/**/normalized/*.json` (2,032-verse corpus, minus the one stray metadata
  file, §12) and `data/knowledge/{graph,tinai_context}.json`.
- `tests/test_corpus.py`, `tests/test_graph.py`, `tests/test_tinai.py` — 12 pytest cases
  against the real data, **verified passing**: `pytest agents/avai/tests` → `12 passed`, run
  from a real venv (`agents/avai/.venv`) with the pinned `requirements.txt` installed
  (`google-adk[a2a]==1.18.0`, `litellm==1.78.5`).
- `requirements.txt`, `.env.example`, `README.md` — OpenRouter-first setup instructions,
  including the `adk run` vs `adk web` distinction (§12 point 2).

**CLI verification actually performed** (not claimed from documentation):

```
$ adk --help            # confirms `run` = "Runs an interactive CLI for a certain agent"
                         #           `web` = "Starts a FastAPI server with Web UI for agents"
$ OPENROUTER_API_KEY=sk-test-invalid-key-for-cli-smoke-test \
  printf "hello\n" | adk run avai
```

This reached `litellm.main.acompletion` → a real HTTPS call to OpenRouter → and failed with
`litellm.exceptions.AuthenticationError: OpenrouterException - {"error":{"message":"Missing
Authentication header","code":401}}` — i.e. everything up to OpenRouter's own auth check
works over the terminal, with no browser involved at any point.

**Follow-up live verification, with a real `OPENROUTER_API_KEY`:**

```
$ adk run avai   # SANGAM_AGENT_MODEL=google/gemma-3-27b-it (the plan's original default)
[nakkirar]: ```tool_code
[get_verse(verse_id='kurunthokai_100')]
```
```

Gemma printed the tool call as text instead of invoking it — a real, reproducible failure,
not a hypothetical risk. Switching to `google/gemini-2.5-flash` (still via the same
OpenRouter/LiteLLM route, no code change) fixed it immediately:

```
$ adk run avai   # SANGAM_AGENT_MODEL=google/gemini-2.5-flash
[nakkirar]: The tiṇai of kurunthokai_100 is kurinji.
```

That reply is correct and grounded (`kurunthokai_100`'s `tinai` field is `"kurinji"`,
confirmed against the raw data in §13's test fixtures) — this is a genuine tool-call → tool
result → grounded answer round trip through OpenRouter, not a guess. `gemini-2.5-flash`
became the new default (§2, §3, `.env.example`) on the strength of this result.

**M1 issue #4 (Avvaiyar Q&A agent), also live-tested**, via `python -m avai.evals.qa_smoke`
(a lightweight Runner-based smoke test — see `evals/qa_smoke.py`), 3 cases:

| Case | Run 1 | Run 2 (after prompt fix) |
|---|---|---|
| "What tiṇai is kurunthokai_100 in?" | **PASS** — "kurinji", cited the verse id | **PASS** |
| "Who composed kurunthokai_100, and what verse id is that?" | **FAIL** — refused to treat `kurunthokai_100` as a valid verse id ("appears to be a poem and a verse number, not a verse ID") instead of calling `get_verse("kurunthokai_100")` directly | **FAIL (different failure)** — response truncated to "Kur" |
| "How many poems are in the corpus, and name one with more than 100 verses?" | **PASS** — correct count and example via `list_poems` | **PASS** |

2/3 both times, but a *different* case failed each run with the identical prompt and code —
real LLM stochasticity, not a fixable bug in this pass. Run 1's failure was addressed by
adding an explicit verse-id-format clause to `AVVAIYAR_INSTRUCTION` ("verse ids follow
`<poem>_<number>` — that IS the id, call `get_verse` directly"); a follow-up run then passed
that exact case but failed a different one with a truncated response. **Conclusion:** a
single 3-case smoke run is not a reliable pass/fail signal for this model — M1 issue #4's
follow-up (a formal `adk eval` evalset, ~10 cases, ideally with `temperature=0` and/or
multiple repeats per case) needs to account for this variance rather than treat one clean
run as "done."
