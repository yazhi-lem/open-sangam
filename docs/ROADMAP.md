# Roadmap — Open Sangam

> Where the project is going. Companion to the current-status
> [PROJECT_TRACKER.md](./PROJECT_TRACKER.md).
>
> **Horizon 1 (Now)** consolidates plans already in the repo. **Horizon 3
> (Later)** additionally *proposes* new directions — those are clearly marked
> **[proposed]** and are not yet committed scope.
>
> **Last updated:** 2026-08-04

---

## Vision

*"Duolingo for Ancient Literature."* Turn the entire Sangam corpus into a
**complete, cited, interactive** learning platform — every verse readable in
Sangam Tamil, modern Tamil prose (*urai*), and English; every word, poet, patron,
and landscape cross-linked into one navigable knowledge graph; and an AI
assembly (*சங்க அவை*) that answers, illustrates, and reimagines the corpus while
always labelling what is machine-generated and unverified.

The critical path is **corpus data → knowledge graph → reader + agents**: richer,
verified data is what unlocks nearly everything downstream.

---

## Horizon 1 — Now / Near-term (Q3 2026)

Finishing what is already in flight. Sourced from the corpus phase plan and the
Agents M1 milestone.

1. **Finish Agents M1 (#34).** Replace the 3-case smoke test with a formal
   `adk eval` evalset (~10 cases, repeat-aware for LLM variance) for ஔவையார்
   Avvaiyar. *Due 2026-08-31.*
2. **Corpus Phase C — colophon metadata.** Parse the already-scraped colophons
   into structured `author` / `patron` / `turai` / `speaker` fields; backfill
   `tinai: unknown`; auto-seed `poets.json` / `patrons.json`. Unblocks the
   knowledge-entity tracks.
3. **Data-quality pass on the two former gaps.** Ainkurunooru (500) and
   Poruṉarāṟṟuppaṭai (21) are now in the corpus — verify verse integrity, urai
   coverage, and tiṇai labels rather than treating them as missing.
4. **Frontend quick wins.** #20 (modal close-button a11y), #9 (wire 3D scenes to
   real verse data), #25 / PR #56 (Library layout + animation polish), and close
   #47 (Ainkurunooru registry, already `available: true`).
5. **Reconcile the docs to reality.** README corpus tables updated to 18 poems /
   2,552 records ✅ (2026-08-04). Still to do: correct Firebase-Hosting →
   Cloudflare-Pages references in the architecture docs.
6. **Land Phase 1 English drafts.** The nightly pipeline covers the Ten Idylls
   (~380 verses) first; read the output before letting phases 2–3 run on.

---

## Horizon 2 — Next / Mid-term (Q4 2026)

Building the assembly out and starting the translation deliverable.

1. **Agents M2 — the poet swarm (#35–#39).** Tholkappiyar (scenario extraction),
   Kapilar (poem recreation), Paranar (imagery + pluggable image backend),
   Nakkirar (convener + peer-mesh routing evals), optional scenario persistence.
   *Due 2026-09-30.*
2. **Agents M3 — assembly & deploy (#40–#44).** Expose all five poets via A2A,
   ship the `/avai` chat (markdown first, then A2UI), Cloud Run deploy + secrets +
   CI, docs/governance/hardening. *Due 2026-10-31.*
3. **Corpus Phase 2 — English translation.** The batch drafter
   (`ai/translate_with_gemini.py`) is **built and scheduled**: Gemini 2.5 Flash
   via OpenRouter, 200 verses nightly, three phases smallest-first, every draft
   `verified: false` with `englishMeta` provenance and a run record in
   `data/pipeline/translation-state.json`. Remaining work is *operational*
   rather than constructional: set the `OPENROUTER_API_KEY` secret, watch cost
   and quality through phase 1, and settle **stored vs. live** translations —
   stored drafts are what let the static Cloudflare Pages build stop calling
   Gemini per verse.
4. **Corpus Phase E — karu-poruḷ glossary** + inline verse cross-links in the reader.
5. **Corpus Phase F / Phase 4 foundations — verification loop.** Stand up the
   human-in-the-loop review protocol so AI drafts can move `verified: false → true`.
6. **Audio recitation (#10).** Choose recorded vs. synthesized, wire `audioUrl`,
   ship one poem end-to-end.

---

## Horizon 3 — Later / Long-term — **[proposed]**

New directions beyond what today's docs commit to. Prioritize by impact; none are
scheduled yet.

- **Testing & CI hardening** — add frontend (Vitest), Cloud Functions, and Python
  pipeline test suites and a CI test step. *Currently the single biggest quality
  gap (§8 of the tracker).*
- **Resolve the storage-architecture split** — either populate Firestore and use
  it, or formally adopt the static-JSON model and retire the dead Reader/Firebase
  path. Decide where translations live (bundled vs. on-demand).
- **Full-text & semantic search** — search across Tamil, urai, and English; reuse
  the agent corpus index / graph for concept search, not just the command palette.
- **Spaced-repetition "Learn" mode** — actually deliver the "Duolingo" framing:
  word-of-the-day, glossary drills, tiṇai quizzes built on the existing glossary
  and knowledge graph.
- **PWA / offline / mobile** — installable, offline-capable reader (the corpus is
  already static JSON, so this is largely a manifest + service-worker effort).
- **Internationalisation beyond English** — the layered-view + translation
  pipeline generalises to other languages once English lands.
- **Public dataset / API release** — publish the normalized corpus + graph as a
  versioned OKF datapackage (and/or read-only API) for other researchers.
- **Accessibility & audio at scale** — full WCAG pass beyond #20; scale audio
  recitation across all 18 poems once the first is proven.
- **Contributor & scholar tooling** — onboarding, review dashboards, and
  attribution for the Phase 4 community layer.

---

## Milestone timeline

| When | Milestone | Scope |
|---|---|---|
| **2026-08-31** | Agents **M1** | Foundations + Avvaiyar Q&A evalset; Corpus Phase C started |
| **2026-09-30** | Agents **M2** | Five-poet swarm (scenario, recreation, imagery, convener) |
| **2026-10-31** | Agents **M3** | A2A/A2UI `/avai` assembly deployed to Cloud Run |
| Q4 2026 | Corpus **Phase 2 / E / F** | English drafting, glossary cross-links, verification loop |
| Q4 2026 → | Reader | Audio recitation, 3D real-data, layout/a11y polish |
| **[proposed]** | Platform | Testing/CI, search, Learn mode, PWA, dataset release |

---

## Dependencies & sequencing

- **Data first.** Phase C (colophon metadata) feeds the knowledge-entity tracks,
  richer graph edges, and better agent grounding — do it early.
- **Graph before entities.** The `/knowledge` entity pages (poets, patrons,
  glossary) depend on Phase C output, not just the existing graph.
- **Agents M1 → M2 → M3** are strictly ordered; M3 deploy also depends on the
  Cloud Run/CI work in #42.
- **Translation (Phase 2) → verification (Phase F/Phase 4)** — drafts must exist
  before there is anything to review.
- **Storage decision gates** both stored translations and any real Firestore use;
  resolve it before investing further in the dead Firebase path.

---

*Status for every item above lives in [PROJECT_TRACKER.md](./PROJECT_TRACKER.md).*
