# Project Tracker — Open Sangam

> Single consolidated view of where the project stands across every workstream.
> Companion to the forward-looking [ROADMAP.md](./ROADMAP.md).
>
> **Last updated:** 2026-08-04 · **Branch snapshot:** `main` + open work
> **Legend:** ✅ done · 🔄 in progress · ⬜ not started · `█` done `▒` partial `░` pending

---

## 1. Snapshot

| Workstream | Status | Where it stands | Next step |
|---|---|---|---|
| **A · Corpus & data pipeline** | 🔄 | All **18 poems** scraped, normalized & in the Library; **2,489** verse records; Urai 99%. English pipeline live (OpenRouter/Gemini Flash, phased, nightly) | Drive Phase 1 English to 100% and review; colophon metadata (Phase C) |
| **B · Reader web app** | 🔄 | Reader, Knowledge, Graph, Sangam World (3D), Articles, Command Palette all shipped | Audio wiring, a11y & layout polish, 3D→real-data |
| **C · Knowledge graph & entities** | 🔄 | Graph (109 nodes / 292 edges) + `/graph` explorer live (Phases A–B) | Colophon → poets/patrons (Phase C), glossary cross-links (Phase E) |
| **D · Sangam Avai agent swarm** | 🔄 | M1 scaffold live: 1 of 5 poets, corpus/graph/tiṇai tools, 12 tests pass | Finish M1 evalset; build M2 poet swarm |
| **E · Backend, infra & CI/CD** | 🔄 | Cloud Functions (`/translate`, `/analyze-word`), Cloudflare Pages deploy, frontend CI, nightly translation job | Agent deploy path; frontend/functions test coverage; resolve storage split |

> ✅ **README reconciled (2026-08-04).** The README corpus tables now match the
> live data — 18 poems, all readable, 2,552 records — and the stale
> "Ainkurunooru pending source fix" warning is gone.

---

## 2. Workstream A · Corpus & data pipeline

Pipeline: **Scrape → Normalize → Library → English → Verified**
(`backend/python/{scraper,normalizer,ai}/`).

**Live totals (measured from `data/texts/**/normalized/`):**

```
Poems in corpus        18   ████████████████  all scraped, normalized & readable
Verse records       2,489   ████████████████  normalized (Verse → Line → Word)
Modern Tamil (Urai) 2,469   ███████████████░  99% carry source prose
English                 0   ░░░░░░░░░░░░░░░░  Phase 2 — pipeline live, drafting nightly
Scholar-verified        0   ░░░░░░░░░░░░░░░░  Phase 4 — not started
```

> Regenerate these figures with
> `cd backend/python && python -m ai.translate_with_gemini --status`.

### English translation (Phase 2) — 🔄 pipeline live

`backend/python/ai/translate_with_gemini.py` drafts the `english` field with
**Gemini 2.5 Flash via OpenRouter** — the same gateway `agents/avai` uses, so a
single `OPENROUTER_API_KEY` serves both. It is phased, resumable, and bounded:

| Phase | Poems | Verses | Status |
|---|---|---:|:---:|
| **1** | Ten Idylls (பத்துப்பாட்டு) | 380 | ⬜ |
| **2** | Paripadal · Pathitrupathu · Kalithokai · Akananooru | 472 | ⬜ |
| **3** | Purananooru · Natrinai · Kurunthokai · Ainkurunooru | 1,700 | ⬜ |

- Runs nightly at 02:00 UTC via `.github/workflows/translate-english.yml`
  (200 verses/run) and commits results with `[skip ci]`.
- **Requires the repo secret `OPENROUTER_API_KEY`** — the job skips cleanly
  without it, so an unconfigured repo never goes red.
- Each draft carries `verified: false` plus an `englishMeta` provenance block
  (provider, model, prompt version, timestamp, run id).
- Run history and per-poem coverage live in
  `data/pipeline/translation-state.json`; counters are re-derived from disk on
  every run, never carried forward.
- Phase 1 completion is the checkpoint for a human quality read before ~2,100
  further verses get drafted.

### எட்டுத்தொகை — Eight Anthologies

| Poem | | Records | Scrape | Normalize | Library |
|---|---|---:|:---:|:---:|:---:|
| நற்றிணை | Natrinai | 400 | ✅ | ✅ | ✅ |
| குறுந்தொகை | Kurunthokai | 400 | ✅ | ✅ | ✅ |
| ஐங்குறுநூறு | Ainkurunooru | 500 | ✅ | ✅ | ✅ |
| கலித்தொகை | Kalithokai | 149 | ✅ | ✅ | ✅ |
| அகநானூறு | Akananooru | 220 | ✅ | ✅ | ✅ |
| பதிற்றுப்பத்து | Pathitrupathu | 80 | ✅ | ✅ | ✅ |
| புறநானூறு | Purananuru | 400 | ✅ | ✅ | ✅ |
| பரிபாடல் | Paripadal | 23 | ✅ | ✅ | ✅ |

### பத்துப்பாட்டு — Ten Idylls

| Poem | | Records | Scrape | Normalize | Library |
|---|---|---:|:---:|:---:|:---:|
| திருமுருகாற்றுப்படை | Tirumurugatrupadai | 32 | ✅ | ✅ | ✅ |
| பொருநராற்றுப்படை | Porunaratrupadai | 21 | ✅ | ✅ | ✅ |
| சிறுபாணாற்றுப்படை | Sirupanatrupadai | 25 | ✅ | ✅ | ✅ |
| பெரும்பாணாற்றுப்படை | Perumpanatrupadai | 41 | ✅ | ✅ | ✅ |
| மலைபடுகடாம் | Malaipadukadam | 45 | ✅ | ✅ | ✅ |
| மதுரைக்காஞ்சி | Maduraikanchi | 63 | ✅ | ✅ | ✅ |
| குறிஞ்சிப்பாட்டு | Kurinjipattu | 25 | ✅ | ✅ | ✅ |
| பட்டினப்பாலை | Pattinappalai | 30 | ✅ | ✅ | ✅ |
| முல்லைப்பாட்டு | Mullaippattu | 18 | ✅ | ✅ | ✅ |
| நெடுநல்வாடை | Nedunalvadai | 17 | ✅ | ✅ | ✅ |

> The **English** and **Verified** columns are 0% for every poem — omitted from
> the tables above and tracked as Phases 2 / F in the [roadmap](./ROADMAP.md).

### Verse schema & metadata gaps

Each record (`data/schema/verse_schema.json`) carries: `id`, `poem`, `tinai`,
`sangamTamil`, `urai`, `english`, `englishMeta`, `lines`, `culturalNotes`,
`audioUrl`, `source`, `verified`, `number`, `poet`. Present but **largely
unpopulated**:

- `english` / `englishMeta` — 0 records (Phase 2 pipeline now running).
- `verified` — 0 records `true` (Phase 4).
- `poet` / `patron` / `turai` / `speaker` — colophon fields not yet parsed (Phase C).
- `tinai` — many records still `"unknown"`; needs colophon/label backfill.
- `audioUrl` — null across the corpus (audio not yet sourced).

---

## 3. Workstream B · Reader web app

React 19 + Vite 8 + Tailwind v4 (`frontend/`). Routes wired in `src/App.jsx`.

| Feature | Status | Notes |
|---|---|---|
| Library + Reader (`pages/Book.jsx`) | ✅ | Live path; loads **bundled local JSON** via `data/poems.js` lazy loaders |
| Layered View (Tamil / Urai / English) | 🔄 | Tamil + Urai render from data; English relies on **live Gemini calls** (no stored text) |
| Click-to-Define glossary (`WordGlossary`) | ✅ | Calls `/analyze-word` Cloud Function |
| Sangam World + 3D (`components/world/`) | 🔄 | three.js scenes shipped; still on placeholder zone data (#9) |
| Knowledge encyclopedia (`pages/Knowledge.jsx`) | ✅ | Backed by `data/knowledge.js` |
| Connections Graph (`pages/GraphExplorer.jsx`) | ✅ | Backed by `data/knowledge/graph.json` |
| Articles (`ArticlesList` / `ArticleReader`) | ✅ | 19 markdown articles → JSON via `scripts/build-articles.mjs` (pre-dev/build hook) |
| Command Palette (`components/search/`) | ✅ | Global search |
| UI kit + motion components | ✅ | Button, Card, Modal, Toast, Badge, Skeleton, ThemeToggle; Reveal / ScrollTilt |
| Audio recitation (`AudioPlayer.jsx`) | ⬜ | Component exists but unwired — no audio assets, `audioUrl` null (#10) |

**Open frontend issues:** #10 (audio), #9 (3D → real verse data), #20 (modal
close-button a11y), #25 (animations + Library layout responsiveness), PR #56
(home page / landscapes UI, open).

---

## 4. Workstream C · Knowledge graph & entities

Roadmap track from [data-collection-plan.md](./data-collection-plan.md):

| Phase | Deliverable | Status |
|---|---|---|
| **A** | `/knowledge` page + hand-authored `knowledge.js` seed | ✅ done |
| **B** | Corpus interlink graph (`build_graph.py` → `graph.json`, `tinai_context.json`) + `/graph` explorer | ✅ done |
| **C** | Colophon parser → structured `author`/`patron`/`turai`/`speaker`; auto-seed `poets.json` / `patrons.json` | ⬜ next |
| **D** | Close corpus gaps (Ainkurunooru, Poruṉarāṟṟuppaṭai) | ✅ effectively done — both now in corpus (verify data quality) |
| **E** | Karu-poruḷ glossary + inline verse cross-links in reader | ⬜ |
| **F** | AI urai/English drafts → scholar verification loop | ⬜ |

**Graph today:** `data/knowledge/graph.json` — **106 nodes** (`tinai` · `poem` ·
`poet` · `karu`) / **283 edges** (`HAS_TINAI` · `WROTE_IN` · `COMPOSED` ·
`ATTESTS`), every weight derived from the verses. Entity tracks proposed in the
plan (poets ~473, patrons ~50, instruments ~15, glossary ~200) are **not yet
built** — they depend on Phase C.

---

## 5. Workstream D · Sangam Avai agent swarm (`agents/avai/`)

சங்க அவை — a five-poet peer mesh on Google ADK + LiteLLM via **OpenRouter**
(default `google/gemini-2.5-flash`). Full spec:
[agent-implementation-plan.md](./agent-implementation-plan.md).

**To run them:** `agents/avai/README.md` is the canonical runbook — setup,
`cd agents && adk run avai` (ADK resolves agents from the *parent* directory,
which is the usual stumbling block), `adk web`, `pytest avai/tests`, the
env-var table, and troubleshooting. The root `README.md` carries a short
quick-start that links there.

### Agents M1 — Foundations & ஔவையார் Q&A (due 2026-08-31) — 🔄 mostly done

- [x] #31 Scaffold `agents/avai` ADK package + OpenRouter/Gemini model switch
- [x] #32 Corpus tools (`get_verse` / `search_verses` / `list_poems`)
- [x] #33 Knowledge-graph + tiṇai context tools
- [x] #34 ஔவையார் Avvaiyar Q&A agent (scaffolded + live-tested; **formal `adk eval` evalset still pending**)

> Verified findings: **12 pytest pass** (`agents/avai/tests`, tools only, no LLM).
> `google/gemma-3-27b-it` failed to tool-call over OpenRouter → default switched
> to `google/gemini-2.5-flash`. A 3-case smoke run showed LLM stochasticity — a
> ~10-case `adk eval` set is the remaining M1 work.

### Agents M2 — The Poet Swarm (due 2026-09-30) — ⬜ not started

- [ ] #35 தொல்காப்பியர் Tholkappiyar — scenario extraction (Pydantic `output_schema`)
- [ ] #36 கபிலர் Kapilar — poem recreation with governance labeling
- [ ] #37 பரணர் Paranar — imagery agent + pluggable image backend
- [ ] #38 நக்கீரர் Nakkirar — convener + peer-mesh handoff + routing evals
- [ ] #39 Scenario persistence to `data/scenarios/` *(stretch)*

### Agents M3 — A2A/A2UI Assembly & Deploy (due 2026-10-31) — ⬜ not started

- [ ] #40 Expose all five poets via A2A (mounted apps + AgentCards)
- [ ] #41 Frontend `/avai` assembly chat (markdown fallback first)
- [ ] #42 Cloud Run deployment + secrets + CI (`deploy-agent.yml`, Dockerfile — **not yet written**)
- [ ] #43 A2UI rich responses (server templates + Lit renderer)
- [ ] #44 Docs, governance & hardening (rate limiting, optional App Check)

---

## 6. Workstream E · Backend, infra & CI/CD

| Piece | Status | Notes |
|---|---|---|
| Cloud Functions (`backend/functions/`) | ✅ | `POST /translate`, `POST /analyze-word` → Gemini 2.5 Flash; key as Firebase Secret |
| Firestore rules / indexes | 🔄 | Rules present (public read / admin write); **not populated** — see §8 |
| Frontend CI (`.github/workflows/ci.yml`) | ✅ | `npm ci` → lint → build on `frontend/**`; **no test step** |
| Translation job (`translate-english.yml`) | ✅ | Nightly 02:00 UTC + `workflow_dispatch`; 200 verses/run → auto-commit. Needs secret `OPENROUTER_API_KEY` |
| Deploy (`deploy-cloudflare-pages.yml`) | ✅ | Builds `frontend/dist` → **Cloudflare Pages** (`sangam.yazhi.dev`) |
| Project automation | ✅ | `setup-project.yml` / `setup-agents-project.yml` create milestones + issues |
| Agent deploy (Cloud Run) | ⬜ | Dockerfile + `deploy-agent.yml` not yet written (M3 / #42) |

---

## 7. Open issues index

| # | Area | Title | State |
|---|---|---|---|
| 47 | frontend/data | Ainkurunooru entry disabled — missing loader | OPEN (⚠ appears resolved: registry now `available: true`) |
| 44 | agents · M3 | Docs, governance, and hardening | OPEN |
| 43 | agents · M3 | A2UI rich responses | OPEN |
| 42 | agents · M3 | Cloud Run deployment + secrets + CI | OPEN |
| 41 | agents · M3 | Frontend `/avai` assembly chat | OPEN |
| 40 | agents · M3 | Expose five poets via A2A | OPEN |
| 39 | agents · M2 | Scenario persistence (stretch) | OPEN |
| 38 | agents · M2 | Nakkirar convener + swarm mesh | OPEN |
| 37 | agents · M2 | Paranar imagery + image backend | OPEN |
| 36 | agents · M2 | Kapilar poem recreation | OPEN |
| 35 | agents · M2 | Tholkappiyar scenario extraction | OPEN |
| 34 | agents · M1 | Avvaiyar Q&A agent | OPEN (scaffolded) |
| 33 | agents · M1 | Knowledge-graph + tiṇai tools | OPEN (done in code) |
| 32 | agents · M1 | Corpus tools | OPEN (done in code) |
| 31 | agents · M1 | Scaffold ADK package | OPEN (done in code) |
| 25 | frontend | UI animations + Library layout responsiveness | OPEN |
| 20 | frontend/a11y | Modal close buttons lack accessible name | OPEN |
| 10 | frontend | Add audio recitation for verses | OPEN |
| 9 | frontend/world | Wire Tiṇai 3D scenes to real verse data | OPEN |
| 8 | data | Complete transliteration + English coverage (17 poems) | OPEN |
| 4 | data | Collect 100% of Sangam poems, transliterated | OPEN |

> Several agent M1 issues (#31–#33) and #47 are complete in code but still marked
> OPEN — the issue tracker lags the branch. A tracker-vs-issues reconciliation is
> a quick housekeeping task.

---

## 8. Risks, tech debt & doc drift

1. **English translation is 0% — but no longer blocked.** A phased, scheduled
   pipeline now drafts into the `english` field nightly (§2). Until it has run,
   the "English" layer still depends on **live Gemini calls**, which is in
   tension with the static-hosting deploy model; stored drafts resolve that as
   coverage grows. Remaining risk is **cost and quality drift**, not absence:
   watch the Phase 1 output before letting phases 2–3 run unattended.
2. **Scholar verification is 0%** — no `verified: true` records; the
   contribution/review layer (Phase 4) is unbuilt. The volume of AI drafts about
   to land makes this the next real bottleneck.
3. **Testing is still thin.** `agents/avai/tests` (12) and
   `backend/python/tests` (31, translation pipeline) pass. **Frontend and Cloud
   Functions have zero automated tests**, and CI runs no test step for either
   Python suite.
4. **Dead Firestore reader path.** `pages/Reader.jsx` → `hooks/useVerse.js` →
   `services/verseService.js` → `services/firebase.js` is unreachable (`/reader`
   redirects to `/book`), and nothing populates Firestore. The live reader ships
   **bundled static JSON**. The README/architecture "Firebase Hosting + Firestore"
   design is aspirational vs. the shipped **static-JSON-on-Cloudflare-Pages** reality.
5. **Doc drift — partly resolved.** The README corpus tables were reconciled to
   the live corpus on 2026-08-04 (18 poems / 2,552 records / 2,529 urai, all
   readable). **Still outstanding:** architecture docs name Firebase Hosting
   while prod is Cloudflare Pages.
6. **Colophon metadata unparsed** — `poet`/`patron`/`turai`/`speaker` empty and
   many `tinai: unknown`; blocks the knowledge-entity tracks (Phase C).
7. **Audio unwired** — `AudioPlayer.jsx` exists but no assets or `audioUrl` data.
8. **Agent eval reliability** — a single smoke run is not a stable pass/fail
   signal; a repeat-aware evalset is needed before calling M1 "done."

---

*See [ROADMAP.md](./ROADMAP.md) for how these are sequenced into future work.*
