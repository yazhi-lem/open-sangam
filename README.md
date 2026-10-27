# Project Open Sangam

> An interactive educational platform bridging ancient Classical Tamil literature and modern readers.

Plan and status live in [`factory/`](./factory): [`CURRENT`](./factory/CURRENT.md) · [`NEXT`](./factory/NEXT.md) · [`RUNWAY`](./factory/RUNWAY.md). Retired docs are summarised in [`archives/`](./archives).

Open Sangam turns static web archives of Sangam-era poetry into a layered learning experience with linguistic,
cultural and historical context. Think "Duolingo for ancient literature".

## Features

- **Layered view.** Sangam Tamil · modern Tamil prose (*urai*) · English, one layer at a time. Unreviewed text is
  labelled as a draft.
- **Click-to-define glossary.** Root, grammatical class (*urichol*) and etymology, read from the corpus only.
- **Sangam World.** A tiṇai landscape navigator (Kuṟiñci · Mullai · Marutam · Neytal · Pālai).
- **Knowledge.** An encyclopedia of the Sangam age, plus a connections graph mined from the verses.
- **சங்க அவை Sangam Avai.** An agent assembly that answers with cited verses and abstains when it has no source.
  Hidden behind a build flag until the public beta.
- **Articles.** Long-form essays in `content/articles/`, published as HTML and RSS.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind v4, deployed as static files to **Cloudflare Pages** (`sangam.yazhi.dev`) |
| Corpus | Static JSON in `data/texts/`, validated against verse schema v2 in CI |
| Data pipeline | Python: scrape → normalize → validate → knowledge graph → vectors |
| Agents | Google ADK + LiteLLM (OpenRouter, Gemini, Ollama or vLLM), served by FastAPI on Cloud Run |
| Functions | Firebase Cloud Functions (`/translate`, `/analyze-word`), locked down |

## Structure

```
open-sangam/
├── frontend/        React app
├── agents/avai/     சங்க அவை: ADK agents, REST API, evals
├── backend/
│   ├── python/      scraper, normalizer, validator, vectorizer
│   └── functions/   Firebase Cloud Functions
├── data/            schema, poem texts, knowledge graph
├── content/         articles
├── docs/            architecture, contracts, governance, runbooks
├── factory/         CURRENT · NEXT · RUNWAY
└── archives/        dated doc snapshots
```

## Getting started

```bash
# Frontend
cd frontend && npm install && npm run dev

# Data pipeline (no API key needed)
cd backend/python
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m scraper.scrape_poem --poem all          # resumable
.venv/bin/python -m normalizer.normalize_all --poem all     # OKF datapackage
.venv/bin/python -m normalizer.validate_corpus              # schema v2 + known line gaps
.venv/bin/python -m pytest tests

# Verse embeddings + semantic search (own venv; chromadb never goes into agents/.venv)
.venv/bin/python -m ai.vectorize --status

# Agents: run adk from agents/, not agents/avai/
cd agents/avai && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env && cd .. && adk run avai     # or: adk web; pytest avai/tests

# Functions
cd backend/functions && npm install && firebase emulators:start
```

Full agent runbook: [`agents/avai/README.md`](./agents/avai/README.md). Pipeline rules: re-running a script never
destroys a field another script produced ([`docs/data/pipeline-scripts.md`](./docs/data/pipeline-scripts.md)).

## Corpus status

| | Count | Notes |
|---|---:|---|
| Poems | 18 | Eight Anthologies + Ten Idylls: scraped, normalized, in the Library |
| Verse records | 2,489 | Verse → Line → Word |
| Modern Tamil prose (urai) | 99% | from the source; reuse terms being confirmed |
| English | 32 records | all machine drafts, `verified: false` |
| Scholar-verified | 0 | the Q4 launch scope is Maduraikanchi lines 1–100 |
| Lines missing in the source | 1,225 in 93 sections | `data/schema/known_line_gaps.json`; CI fails if this changes unannounced |

Every AI-generated field stays `verified: false` until a scholar reviews it
([`docs/data/data-governance.md`](./docs/data/data-governance.md)).

## Docs

| Area | Doc |
|---|---|
| Architecture & contracts | [`docs/architecture.md`](./docs/architecture.md) · [`docs/api/api-contracts.md`](./docs/api/api-contracts.md) · [`docs/api/avai-ask-prd.md`](./docs/api/avai-ask-prd.md) |
| Avai | [`docs/avai/pulavar-verifiable-citations.md`](./docs/avai/pulavar-verifiable-citations.md) · [`docs/avai/avai-launch-runbook.md`](./docs/avai/avai-launch-runbook.md) · [`agents/avai/evals/TAXONOMY.md`](./agents/avai/evals/TAXONOMY.md) |
| Data | [`docs/data/pipeline-scripts.md`](./docs/data/pipeline-scripts.md) · [`docs/data/data-collection-plan.md`](./docs/data/data-collection-plan.md) · [`docs/data/data-governance.md`](./docs/data/data-governance.md) · [`docs/data/editorial-style-guide.md`](./docs/data/editorial-style-guide.md) |
| Outreach | [`docs/brochures/`](./docs/brochures) · [`content/articles/`](./content/articles) |

## License

[LICENSE](./LICENSE). Content is licensed under CC BY-SA where applicable.
