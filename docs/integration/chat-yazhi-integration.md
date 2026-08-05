# Integration guide: chat.yazhi.dev ↔ Avai `/avai/ask`

For the full contract and design rationale, see `docs/api/avai-ask-prd.md`
and `docs/api-contracts.md`. This doc is the practical "how do I call it"
guide for the chat.yazhi.dev integration.

## Status

**Not deployed anywhere yet.** This phase ships the endpoint
(`agents/avai/api/app.py`) runnable locally via `uvicorn`; there is no
staging or production URL, and **no authentication** — do not point real
chat.yazhi.dev traffic at a publicly reachable instance of this endpoint
until Phase 4 (auth + rate limiting, see the PRD's roadmap) lands.

## Running it locally for integration testing

```bash
cd agents/avai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: set OPENROUTER_API_KEY (https://openrouter.ai/keys)

cd ..   # back to agents/, uvicorn needs the avai package importable as a sibling
uvicorn avai.api.app:app --reload --port 8080
```

Health check: `curl http://localhost:8080/avai/health` → `{"status":"ok"}`.

## Basic call

```bash
curl -X POST http://localhost:8080/avai/ask \
  -H "Content-Type: application/json" \
  -d '{"message": "What tiṇai is kurunthokai_100 in?"}'
```

```json
{
  "session_id": "3f2a...uuid",
  "workflow": "qa",
  "poet": "avvaiyar",
  "response_text": "kurunthokai_100 is in the kurinji tiṇai...",
  "citations": [
    {"verse_id": "kurunthokai_100", "poem": "kurunthokai", "tinai": "kurinji", "poet": "..."}
  ],
  "metadata": {"model": "openrouter:google/gemini-2.5-flash", "elapsed_ms": 1180, "timestamp": "..."}
}
```

## Continuing a conversation

Echo the `session_id` from the previous response back on the next request —
omit it to start a new conversation:

```bash
curl -X POST http://localhost:8080/avai/ask \
  -H "Content-Type: application/json" \
  -d '{"message": "Who composed it?", "session_id": "3f2a...uuid"}'
```

Sessions are **in-memory and single-process** in this phase (see PRD §6) —
they don't survive a server restart and won't work if chat.yazhi.dev's
requests land on different instances behind a load balancer. Fine for local
integration testing; not fine for production until Phase 5.

## Example client (fetch)

```javascript
// mirrors the pattern in frontend/src/services/geminiApi.js
async function askAvai(message, sessionId) {
  const res = await fetch(`${AVAI_API_URL}/avai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!res.ok) {
    const { message: errMsg } = await res.json()
    throw new Error(errMsg)
  }
  return res.json()  // { session_id, response_text, citations, ... }
}
```

## Error handling

All errors return `{"message": "..."}` — same shape as the existing
`/translate` and `/analyze-word` Cloud Functions, so error-handling code can
be shared:

| Status | Meaning | What chat.yazhi.dev should do |
|---|---|---|
| 400 | Bad request (empty/missing `message`, etc.) | Fix the request; don't retry as-is |
| 501 | Requested a `workflow` that isn't wired yet (anything but `"qa"`) | Don't offer that workflow in the UI yet, or fall back to `"qa"` |
| 502 | Agent execution failed (LLM/network error) | Safe to retry once; surface a "couldn't reach Avai" message if it repeats |

## Workflows

Only `"workflow": "qa"` (the default — you can omit the field) does anything
right now. `search`, `reimagine`, `scenario`, and `imagery` are accepted by
the schema and return `501` with an explanation — they're reserved for the
M2 poet swarm (Kapilar, Tholkappiyar, Paranar). If chat.yazhi.dev wants to
build UI for those ahead of time, treat the `501` response as "coming soon"
rather than an error to alarm on.

## What's needed before production traffic

From the PRD's roadmap (§7) — flagging the two that block chat.yazhi.dev
specifically:

1. **Auth + rate limiting (Phase 4).** There is currently no way to
   authenticate chat.yazhi.dev's requests or prevent abuse. This is the
   hard blocker, not a nice-to-have.
2. **A real deployment target.** Phase 5 pairs Cloud Run deployment with
   session persistence (Redis) — needed once traffic isn't just one dev
   machine talking to itself.

Until then, treat this integration as **local/staging-only validation** of
the request/response contract, not a production dependency.
