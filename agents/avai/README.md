# Sangam Avai (சங்க அவை) agent scaffold

M1 scaffold: a single root agent (நக்கீரர் / Nakkirar) wired to the corpus,
knowledge-graph, and tiṇai-context tools, running against **OpenRouter** by
default via LiteLLM. The full five-poet peer mesh and A2A exposure land in
later milestones — see `docs/agent-implementation-plan.md` at the repo root.

This file is the canonical runbook for the agents; the root `README.md` links
here rather than duplicating it.

## Prerequisites

- **Python 3.10+** (`google-adk` requires it; 3.11 is what CI uses)
- An **OpenRouter API key** — https://openrouter.ai/keys
- No Google Cloud project, no `gcloud` login, and no `GEMINI_API_KEY` are
  needed for the default backend

## Setup

```bash
cd agents/avai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set OPENROUTER_API_KEY
```

`requirements.txt` pulls in `google-adk`, which puts the **`adk`** CLI on your
PATH — that is the binary every command below uses. Confirm with `adk --version`.

## Run it — CLI, not just a browser

`adk run` is a genuine terminal REPL: it prints the agent's replies directly
to stdout and reads your input from stdin, no browser involved. ADK discovers
agents by package name from the **parent** of the agent directory, so run it
from `agents/` (one level up from `avai/`), passing the package name:

```bash
cd agents        # parent of avai/, NOT agents/avai
adk run avai
```

Ask it something the tools can actually answer, e.g.
`Show me kurunthokai_100 and tell me its tiṇai.`

`adk web` is also available if you want the browser-based dev UI instead —
also run from `agents/`, then pick "avai" from the agent dropdown:

```bash
cd agents
adk web
```

## Environment variables

Read by `config.py`; set them in `agents/avai/.env`.

| Variable | Default | Purpose |
|---|---|---|
| `SANGAM_AGENT_BACKEND` | `openrouter` | `openrouter` or `gemini` |
| `OPENROUTER_API_KEY` | — | required for the openrouter backend |
| `SANGAM_AGENT_MODEL` | `google/gemini-2.5-flash` | any model id from openrouter.ai/models |
| `OPENROUTER_API_BASE` | `https://openrouter.ai/api/v1` | override for a proxy/gateway |
| `GEMINI_API_KEY` | — | required when `SANGAM_AGENT_BACKEND=gemini` |
| `AVAI_ALLOWED_ORIGINS` | `*` | REST API only: comma-separated CORS origins, e.g. `https://sangam.yazhi.dev` |
| `AVAI_RATE_LIMIT_PER_MINUTE` | `0` (off) | REST API only: `/avai/ask` calls per client per minute; over it returns `429` |
| `AVAI_DEBUG_ERRORS` | unset | REST API only: `1` puts the provider's error text in `502` responses (dev only) |

The embedding step (`backend/python/ai/vectorize.py`) uses the same
`OPENROUTER_API_KEY`, though it reads its own `.env`.

## Switching model backend

- **OpenRouter (default):** set `OPENROUTER_API_KEY`; `SANGAM_AGENT_MODEL`
  picks any OpenRouter-hosted model id (default `google/gemini-2.5-flash`,
  confirmed via a live run to tool-call correctly through OpenRouter).
  `google/gemma-3-27b-it` was tried first per the original plan but does
  **not** reliably tool-call over OpenRouter — it emits the call as literal
  `` ```tool_code `` text instead of invoking the tool — so it's documented
  here as a known-broken option rather than removed outright, in case a
  future OpenRouter/Gemma update fixes it.
- **Gemini direct:** set `SANGAM_AGENT_BACKEND=gemini` and `GEMINI_API_KEY`.
- **Self-hosted vLLM/TGI/llama.cpp:** set `SANGAM_AGENT_BACKEND=vllm`,
  `SANGAM_AGENT_MODEL`, and `SANGAM_MODEL_API_BASE` (any OpenAI-compatible
  endpoint). Use a model that reliably supports tool calling, and evaluate it
  against the gold set before making it the primary route.
- **Local Ollama:** set `SANGAM_AGENT_BACKEND=ollama`,
  `SANGAM_AGENT_MODEL=qwen2.5:3b`, and optionally
  `SANGAM_MODEL_API_BASE=http://127.0.0.1:11434`. This uses LiteLLM's native
  `ollama/` provider, which preserves real tool calls.

### Safety controls

- Input guard blocks obvious prompt-injection attempts (English, Tamil, and
  transliterated variants) before the model runs.
- Output guard redacts credential-like values and neutralizes executable
  markup before returning text.
- Set `AVAI_API_TOKEN` to require `Authorization: Bearer <token>` on
  `POST /avai/ask`. Health, readiness, capabilities, and metrics stay public.

## ஔவையார் Avvaiyar Q&A agent (M1 issue #4)

`poets/avvaiyar.py` is a dedicated Q&A agent (separate from the Nakkirar
root/hello-world agent) wired to all four corpus/graph/tiṇai tools, with
citation and contested-interpretation instructions. A lightweight live smoke
test (real API calls, not part of the no-LLM pytest suite) checks it actually
tool-calls and cites verse ids correctly:

```bash
cd agents
python -m avai.evals.qa_smoke
```

This is not yet a formal `adk eval` evalset (that needs ADK's structured
trajectory JSON format) — see `evals/qa_smoke.py`'s docstring.

## Tests

Tests import `avai.tools.*`, so run pytest from `agents/` (same parent
directory as above):

```bash
cd agents
pytest avai/tests -q
```

Fast gate — unit/integration tests plus deterministic agent, routing, tool,
citation, robustness-dataset, and safety checks. No model or API key needed:

```bash
./avai/scripts/test_avai.sh
```

Live gate — adds the real-model smoke test (needs a working provider key):

```bash
./avai/scripts/test_avai.sh --live
```

Equivalent direct command:

```bash
cd agents
python -m avai.evals.fast_eval
```

Fast evaluation covers:
- all five poet agents, expected tools, and peer handoffs
- workflow and intent routing
- corpus, graph, and tiṇai tools
- the 20-case citation/abstention gold set
- the 150-case robustness dataset integrity
- prompt-injection and output-redaction guards

Tool tests run against the real `data/texts` and `data/knowledge` corpus,
no LLM or API key required. `tests/test_api.py` covers the REST API the same
way — the agent Runner is monkeypatched, so it also needs no API key.

## REST API — `POST /avai/ask`

A FastAPI wrapper around the ஔவையார் (Avvaiyar) Q&A agent, built for the
chat.yazhi.dev integration. Full contract: `docs/api/avai-ask-prd.md` and
`docs/api-contracts.md`; integration guide: `docs/integration/chat-yazhi-integration.md`.

Run from `agents/` (same cwd convention as `adk run avai`):

```bash
cd agents
uvicorn avai.api.app:app --reload --port 8080
```

```bash
curl -X POST http://localhost:8080/avai/ask \
  -H "Content-Type: application/json" \
  -d '{"message": "What tiṇai is kurunthokai_100?"}'
```

### Durable sessions & distributed rate limiting

Sessions use ADK's in-memory service by default. Set `AVAI_DATABASE_URL` to a
SQLAlchemy URL to switch to `DatabaseSessionService` (Postgres in production):

```env
AVAI_DATABASE_URL=postgresql+psycopg://avai:password@/avai?host=/cloudsql/PROJECT:asia-south1:avai
```

Set `AVAI_REDIS_URL` to share rate limits across Cloud Run instances:

```env
AVAI_REDIS_URL=redis://10.0.0.3:6379/0
```

Without Redis the limiter falls back to a per-instance window. `/avai/capabilities`
reports the actual session and rate-limit backends, including whether Redis
is configured.

### Production health & capability discovery

| Endpoint | Purpose |
|---|---|
| `GET /avai/health` | Legacy liveness contract: exactly `{"status":"ok"}` |
| `GET /avai/health/live` | Process liveness: service, build version, uptime |
| `GET /avai/health/ready` | Corpus + knowledge graph + tiṇai + model config; `503` when critical dependencies fail |
| `GET /avai/capabilities` | Five poets, Tamil names, workflows, tools, handoffs, corpus/graph counts, features (never secrets) |
| `GET /avai/metrics` | Counters/histograms: HTTP latency, routes, model tokens, USD/INR cost, citations, abstentions |

Cloud Run uses `/avai/health/live` as its startup and liveness probe. The
deploy workflow sets `AVAI_STRICT_READINESS=1`, so a missing or invalid
`OPENROUTER_API_KEY` fails `/avai/health/ready` instead of silently serving
broken traffic. Away from production the same endpoint reports `degraded`
(HTTP 200) without a key, keeping the no-LLM test suite runnable.

```bash
curl -s http://localhost:8080/avai/health/ready | python -m json.tool
curl -s http://localhost:8080/avai/capabilities | python -m json.tool
curl -s http://localhost:8080/avai/metrics | python -m json.tool
```

Every `/avai/ask` response now carries `metadata.token_in`, `token_out`,
`cost_usd`, and `cost_inr`. Logs are JSON by default; set `AVAI_LOG_JSON=0`
to disable, and `AVAI_USD_INR_RATE` to keep INR attribution aligned with FX.

The `/avai` frontend calls `/avai/capabilities` on load and shows a live
“நேரலை • 5 புலவர்கள்” badge when the deployed swarm is reachable.

M1 scope: only `"workflow": "qa"` (the default) is wired to a real agent;
`search`, `reimagine`, `scenario`, and `imagery` validate but return `501`
until their poets land in M2.

### Deploying the API (Cloud Run)

`agents/avai/Dockerfile` builds the API from the **repository root** (it needs
`data/texts` and `data/knowledge`):

```bash
docker build -f agents/avai/Dockerfile -t avai-api .
docker run -p 8080:8080 -e OPENROUTER_API_KEY=... avai-api
```

`.github/workflows/deploy-avai.yml` runs the tests, builds the image, and
deploys it to Cloud Run on every push to `main` that touches `agents/avai/` or
the corpus. The setup it needs (GCP secrets, the `openrouter-api-key` Secret
Manager entry, the Artifact Registry repo) is listed at the top of the
workflow. It skips cleanly until `GCP_SA_KEY` and `GCP_PROJECT_ID` are set.
After the first deploy, copy the service URL into the `VITE_AVAI_API_URL`
repository secret so the Cloudflare Pages build calls it.

## Troubleshooting

**`No root_agent found for 'avai'` / `adk: command not found`**
You are in the wrong directory or outside the venv. `adk` resolves agents by
package name from the **current** directory, so it must run from `agents/`,
not `agents/avai/` and not the repo root. Re-activate the venv
(`source agents/avai/.venv/bin/activate`) if the binary is missing.

**`OPENROUTER_API_KEY` appears unset even though `.env` exists**
The key file must be `agents/avai/.env` specifically. `config.py` anchors
`load_dotenv()` to its own directory precisely so that running from `agents/`
still finds it — a `.env` placed in `agents/` or at the repo root is *not*
picked up.

**The agent prints ` ```tool_code ` instead of calling a tool**
The model you selected does not support real function calling over OpenRouter.
Known case: `google/gemma-3-27b-it`. Set
`SANGAM_AGENT_MODEL=google/gemini-2.5-flash`.

**`ModuleNotFoundError: No module named 'avai'` when running pytest**
Run pytest from `agents/`, not from `agents/avai/`.
