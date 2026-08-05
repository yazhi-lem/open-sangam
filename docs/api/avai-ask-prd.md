# PRD: `POST /avai/ask` — Avai Agent REST API

**Status:** Phase 1 implemented (this document describes both what is shipped
and what is planned) · **Owner:** Avai agent workstream · **Consumers:**
chat.yazhi.dev (primary), future first-party `/avai` frontend route

Related docs: `docs/agent-implementation-plan.md` (the agent swarm's M1–M3
roadmap — this PRD's REST endpoint is additive to that plan, not a
replacement for the A2A exposure it defines for M3), `docs/api-contracts.md`
(endpoint contract, alongside the existing Cloud Functions),
`docs/integration/chat-yazhi-integration.md` (integration guide),
`agents/avai/README.md` (setup and local run instructions).

---

## 1. Problem statement

The Avai agent swarm (`agents/avai/`) only runs locally today, via
`adk run avai` (terminal REPL) or `adk web` (browser dev UI). Neither is
callable from another service. chat.yazhi.dev needs a stable HTTP contract
to ask the ஔவையார் (Avvaiyar) Q&A agent questions about Sangam literature and
get back cited, checkable answers — without embedding Python/ADK or an
OpenRouter key in chat.yazhi.dev itself.

## 2. Goals (this phase)

- A single REST endpoint, `POST /avai/ask`, that runs the Avvaiyar Q&A agent
  and returns its answer plus verse citations.
- A request/response contract stable enough for chat.yazhi.dev to build
  against now, even though only one workflow (`qa`) is wired to a real agent.
- Multi-turn conversations via a `session_id` the caller can echo back.
- Consistent error shapes with the existing Cloud Functions API
  (`{"message": "..."}`, see `docs/api-contracts.md`), so callers already
  integrated with `/translate` and `/analyze-word` don't need a second error
  convention.
- No new production secrets exposed to chat.yazhi.dev — the OpenRouter/Gemini
  key stays server-side, same trust model as the existing
  `GEMINI_API_KEY` Cloud Functions secret.

## 3. Non-goals (this phase)

Deferred to later phases (tracked below, not in this implementation):

- WebSocket / streaming responses (token-by-token).
- Authentication / rate limiting (see §7 — this is the biggest gap before
  any production traffic from chat.yazhi.dev).
- Persistent (cross-restart, multi-instance) session storage — sessions are
  in-process and lost on redeploy.
- The `search`, `reimagine`, `scenario`, and `imagery` workflows — these map
  to Kapilar, Tholkappiyar, and Paranar, which don't exist until M2
  (`docs/agent-implementation-plan.md` §9). The API accepts these workflow
  values today and returns `501` so chat.yazhi.dev can code against the full
  contract ahead of time, but calling them does nothing yet.
- Cloud Run deployment — this phase is local-only (`uvicorn` on a dev
  machine); M3 of the agent plan already specifies the target Cloud Run
  service (`sangam-avai`) this would deploy behind.

## 4. Users & use cases

**chat.yazhi.dev** — a chat surface that wants to answer user questions about
Sangam poetry by delegating to Avai instead of reimplementing corpus search
and citation logic. Primary flow: user asks a question → chat.yazhi.dev
calls `/avai/ask` → renders `response_text` with `citations` as
linkable/checkable references.

## 5. API contract

Implemented in `agents/avai/api/app.py` (FastAPI), schemas in
`agents/avai/api/schemas.py`. Full request/response shapes, including field
constraints, are in `docs/api-contracts.md`; summarized here:

```
POST /avai/ask
{
  "message": "What tiṇai is kurunthokai_100?",   // required, 1-2000 chars
  "workflow": "qa",                               // optional, default "qa"
  "session_id": "sess-abc",                        // optional — omit to start a new session
  "user_id": "chat-yazhi-user-42",                 // optional — defaults to "anonymous"
  "context": { "tinai": null, "poem": null, "limit": 10 }  // optional hints, see §5.3
}

200 →
{
  "session_id": "sess-abc",
  "workflow": "qa",
  "poet": "avvaiyar",
  "response_text": "kurunthokai_100 is in the kurinji tiṇai...",
  "citations": [
    { "verse_id": "kurunthokai_100", "poem": "kurunthokai", "tinai": "kurinji", "poet": "..." }
  ],
  "metadata": { "model": "openrouter:google/gemini-2.5-flash", "elapsed_ms": 1180, "timestamp": "2026-08-05T10:30:00+00:00" }
}
```

### 5.1 Error shapes

| Status | When | Body |
|---|---|---|
| 400 | Missing/empty `message`, or any request schema violation | `{"message": "`message` invalid: ..."}` |
| 501 | `workflow` other than `"qa"` | `{"message": "<why this workflow isn't wired yet>"}` |
| 502 | The agent Runner raised (LLM/network/tool error) | `{"message": "Agent execution failed"}` |

502 deliberately doesn't leak the underlying exception to callers — see
`agents/avai/api/app.py`'s exception handler. Server-side logs carry the
real error.

### 5.2 Citations are re-derived, not trusted verbatim

Avvaiyar is instructed to cite verse ids inline (`prompts.py`'s
`CITATION_RULE`), but the API doesn't trust that formatting directly — it
scans the response text for verse-id-shaped tokens (`<poem>_<number>`) and
looks each one up via `tools/corpus.get_verse`, keeping only ones that
actually resolve. A hallucinated id is silently dropped from `citations`
rather than returned as if it were real. `response_text` itself is
unmodified either way.

### 5.3 `context` is a hint, not a filter

`context.tinai`/`context.poem`/`context.limit` are appended to the message
sent to the agent as a hint line (e.g. `[Context hints: tiṇai=kurinji]`) —
Avvaiyar decides whether and how to use them via its own tool calls. This
phase does not enforce them server-side (e.g. force `search_verses(tinai=...)`
directly) — that would require bypassing the agent's own reasoning, which
isn't the goal of `context`.

## 6. Session model (current: in-memory, single-process)

- Conversation history lives in ADK's `InMemorySessionService` in the current
  process (`agents/avai/api/app.py`); `agents/avai/api/sessions.py` only
  tracks *which* session ids exist and when they were last touched.
- Omit `session_id` to start a new conversation — the response returns the
  generated id for the caller to reuse on the next turn.
- Idle sessions expire after `AVAI_SESSION_TTL_SECONDS` (default 3600s,
  see `.env.example`); pruning runs opportunistically on each `/avai/ask`
  call, not on a background timer.
- **Known limitation:** a process restart (deploy, crash, autoscale-to-zero)
  drops all sessions. Acceptable for this phase's local/dev-only scope;
  must be addressed (Redis or similar) before any multi-instance or
  Cloud Run `min-instances=0` deployment — see §7 Phase 5.

## 7. Roadmap (not yet built)

Phased so chat.yazhi.dev can integrate against §5 now and each phase adds
capability without breaking the contract:

| Phase | Scope |
|---|---|
| **1 (this PRD, done)** | `POST /avai/ask`, `qa` workflow only, in-memory sessions, no auth |
| 2 | WebSocket streaming (`WS /avai/ask/stream`) for token-by-token responses |
| 3 | Intent classification — Nakkirar routes to the right M2 poet instead of every request going straight to Avvaiyar; unblocks `search`/`reimagine`/`scenario`/`imagery` as M2 poets land |
| 4 | Authentication (bearer token) + rate limiting — **required before any real chat.yazhi.dev traffic**, not optional hardening |
| 5 | Session persistence beyond a single process (Redis), Cloud Run deployment per `docs/agent-implementation-plan.md` §7 |

## 8. Testing & verification

- `agents/avai/tests/test_api.py` — schema validation, error shapes, citation
  extraction (including the hallucination-drop case), session id reuse, and
  the 501/502 paths. The agent Runner is monkeypatched, so this suite needs
  no API key, consistent with the rest of `avai/tests`.
- Manually verified end-to-end against a live `uvicorn` process: health
  check, missing-message 400, unimplemented-workflow 501, and a real `qa`
  call without an `OPENROUTER_API_KEY` configured (confirms the 502 path
  fails gracefully rather than crashing the server).
- Not yet covered: a live LLM smoke test through the API (the equivalent of
  `evals/qa_smoke.py`, but via HTTP) — worth adding once this deploys
  somewhere with a real key configured (Phase 5).

## 9. Open questions

- Should `user_id` require chat.yazhi.dev-side auth once Phase 4 lands, or
  stay caller-supplied/optional for anonymous chat sessions?
- Does chat.yazhi.dev need the `context` hints at all, or would it rather
  just send raw user text and let Nakkirar/Avvaiyar infer everything itself?
- Session TTL default (1 hour) — does chat.yazhi.dev's own session model want
  a different value, and should it be caller-configurable per request?
