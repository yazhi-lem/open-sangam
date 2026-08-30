# Project Open Sangam

> An interactive educational platform bridging ancient Classical Tamil literature and modern readers.

See [NEXT_ACTION.md](./NEXT_ACTION.md) for the roadmap, **October 2026 Pilot**, and **December 2026 Launch** deliverables.

Open Sangam transforms static, archaic web archives of Sangam-era poetry into a multi-layered learning experience — providing linguistic, cultural, and historical context. Think "Duolingo for Ancient Literature."

## Features

- **Layered View** — Toggle between Sangam Tamil, Modern Tamil prose (*Urai*), and English for every verse
- **Click-to-Define Glossary** — Click any word for root meaning, grammatical class (*Urichol*), and etymology
- **Sangam World** — Immersive Tiṇai landscape navigator (Kuṟiñci · Mullai · Marutam · Neytal · Pālai)
- **Knowledge Encyclopedia** — Illustrated guide to the Sangam age: anthologies, akam/puṟam, the tiṇai framework, poets, patron-kings, music, and daily life
- **Connections Graph** — The whole corpus interlinked as one navigable knowledge graph (tiṇai · poem · poet · karu-poruḷ), mined directly from the verses
- **Cultural Context Cards** — Pop-up explanations for historical references
- **Audio Recitation** — Recorded / synthesized verses for pronunciation and meter
- **AI Translation** — Gemini 2.5 Flash contemporary prose and English equivalents, drafted by a nightly batch pipeline
- **சங்க அவை Sangam Avai** — An agent assembly that answers questions about the corpus with cited verses
- **Community Contributions** — Scholar-reviewed translation edits (Phase 4)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend / Storage | Firebase / Firestore |
| Cloud Functions | Node.js (Firebase Functions) |
| Data Pipeline | Python + BeautifulSoup |
| AI Translation | Google Gemini 2.5 Flash via OpenRouter |
| Agents | Google ADK + LiteLLM (OpenRouter) |

## Project Structure

```
open-sangam/
├── frontend/        # React + Tailwind web app
├── backend/
│   ├── functions/   # Firebase Cloud Functions
│   └── python/      # Scraping, normalization & AI scripts
├── agents/
│   └── avai/        # சங்க அவை — Google ADK agent assembly
├── data/
│   ├── schema/      # JSON schema (Verse → Line → Word)
│   ├── texts/       # Processed poem data
│   └── pipeline/    # Translation run state & progress metadata
└── docs/            # Architecture, governance, style guide
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python Pipeline

```bash
cd backend/python
python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # then set OPENROUTER_API_KEY

# Scrape all 18 Sangam poems (resumes from where it left off)
.venv/bin/python -m scraper.scrape_poem --poem all

# Normalize to OKF datapackage (JSON schema + datapackage.json)
.venv/bin/python -m normalizer.normalize_all --poem all

# Run the pipeline's own tests (no API key needed)
.venv/bin/python -m pytest tests
```

#### English translation (Phase 2)

`ai/translate_with_gemini.py` drafts the `english` field of every verse with
**Gemini 2.5 Flash via OpenRouter** — the same model and gateway the agents
use. It is **phased**, **resumable**, and **tracked**: each run picks a bounded
batch from the current phase, writes `verified: false` drafts with an
`englishMeta` provenance block, and records the run in
`data/pipeline/translation-state.json`.

```bash
cd backend/python

# Coverage per poem + current phase. No API calls, no key needed.
.venv/bin/python -m ai.translate_with_gemini --status

# See exactly which verses the next run would take. Still no API calls.
.venv/bin/python -m ai.translate_with_gemini --lang english --limit 5 --dry-run

# Translate a batch (default 200 verses from the current phase)
.venv/bin/python -m ai.translate_with_gemini --lang english --limit 200

# Or target one poem, ignoring phase order
.venv/bin/python -m ai.translate_with_gemini --lang english --poem mullaippattu
```

| Flag | Meaning |
|---|---|
| `--status` | print per-poem coverage and the current phase, then exit |
| `--dry-run` | resolve the batch and list it; no API calls, no writes |
| `--limit N` | verses per run (default 200) |
| `--phase N` | force a phase instead of auto-advancing |
| `--poem <id>` | restrict to one poem, ignoring phases |
| `--force` | re-translate verses that already have English |
| `--concurrency N` | parallel requests (default 4) |
| `--write-state` | rebuild the state metadata from disk without translating |

`--lang` also accepts `urai` to draft the Modern Tamil prose field the same
way (currently 99% covered — a handful of stragglers). To run both languages
in one command, use the wrapper instead of remembering both invocations:

```bash
# Both languages, same flags forwarded to each pass (urai first, then english)
.venv/bin/python -m ai.translate_all --status
.venv/bin/python -m ai.translate_all --limit 200
.venv/bin/python -m ai.translate_all --only urai --limit 50   # just one language
```

**Phases** run smallest-first, so quality problems surface early. A run only
draws from the current phase, and the phase advances by itself once every poem
in it is fully drafted:

| Phase | Poems | Verses |
|---|---|---:|
| 1 | Ten Idylls (பத்துப்பாட்டு) | ~380 |
| 2 | Shorter anthologies — Paripāṭal, Patiṟṟuppattu, Kalittokai, Akanāṉūṟu | ~472 |
| 3 | Large anthologies — Puṟanāṉūṟu, Naṟṟiṇai, Kuṟuntokai, Aiṅkuṟunūṟu | ~1,700 |

**Scheduling.** `.github/workflows/translate-english.yml` runs the same command
nightly at 02:00 UTC and commits the results, so the corpus fills in
unattended. It needs the repository secret **`OPENROUTER_API_KEY`** — without
it the job logs a skip and exits cleanly. `workflow_dispatch` takes `limit`,
`poem`, `phase`, and `dry_run` inputs for a one-off run.

Every draft lands `verified: false` per
[docs/data-governance.md](./docs/data-governance.md) — AI output is not
authoritative until a scholar reviews it.

#### Word etymology (Click-to-Define Glossary)

`ai/extract_etymology.py` batch-fills the same feature the reader's
click-to-define glossary (`WordGlossary.jsx` / `geminiApi.js`) otherwise
fetches live, one word at a time: for every word in a verse it drafts a
`root` (வேர்ச்சொல்), `urichol` (உரிச்சொல்), a detailed Tamil `etymology`
(2-4 sentences — derivation, cognates, sandhi/morphology, semantic shift),
and a short English `gloss`. Pre-filling the corpus means most clicks resolve instantly
from disk; the live call still covers whatever hasn't been annotated yet.

```bash
cd backend/python

# Coverage per poem. No API calls, no key needed.
.venv/bin/python -m ai.extract_etymology --status

# See exactly which verses the next run would take. Still no API calls.
.venv/bin/python -m ai.extract_etymology --limit 5 --dry-run

# Annotate a batch (default 50 verses — each one returns a full JSON
# array of per-word annotations, so it's heavier than a translation call)
.venv/bin/python -m ai.extract_etymology --limit 50

# Or target one poem
.venv/bin/python -m ai.extract_etymology --poem mullaippattu
```

Unlike English/urai translation, a word's four fields can legitimately all
come back null (a bare grammatical particle has no root) — so completeness is
tracked per *verse*, via an `etymologyMeta` provenance block (mirrors
`englishMeta`), not by checking whether the word fields are non-null. State
lives in `data/pipeline/etymology-state.json`, independent of the translation
pipeline's own state file. There's no phase ladder here: unlike English
translation, one verse's word annotation doesn't depend on another poem's
quality, so poems are simply processed in the corpus's natural order.

Every draft also lands `verified: false`, same governance as translations.

#### Verse embeddings + semantic search

`ai/vectorize.py` embeds each verse (Tamil + urai + English combined) via
OpenRouter (`google/gemini-embedding-001`) into a local Chroma vector store,
and exports a downloadable `.jsonl` per poem. Needs its own venv — see
[docs/pipeline-scripts.md](./docs/pipeline-scripts.md) §3, since `chromadb`
must never land in `agents/.venv`.

```bash
cd backend/python
python -m venv .venv && .venv/bin/pip install -r requirements.txt   # separate from agents/.venv

.venv/bin/python -m ai.vectorize --status
.venv/bin/python -m ai.vectorize --poem thirumurugatrupadai
.venv/bin/python -m ai.vectorize --search "the young god of the mountains riding a peacock" --k 5
```

- **Vector DB:** `data/generated/vectors/` (gitignored — a rebuildable local
  index, not source data).
- **Downloadable export:** `data/knowledge/vectors/{poem_id}.jsonl`,
  committed like `graph.json` — one JSON line per verse (id, metadata,
  embedded text, 3072-dim vector), always rewritten fresh from the vector DB
  so it can't drift.

### Sangam Avai agents (சங்க அவை)

An agent assembly on Google ADK that answers questions about the corpus with
cited verses, backed by corpus / knowledge-graph / tiṇai tools.

```bash
cd agents/avai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set OPENROUTER_API_KEY

cd ..                  # → agents/ — ADK resolves agents from the PARENT dir
adk run avai           # terminal REPL
adk web                # browser dev UI; pick "avai" from the dropdown
pytest avai/tests      # 12 tests, no API key needed
```

> The single most common failure is running `adk` from `agents/avai/` instead
> of `agents/`. Full runbook, env-var table, and troubleshooting:
> **[agents/avai/README.md](./agents/avai/README.md)**.

### Firebase Functions

```bash
cd backend/functions
npm install
firebase emulators:start
```

## Phases

📊 **[Project Tracker](./docs/PROJECT_TRACKER.md)** — live status across every
workstream · 🗺️ **[Roadmap](./docs/ROADMAP.md)** — where the project is going.

See [docs/data-collection-plan.md](./docs/data-collection-plan.md) for the full
corpus + knowledge-entity roadmap, and
[docs/pipeline-scripts.md](./docs/pipeline-scripts.md) for how every
scrape/normalize/translate/etymology/graph script fits together and why
re-running one never destroys another's output.

| # | Phase | Status |
|---|-------|--------|
| 1 | Data scraping & normalization | ✅ Complete — 18 poems, 2,489 verses |
| 2 | AI English translation + human verification | 🔄 In progress — pipeline live, drafting nightly |
| 3 | Library of Sangam — MVP reader live | 🔄 In progress |
| 4 | Community contribution layer | ⬜ Pending |

---

## Corpus Status

> Pipeline: **Scrape** → **Normalize** → **Library** → **English** → **Verified**
>
> `█` done · `▒` partial · `░` pending

### எட்டுத்தொகை — Eight Anthologies

```
Poem                          Verses  Scrape    Normalize  Library   English   Verified
─────────────────────────────────────────────────────────────────────────────────────────
நற்றிணை      Natrinai           400   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
குறுந்தொகை   Kurunthokai        400   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
ஐங்குறுநூறு  Ainkurunooru       500   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
கலித்தொகை   Kalithokai         149   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
அகநானூறு    Akananooru         220   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பதிற்றுப்பத்து Pathitrupathu     80   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
புறநானூறு    Purananuru         400   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பரிபாடல்     Paripadal           23   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
```

### பத்துப்பாட்டு — Ten Idylls

```
Poem                              Sections  Scrape    Normalize  Library   English   Verified
──────────────────────────────────────────────────────────────────────────────────────────────
திருமுருகாற்றுப்படை Tirumurugam      32    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பொருநராற்றுப்படை   Porunaram         21    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
சிறுபாணாற்றுப்படை  Sirupanam         25    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பெரும்பாணாற்றுப்படை Perumapanam      41    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
மலைபடுகடாம்        Malaipadukadam    45    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
மதுரைக்காஞ்சி      Maduraikanchi     63    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
குறிஞ்சிப்பாட்டு   Kurinjipattu      25    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பட்டினப்பாலை       Pattinappalai     30    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
முல்லைப்பாட்டு     Mullaippattu      18    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
நெடுநல்வாடை        Nedunalvadai      17    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
```

### Overall Progress

```
Total poems          18  ████████████████  all scraped, normalized & in the Library
Total records     2,489  ████████████████  fully normalized (Verse → Line → Word)
Tamil prose (Urai) 2,469 ███████████████░  99% carry source prose
English translation     0 ░░░░░░░░░░░░░░░░  Phase 2 — pipeline live, drafting nightly
Scholar-verified        0 ░░░░░░░░░░░░░░░░  Phase 4 — not started
```

> Run `python -m ai.translate_with_gemini --status` from `backend/python/` for
> the live per-poem figures; the numbers above are a snapshot.

> **Readable in [சங்க நூலகம் — Library of Sangam](/frontend):** all 18 poems —
> நற்றிணை · குறுந்தொகை · ஐங்குறுநூறு · கலித்தொகை · அகநானூறு · பதிற்றுப்பத்து · புறநானூறு · பரிபாடல் · திருமுருகாற்றுப்படை · பொருநராற்றுப்படை · சிறுபாணாற்றுப்படை · பெரும்பாணாற்றுப்படை · மலைபடுகடாம் · மதுரைக்காஞ்சி · குறிஞ்சிப்பாட்டு · பட்டினப்பாலை · முல்லைப்பாட்டு · நெடுநல்வாடை

---

## License

[LICENSE](./LICENSE) — Content licensed under CC BY-SA where applicable.
