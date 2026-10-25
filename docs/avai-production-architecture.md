# Avai Production Architecture — Model Hosting, Durable Data, and Telemetry

**Status:** proposal · **Owner:** Avai workstream · **Target:** post-Nov-14 hardening
**Scope:** `agents/avai/` backend, model serving, persistence, observability.

---

## 1. Executive decision

Yes, Avai can host its own model and run on a real database. But the correct
order is:

1. **Instrument first** — no architecture change is safe without traces,
   metrics, and cost attribution.
2. **Move state out of process** — Postgres for durable sessions/artifacts,
   Redis for hot state and distributed rate limits.
3. **Put every model behind a gateway** — OpenRouter, Vertex AI Gemini, and
   self-hosted vLLM become interchangeable providers.
4. **Add pgvector retrieval** — replace import-time JSON scans with indexed
   hybrid retrieval.
5. **Self-host only when unit economics, latency, or data residency justify
   it** — not before.

For the Nov 14 demo, keep the managed model path. For the next phase, target
**Vertex AI Gemini in Mumbai** for production reliability, with a self-hosted
open-weight model as an evaluated fallback. A 24/7 GPU is usually more
expensive than low-volume API traffic.

---

## 2. Current architecture (baseline)

```
Cloudflare Pages (React)
        │  POST /avai/ask
        ▼
Cloud Run: avai-api (FastAPI)
        │
        ├── ADK Runner + 5 LlmAgents (peer mesh)
        ├── InMemorySessionService        ← lost on restart
        ├── tools/*.py                    ← JSON loaded at import
        ├── artifacts.jsonl               ← ephemeral per instance
        ├── interaction_graph.json        ← ephemeral per instance
        ├── in-process rate limiter       ← per instance only
        └── LiteLLM → OpenRouter → Gemini 2.5 Flash
```

Known production gaps:

| Gap | Consequence |
|---|---|
| Sessions in memory | Conversations break on deploy/scale-to-zero |
| JSONL artifacts on ephemeral disk | Telemetry and training data lost per revision |
| In-process rate limit | Bypassable across instances |
| `BackgroundTasks` persistence | Work lost when instance exits |
| JSON corpus in memory | Fine at 2.6k verses, poor at scale |
| Single model route | Provider outage = Avai outage |
| No end-to-end traces | Cannot debug latency/cost/citation failures |
| Prompt/artifact PII controls absent | Compliance risk |

---

## 3. Target architecture

```
                         ┌──────────────────────────────┐
                         │ Cloudflare Pages / Edge      │
                         └──────────────┬───────────────┘
                                        │ HTTPS
                         ┌──────────────▼───────────────┐
                         │ Cloud Run: avai-api (API)    │
                         │ auth · routing · validation  │
                         └──────┬───────────┬───────────┘
                                │           │
              ┌─────────────────▼──┐   ┌────▼─────────────────┐
              │ Redis              │   │ Postgres + pgvector  │
              │ sessions hot state │   │ durable system of    │
              │ rate limits        │   │ record, retrieval    │
              │ idempotency locks  │   │ evals, registry      │
              └────────────────────┘   └────┬─────────────────┘
                                            │
              ┌─────────────────────────────▼─────────────────┐
              │ Cloud Tasks / Pub/Sub                         │
              │ artifact persistence · evals · exports        │
              └─────────────────────┬─────────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────────┐
              │ Worker (Cloud Run jobs / GKE)                  │
              │ ingest · embeddings · nightly evals · exports  │
              └─────────────────────┬─────────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────────┐
              │ Model Gateway                                  │
              │ circuit breaker · retries · budget · fallback  │
              ├──────────────┬───────────────┬─────────────────┤
              │ Vertex AI    │ OpenRouter    │ vLLM (optional) │
              │ Gemini       │ eval/dev      │ self-hosted     │
              └──────────────┴───────────────┴─────────────────┘

Telemetry path:
FastAPI + ADK + DB + Model Gateway
        │ OpenTelemetry
        ▼
Collector → Cloud Trace / Cloud Monitoring / Cloud Logging
        ├── BigQuery (analytics, cost, eval joins)
        └── Langfuse or Phoenix (prompt traces, datasets)
```

### Design principles

- **Stateless API, durable state.** Any API instance can serve any session.
- **One model interface.** No business logic imports OpenRouter or vLLM.
- **Every answer is replayable.** Store model id, prompt version, tool calls,
  retrieval snapshot (or hashes), validator version, and token counts.
- **Metadata in Postgres, blobs in GCS.** Do not put large prompts/responses
  in the relational row.
- **Telemetry by default.** No new endpoint ships without a trace and metrics.
- **India-first residency.** Cloud SQL/Redis/GCS/BigQuery in `asia-south1`
  (Mumbai) where possible.

---

## 4. Data model

Postgres is the system of record. Suggested schema:

```sql
-- Durable conversation state (ADK state serialized as JSONB)
sessions (
  id uuid primary key,
  user_id_hash text not null,
  status text not null default 'active',
  state jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

messages (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  role text not null,
  content_ref text,              -- GCS URI or inline small text
  content_hash text,
  token_count int,
  created_at timestamptz not null default now()
);

agent_runs (
  id uuid primary key,
  session_id uuid references sessions(id),
  trace_id text not null,
  workflow text not null,
  pulavar text not null,
  model_id text not null,
  prompt_version text not null,
  status text not null,          -- ok | abstained | error | rate_limited
  latency_ms int,
  token_in int,
  token_out int,
  cost_usd numeric(12,6),
  error_code text,
  created_at timestamptz not null default now()
);

citations (
  id uuid primary key,
  run_id uuid not null references agent_runs(id),
  source_id text not null,
  quote_hash text,
  is_valid boolean not null,
  validator_version text not null
);

artifacts (
  id uuid primary key,
  run_id uuid references agent_runs(id),
  kind text not null,            -- response | image | scenario | eval
  gcs_uri text not null,
  content_hash text not null,
  quality_score numeric(4,3),
  created_at timestamptz not null default now()
);

retrieval_chunks (
  id uuid primary key,
  source_id text not null,
  chunk_text text not null,
  tsv tsvector generated always as (to_tsvector('simple', chunk_text)) stored,
  embedding vector(768),
  metadata jsonb not null default '{}'
);

model_registry (
  id text primary key,           -- e.g. vertex-gemini-2.5-flash
  provider text not null,        -- vertex | openrouter | vllm
  model_name text not null,
  endpoint text,
  capabilities jsonb not null,   -- tool_call, vision, context_window
  enabled boolean not null default true
);

prompt_versions (
  id text primary key,           -- e.g. avvaiyar@2026-11-01
  agent text not null,
  template text not null,
  created_at timestamptz not null default now()
);

outbox_events (
  id uuid primary key,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  published_at timestamptz
);
```

Redis holds only ephemeral state: session hot cache, rate-limit counters,
idempotency keys, and short-lived locks. Postgres remains authoritative.

**Which database?**

| Need | Choice |
|---|---|
| System of record | Cloud SQL Postgres 16, Mumbai, HA |
| Vector + keyword retrieval | pgvector + `tsvector` in the same Postgres |
| Hot session/rate-limit state | Memorystore Redis |
| Blobs/traces/artifacts | GCS with lifecycle policy |
| Analytics/cost/eval joins | BigQuery external tables over GCS |

Avoid adding a separate vector database initially. At Avai’s corpus size,
pgvector is operationally simpler and cheaper. Revisit only beyond ~10M
chunks.

---

## 5. Model hosting decision

### Can you host the model?

Yes. The practical options:

| Option | Fit | Notes |
|---|---|---|
| **Vertex AI Gemini, Mumbai** | ⭐ production default | Managed, SLA, India region, VPC-SC, no GPU ops |
| OpenRouter | dev/eval fallback | Flexible, but extra hop and less enterprise control |
| **vLLM on GKE/E2E GPU** | cost/sovereignty at volume | Full control, requires GPU SRE |
| Ollama on a VM | prototype only | Not multi-tenant production |
| Adhan nano/tiny | future Tamil SLM | Not yet tool-call-proven |

### Self-hosting candidate shortlist

Evaluate, do not assume:

- Qwen2.5-7B/14B Instruct — strong tool calling, multilingual.
- Gemma 3 12B/27B — good quality; verify tool-call parser reliability.
- Llama 3.1/3.3 Instruct — broad ecosystem support.
- Sarvam/Krutrim hosted APIs — Indian providers; verify tool calling and
  data terms.

**Model gateway contract:**

```python
class ModelProvider(Protocol):
    name: str
    async def generate(
        self,
        *,
        messages: list[Message],
        tools: list[ToolSpec],
        temperature: float,
        max_tokens: int,
        timeout_s: float,
    ) -> ModelResult: ...
```

Gateway responsibilities:

- Provider selection from `model_registry`.
- Per-request token/cost budget.
- Retries with jitter only for idempotent calls.
- Circuit breaker per provider/model.
- Fallback chain: Vertex → OpenRouter → self-hosted.
- Record `model_id`, `prompt_version`, token counts, latency, and cost on
  every `agent_runs` row.
- Never expose provider keys to the agent or frontend.

### Cost reality

A 24/7 L4/A10-class GPU with 7B–14B model is typically **$300–$800/month**
before operations. Low-volume Avai traffic through a managed API is usually
far cheaper. Self-host when:

- sustained token volume makes API spend exceed GPU + SRE cost,
- data residency forbids a third-party inference path,
- or latency requires an in-VPC model.

Run both in shadow mode and compare cost per successful answer before cutting
over.

---

## 6. Telemetry and observability

### OpenTelemetry tracing

Instrument FastAPI, ADK Runner, tool calls, DB, Redis, and model calls with
one trace per request:

```
POST /avai/ask                       [root span]
├── avai.route.classify
├── avai.session.load
├── adk.runner.run
│   ├── agent.turn (pulavar)
│   ├── tool.get_verse
│   ├── tool.retrieve_passages
│   └── model.generate
├── avai.citations.validate
└── avai.artifact.persist (async)
```

Required span attributes:

```text
avai.session_id_hash
avai.user_id_hash
avai.workflow
avai.pulavar
avai.model_id
avai.prompt_version
avai.token_in / avai.token_out
avai.cost_usd
avai.citation_count
avai.citation_valid_count
avai.abstained
avai.retrieval_hit_count
http.status_code
error.type
```

Never put raw user text, full prompts, citations' full text, or API keys in
span attributes or logs by default. Raw content goes to the artifact store
under access control, referenced by hash/URI.

### Metrics

| Metric | Type | Purpose |
|---|---|---|
| `avai_requests_total` | counter | RPS by workflow/pulavar/status |
| `avai_request_duration_ms` | histogram | p50/p95/p99 latency |
| `avai_model_duration_ms` | histogram | provider latency |
| `avai_model_tokens_total` | counter | input/output tokens |
| `avai_model_cost_usd_total` | counter | spend attribution |
| `avai_tool_duration_ms` | histogram | corpus/graph/retrieval latency |
| `avai_citation_invalid_total` | counter | hallucination pressure |
| `avai_abstentions_total` | counter | refusal rate by reason |
| `avai_rate_limited_total` | counter | abuse/capacity |
| `avai_db_pool_in_use` | gauge | connection pressure |
| `avai_gpu_utilization` | gauge | only if self-hosted |

### SLOs

| SLO | Target | Alert |
|---|---|---|
| Availability | 99.5% monthly | 2% error budget burn in 1h |
| p95 `/avai/ask` | < 8s | 10m above threshold |
| p99 | < 20s | 10m above threshold |
| Citation validity | > 98% | drop below 97% for 1h |
| Provider error rate | < 1% | circuit-breaker open |
| Cost per successful answer | budget-defined | daily anomaly alert |

### Logging and audit

- Structured JSON logs with `trace_id`, `span_id`, `service.version`,
  `model_id`, `prompt_version`.
- Redact PII, API keys, and raw prompts by default.
- Audit table for admin actions and prompt/model changes.
- BigQuery export for eval joins and cost dashboards.
- Langfuse/Phoenix for prompt traces, dataset curation, and human review.

### Eval loop

- Every production run contributes a candidate eval example — never
  automatically a gold label.
- Nightly evals: routing accuracy, citation validity, abstention correctness,
  Tamil fluency, latency, cost.
- Gate model/prompt changes on eval deltas plus a canary at 5% traffic.
- Keep `pulavar_gold_set.py` and `robustness_v0.jsonl` as versioned datasets
  with model/prompt metadata.

---

## 7. Application-layer refactor

Current `agents/avai/api/app.py` owns routing, sessions, execution, citation
validation, persistence, and HTTP concerns. Split it:

```
agents/avai/
├── api/
│   ├── app.py                 # composition root only
│   ├── routes/ask.py
│   ├── routes/health.py
│   ├── routes/capabilities.py
│   └── middleware/telemetry.py
├── application/
│   ├── ask_service.py         # orchestration
│   ├── routing_service.py
│   └── citation_service.py
├── domain/
│   ├── models.py
│   └── ports.py               # SessionRepo, ArtifactRepo, ModelProvider
├── infrastructure/
│   ├── postgres/              # SQLAlchemy + migrations
│   ├── redis/                 # sessions, rate limits, locks
│   ├── gcs/                   # artifacts
│   ├── model_gateway/         # vertex, openrouter, vllm
│   └── telemetry/             # OTel setup
└── tools/                     # keep pure functions
```

Rules:

- Routes do HTTP only; services own orchestration.
- Tools stay deterministic and unit-testable.
- Every external dependency sits behind a port/interface.
- Migrations are versioned (Alembic), never ad-hoc schema changes.
- Artifact writes go through an outbox, not `BackgroundTasks`.

---

## 8. Migration plan

### Phase 0 — Instrument (1 week)
- Add OTel tracing/metrics/logging to API, ADK, model calls.
- Add `agent_runs` and cost attribution.
- Dashboards + alerts for latency/errors/tokens.
- No behavior change.

### Phase 1 — Durable state (1–2 weeks)
- Postgres sessions/messages; Redis hot cache and rate limit.
- Move artifacts from JSONL to GCS + `artifacts` table via outbox.
- Add PgBouncer/Cloud SQL connector; load-test connection pool.
- Exit criterion: deploy/scale-to-zero preserves conversations.

### Phase 2 — Model gateway (1–2 weeks)
- Implement `ModelProvider`; wrap current LiteLLM path.
- Add Vertex AI Gemini Mumbai provider and failover.
- Add token/cost budget per request and per session.
- Shadow-evaluate Vertex vs OpenRouter on gold set.
- Exit criterion: provider outage fails over without API contract change.

### Phase 3 — Retrieval (2 weeks)
- Ingest normalized corpus into Postgres + pgvector.
- Hybrid BM25 + vector retrieval with citation-aware chunking.
- Keep JSON corpus as immutable source; DB is a derived index.
- Exit criterion: retrieval quality ≥ current, p95 tool latency improves.

### Phase 4 — Async workers and eval (2 weeks)
- Cloud Tasks/Pub/Sub for artifacts, embeddings, nightly evals.
- Canary releases and automated eval gates.
- Exit criterion: no lost artifacts; eval report per release.

### Phase 5 — Optional self-hosting (2–4 weeks, evidence-gated)
- vLLM on GKE or E2E GPU behind the gateway.
- Benchmark tool-call reliability, Tamil quality, p95, cost.
- Run as fallback/shadow first; only promote if metrics justify it.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| ADK/LiteLLM API churn | Pin versions; isolate behind gateway; contract tests |
| Tool-call unreliability on self-hosted models | Eval gate; keep managed fallback; deterministic tool routing |
| Cost runaway | Per-request/session token budgets, rate limits, daily alerts |
| PII in traces/logs | Hash ids; redact content; artifact-store access controls |
| DB connection exhaustion | PgBouncer/Cloud SQL connector; pool sizing; load test |
| Cold starts with scale-to-zero | Min instances only during demo windows; cpu-boost |
| Self-host GPU idle cost | Scale-to-zero GPU pools or keep API path |
| Data residency | Mumbai regions; document subprocessors; VPC-SC |
| Migration downtime | Expand/contract schema; dual-write then cut over |

---

## 10. What not to do

- Do not put a vector database, Kafka, and Kubernetes in the critical path
  before Postgres and telemetry exist.
- Do not self-host a model because it sounds sovereign; benchmark first.
- Do not log full prompts/responses to Cloud Logging.
- Do not keep JSONL as the system of record.
- Do not let the agent choose its own model or bypass the gateway.
- Do not add provider-specific code to `tools/` or `poets/`.

---

## 11. Immediate next PRs

1. `feat(avai): OpenTelemetry traces and structured request logs`
2. `feat(avai): Postgres session repository + Alembic migrations`
3. `feat(avai): Redis distributed rate limiter and idempotency keys`
4. `feat(avai): ModelGateway with Vertex AI and OpenRouter providers`
5. `feat(avai): pgvector hybrid retrieval behind existing tools`
6. `feat(avai): outbox worker for artifacts and eval exports`
7. `ops(avai): dashboards, SLO alerts, and cost budget`
