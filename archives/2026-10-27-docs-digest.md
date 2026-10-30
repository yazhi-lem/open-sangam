# Open Sangam docs digest, 27 Oct 2026

A snapshot of this repo's documentation on 27 Oct 2026: what Open Sangam is, a map of the docs that remain, where they
disagree, and compressed copies of the 6 docs retired that day. It is never edited after that date. Live state is in
[`../factory/`](../factory).

## 1. Open Sangam in brief

A layered reader for classical Tamil (18 poems, 2,489 records, urai 99%, English on 32 records, 0 scholar-verified)
plus Avai/Pulavar, a cited-answer assembly ("the model proposes; Python decides"). Q4 commitments: Maduraikanchi
1–100, scholar-signed, on 14 Nov; the Avai beta on 21 Nov at ≥ 90% citation accuracy.

## 2. Doc map (what remains, by theme)

| Theme | Docs |
|---|---|
| **Start here** | `README.md` · `factory/` (live plan) · `docs/architecture.md` (rewritten 27 Oct to match production) |
| **Avai** | `agents/avai/README.md` (runbook) · `docs/avai/pulavar-verifiable-citations.md` (answer schema + validator) · `docs/api/avai-ask-prd.md` · `docs/api/api-contracts.md` · `docs/avai/avai-launch-runbook.md` · `agents/avai/evals/TAXONOMY.md` |
| **Data** | `docs/data/pipeline-scripts.md` (the never-destroy rule) · `docs/data/data-collection-plan.md` (metadata + knowledge entities) · `docs/data/data-governance.md` · `docs/data/editorial-style-guide.md` · `data/texts/maduraikanchi/README.md` |
| **Brand & outreach** | `frontend/README.md` · `frontend/src/assets/brand/README.md` · `docs/brochures/README.md` · `content/articles/` (19 essays) |

## 3. Where docs disagree

| # | Finding | Fix |
|---|---|---|
| D1 | **Source gap in the launch scope** (resolved). `maduraikanchi_006` (62–74) printed 8 of 13 lines; the rest were filled from Project Madurai | `factory/CURRENT.md` D1 |
| D2 | Urai reuse terms with the source site are unconfirmed, yet urai is a launch layer | `factory/NEXT.md` R3 |
| D3 | Avai launch date: runbook 14 Nov vs plan 21 Nov | `factory/NEXT.md` A1 |
| D4 | ≥ 9 backlog items are still open for work already merged | `factory/NEXT.md` H2 |
| D5 | Two changes pull opposite ways on the Gemini functions (locked down vs removed) | `factory/CURRENT.md` D5 |

## 4. Compressed copies of retired docs

**Plans, superseded by `factory/`**

- **`NEXT_ACTION.md` (Q4 plan, 8 Oct).**
  - *Reader* (federal Mozhi, shared with Illakiya), launch 14 Nov. Milestones: 9 Oct scrape (782 lines) · 11 Oct
    schema in CI · 18 Oct recruit the scholar · 25 Oct urai draft · 1 Nov English + glosses · 5 Nov layered toggle ·
    8 Nov sign-off + correction log + credits · 10 Nov glossary + Tamil typography · 14 Nov launch · 5 Dec
    suggest-an-edit · 31 Dec lines 101–300.
  - *Avai* (federal Avai), beta 21 Nov. Milestones: 11 Oct answer format · 15 Oct retrieval · 16 Oct reflection check ·
    18 Oct chat UI on yazhi.dev · 31 Oct gold set + 150 red-team prompts · 5 Nov ≥ 90% · 8 Nov native review of 100 ·
    12 Nov 50 testers · 14 Nov feedback button · 21 Nov beta · 30 Nov 350 prompts reviewed · 31 Dec 500+ on
    HuggingFace.
  - *Deferred to 2027:* audio, quizzes, other poems, the 3D world, the graph, the PWA.
- **`docs/ROADMAP.md` (4 Aug).**
  - *Vision:* "Duolingo for ancient literature". Every verse in three layers, everything cross-linked, and an AI
    assembly that always labels machine text. Critical path: **corpus data → knowledge graph → reader + agents**.
  - *Proposed for later:* tests + CI for frontend/functions/pipeline; resolve the storage split (adopt static JSON);
    full-text + semantic search; a spaced-repetition Learn mode; a PWA; languages beyond English; a public
    dataset/API; WCAG + audio at scale; scholar tooling.
  - *Sequencing:* data first; graph before entities; translation before verification; the storage decision gates any
    Firestore work.
- **`docs/PROJECT_TRACKER.md` (4 Aug).** Workstreams: corpus · reader · graph (~106 nodes / 283 edges) · agents
  (M1: 1 of 5 poets) · infra. Schema gaps: no `english`, `verified` never true, colophon fields
  (poet/patron/turai/speaker) unparsed, many `tinai: "unknown"`, `audioUrl` null. Risks still true: scholar
  verification is the bottleneck; frontend and Functions have zero tests; the Firestore reader path is dead code;
  a single LLM smoke run is not a pass/fail signal.

**Agents, superseded by the shipped code, `api-contracts.md` and the launch runbook**

- **`docs/agent-implementation-plan.md`.**
  - *Assembly:* Nakkirar (convener/critic, routes and reviews), Avvaiyar (Q&A with verse ids), Kapilar
    (recreation, governance-labelled), Tholkappiyar (scenario extraction via a Pydantic schema), Paranar (scene →
    image prompt → pluggable `ImageBackend`). A peer mesh, not a hierarchy.
  - *Tools:* `get_verse`, `search_verses`, `list_poems`, `query_knowledge_graph`, `get_tinai_context`,
    `generate_image`.
  - *Milestones:* M1 scaffold + tools + Avvaiyar (done); M2 the other four poets (wired since); M3 A2A AgentCards,
    an `/avai` chat with a markdown fallback, A2UI rich responses, Cloud Run + secrets + CI, and hardening.
  - *Lessons from review:* OpenRouter rather than hosted Gemma (Gemma failed at tool calls); run `adk` from
    `agents/`; one `datapackage.json` is not a verse file; the graph has an extra "unknown" tiṇai node;
    `load_dotenv()` needs an explicit path.
- **`docs/avai-production-architecture.md` (post-launch proposal).**
  - *Order of work:* instrument (done: traces, metrics, INR cost) → state out of process (sessions/rate limits on
    Redis done; Postgres for artifacts next) → a model gateway with circuit breakers and a fallback chain →
    pgvector hybrid retrieval → async workers + an eval loop → self-host only when cost, latency or residency
    justify it.
  - *Hosting options:* Vertex AI Gemini in Mumbai (managed, India region) · OpenRouter (dev/eval) · vLLM on GPU (at
    volume) · Ollama (prototype only) · Adhan (future; not yet tool-call-proven). Shortlist: Qwen2.5 7B/14B,
    Gemma 3, Llama 3.x, Sarvam/Krutrim.
  - *SLOs:* 99.5% availability; p95 < 8 s, p99 < 20 s; citation validity > 98%; provider errors < 1%; a cost budget
    per answer.
  - *Don'ts:* no Kafka/K8s/vector DB before Postgres + telemetry; no self-hosting without a benchmark; no full prompts
    in logs; no JSONL as the system of record; agents never pick their own model.
- **`docs/integration/chat-yazhi-integration.md`.** chat.yazhi.dev calls `POST /avai/ask` with
  `{message, session_id?, workflow?, context{tinai, poem, limit}}` and gets `{session_id, workflow, poet,
  response_text, citations[], metadata}`. To continue a conversation, echo `session_id`. Errors use
  `{"message": …}`. The browser never holds the model key. Its "not deployed, no auth" status went stale once the
  Cloud Run deploy and rate limiting landed.
