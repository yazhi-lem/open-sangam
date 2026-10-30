# Architecture

How Open Sangam runs in production today (27 Oct 2026).

```
Browser ──HTTPS──► Cloudflare Pages (sangam.yazhi.dev)
                     static React build + bundled corpus JSON
                     │
                     └── /avai (behind VITE_ENABLE_AVAI + VITE_AVAI_API_URL)
                              │  POST /avai/ask
                              ▼
                     Cloud Run: avai-api (FastAPI + Google ADK)
                       five poet agents · corpus / graph / tiṇai tools
                       citation validator · rate limit · telemetry
                              │
                              ▼
                     model backend (LiteLLM: OpenRouter · Gemini · Ollama · vLLM)

Firebase Cloud Functions: /translate, /analyze-word (locked down; the reader does not call them)
Firestore: rules exist, but no data (the reader ships static JSON)
```

## Frontend (`frontend/`)

React 19 + Vite + Tailwind v4, routed client-side. Verse text, urai, English and glossary entries come from
bundled JSON (`data/texts/`), so the reader needs no backend. Maduraikanchi lines 1–100 load first and the rest on
first interaction. Fonts are self-hosted Noto Serif Tamil (verse) and Noto Sans Tamil (UI), and Tamil text is never
letter-spaced. Security headers live in `frontend/public/_headers`; the CSP is report-only for now.

## Data (`data/`, `backend/python/`)

`scrape_poem` → `raw/` → `normalize_all` → `normalized/*.json` + `datapackage.json` → `validate_corpus` (schema v2 and
known line gaps, run in CI) → `build_graph` (`data/knowledge/graph.json`) → `vectorize` (local Chroma index plus a
`.jsonl` export). No later run may erase a field that an earlier run produced
([`pipeline-scripts.md`](data/pipeline-scripts.md)).

## Avai (`agents/avai/`)

ADK agents: Nakkirar (convener), Avvaiyar (Q&A), Kapilar (recreation), Tholkappiyar (scenario) and Paranar
(imagery), wired as a peer mesh. Pulavar answers carry claim-level citations, which a deterministic validator checks
before anything is returned. The rule is **"the model proposes; Python decides"**
([`pulavar-verifiable-citations.md`](avai/pulavar-verifiable-citations.md)). Health, readiness and capabilities endpoints,
plus deploy steps, are in [`avai-launch-runbook.md`](avai/avai-launch-runbook.md). Contracts are in
[`api-contracts.md`](api/api-contracts.md).

## Decisions still open

- Model host for the public beta, under the Yazhi sovereign-by-default policy (`factory/CURRENT.md` D4).
- Whether to retire the Firebase Functions (`factory/CURRENT.md` D5) and the dead Firestore reader path.
- Post-launch hardening: Postgres for sessions and artifacts, a model gateway, pgvector retrieval
  (`archives/2026-10-27-docs-digest.md` §4).
