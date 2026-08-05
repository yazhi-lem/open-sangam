# Sangam Avai (சங்க அவை) agent scaffold

M1 scaffold: a single root agent (நக்கீரர் / Nakkirar) wired to the corpus,
knowledge-graph, and tiṇai-context tools, running against **OpenRouter** by
default via LiteLLM. The full five-poet peer mesh and A2A exposure land in
later milestones — see `docs/agent-implementation-plan.md` at the repo root.

## Setup

```bash
cd agents/avai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set OPENROUTER_API_KEY (get one at https://openrouter.ai/keys)
```

## Run it — CLI, not just a browser

`adk run` is a genuine terminal REPL: it prints the agent's replies directly
to stdout and reads your input from stdin, no browser involved. ADK discovers
agents by package name from the **parent** of the agent directory, so run it
from `agents/` (one level up from `avai/`), passing the package name:

```bash
cd agents        # parent of avai/, NOT agents/avai
adk run avai
```

`adk web` is also available if you want the browser-based dev UI instead —
also run from `agents/`, then pick "avai" from the agent dropdown:

```bash
cd agents
adk web
```

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
pytest avai/tests
```

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

M1 scope: only `"workflow": "qa"` (the default) is wired to a real agent;
`search`, `reimagine`, `scenario`, and `imagery` validate but return `501`
until their poets land in M2.
