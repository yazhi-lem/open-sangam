# CURRENT — open-sangam · 2026-10-27

> Reset every Monday. Facts only; each number cites its source. The template and rules are in [`README.md`](README.md).

## 1. Headline

**🔴 Red for the 14 Nov reader gate. 🟡 Amber for the 21 Nov Avai beta.** Engineering is ahead of plan: the reader
has its layered toggle, corpus-only glossary, Tamil typography, mobile fixes and a launch-first data slice, and Avai
has health probes, telemetry, durable sessions, a fast eval harness and a green Cloud Run deploy. The launch gate is
**not engineering**. Lines 1–100 have no English and no scholar sign-off, and the urai reuse licence is unconfirmed.
The five-line source hole is closed (filled from Project Madurai). The reader launches in **18 days**. The scholar track is now the critical path,
and it needs a named person and a daily review quota **this week**.

## 2. Health

| Workstream | RAG | Fact (source) | Next checkpoint |
|---|---|---|---|
| Reader UI (launch scope) | 🟢 | Layered toggle shows only the chosen layer; glossary reads corpus entries only, with draft labels; self-hosted Noto Tamil, never letter-spaced; lines 1–100 load first; 44 px tap targets at 360 px; security headers with CSP in report-only | Launch-readiness review, 10 Nov |
| Maduraikanchi 1–100: Tamil text | 🟡 | 100/100 lines present: the five missing lines of `maduraikanchi_006` (62–74) were filled from Project Madurai `pmuni0496`, and `data/schema/known_line_gaps.json` is empty. The filled lines still need the scholar's check and Project Madurai's reuse terms on record | Scholar check, 30 Oct |
| 1–100: urai | 🟡 | Urai exists from the scraped source; **reuse terms not confirmed** (`docs/brochures/README.md`) | Licence answer, 30 Oct |
| 1–100: English + glosses | 🔴 | 0 of the 9 launch sections have English (`data/texts/maduraikanchi/maduraikanchi.json`); batch drafting was removed on 18 Oct | Draft complete, 1 Nov |
| Scholar sign-off | 🔴 | 0 verified records anywhere in the corpus (brochures, 18 Oct). Recruitment was due 18 Oct; no sign-off recorded | Named scholar + schedule, 29 Oct |
| Correction log + credits page | ⚪ | not started | 8 Nov |
| Avai engineering | 🟢 | `/avai/health/{live,ready}`, `/avai/capabilities`, telemetry + INR cost, durable sessions + Redis rate limit, self-hosted / Ollama backend with safety guards, fast eval + live smoke checks. The Cloud Run deploy workflow is green, **but it skips cleanly without the GCP secrets**, so a green run does not prove a deploy | Confirm a live service URL |
| Avai gold set | 🟡 | A 20-case Pulavar gold set exists (`agents/avai/evals/pulavar_gold_set.py`, 11 categories); the launch gate needs 200 questions with sources by 31 Oct | 31 Oct |
| Citation accuracy | ⚪ | Gate ≥ 90%; not yet measured on a gold set | 5 Nov |
| Red-team suite | 🟢 | Taxonomy + first 150 prompts (`agents/avai/evals/`); 350 native-reviewed due 30 Nov | 30 Nov |
| Avai on the site | 🟡 | `/avai` hidden behind a build flag until beta; shows only when `VITE_AVAI_API_URL` is set | Beta, 21 Nov |
| CI | 🟢 | CI, Cloudflare Pages deploy and Avai deploy all green on `main` (27 Oct) | — |
| Contributor flow | 🔴 | Two external contributions (Purananuru and Kalithogai headings + poet names) waiting since 30 Sep, so the 48-hour first-review promise is broken | Review by 29 Oct |
| Backlog hygiene | 🟡 | ≥ 9 backlog items still open for work already merged; the old project tracker was last updated 4 Aug (now archived) | Close-out, 31 Oct |

## 3. Key metrics

| Metric | Now | Target | Source |
|---|---|---|---|
| Launch lines with Tamil text | 100 / 100 | 100 | `known_line_gaps.json` (empty) |
| Launch lines with English | 0 / 100 | 100 | `maduraikanchi.json` |
| Launch lines scholar-signed | 0 / 100 | 100 by 8 Nov | — |
| Avai gold-set citation accuracy | not measured | ≥ 90% (200 Q) | — |
| Avai native-reviewed answers | 0 | 100 by 8 Nov | — |
| Red-team prompts (written / native-reviewed) | 150 / 0 | 500+ / 350 | `agents/avai/evals/` |
| Invited beta testers | 0 | 50 by 12 Nov | — |
| Frontend automated tests | 0 | smoke tests on the launch route | `frontend/` has no test runner |

## 4. In review

| Change | What | Age | State | Needed to land |
|---|---|---|---|---|
| Tamil + phone-size fixes | Tamil review fixes, 2×2 layer chips, honest labels, wrapping badges | 9 days | awaiting review | Review; launch-relevant (mobile) |
| Draft labelling | Label machine-drafted and unverified text, and keep all generated content (reverses an earlier removal) | 9 days | awaiting review | Product decision, then merge |
| Functions removal | Remove the public `/translate` and `/analyze-word` Gemini functions | 9 days | awaiting review; pulls against the merged lock-down | Decision D5 |
| Purananuru headings | Headings + poet names (external contributor) | 4 wks | awaiting first review | First review (overdue) |
| Kalithogai headings | Headings + poets (external contributor) | 4 wks | awaiting first review | First review (overdue) |
| Two frontend lint drafts | Graph/world page lint fixes | 5 wks | draft, likely superseded | Close |

## 5. Blockers (oldest first)

| # | Blocker | Since | Blocks | Ask / who |
|---|---|---|---|---|
| B1 | No scholar confirmed for Maduraikanchi 1–100 | 18 Oct (target) | The 14 Nov launch gate | Mozhi Federal lead: name the scholar and agree 20 lines/day from 29 Oct |
| B2 | No English for lines 1–100, and no approved way to produce it since batch drafting was removed | 18 Oct | English layer, sign-off | Decide the authoring path (human translator, or scholar-reviewed drafts) by 29 Oct |
| B3 | Urai reuse permission from the source site | ≤ 18 Oct | The urai layer at launch | Write to the site owners; fall back to own urai for 1–100 |
| B4 | Reuse terms for the Project Madurai lines (62–74) not on record | 27 Oct | "every line signed off" | Record the terms alongside R3 |

## 6. Decisions needed

| # | Decision | Options | Recommendation | Decider | By |
|---|---|---|---|---|---|
| D1 | Source gap at 62–74 | **Resolved:** the lines were filled from a second source (Project Madurai `pmuni0496`), so no gap marker is needed | Record Project Madurai's reuse terms; the scholar checks the five filled lines in R5 | Mozhi lead + scholar | 30 Oct |
| D2 | Urai layer if permission is not in hand by 3 Nov | ship scraped urai · own draft urai, scholar-reviewed · launch two layers | **Own draft urai** for 1–100, scholar-reviewed; it is small (~100 lines) | Mozhi lead | 3 Nov |
| D3 | Avai date | 14 Nov (runbook) · 21 Nov (plan) | **21 Nov.** Fix the runbook | Avai lead | 28 Oct |
| D4 | Avai model host for the beta | managed API · regional managed (Mumbai) · self-hosted | Follow the Yazhi sovereign-by-default policy; whatever is chosen, record it in the runbook with the cost per 1k answers (telemetry exists) | Avai lead + platform | 5 Nov |
| D5 | `/translate` + `/analyze-word` | keep locked down · remove | **Remove.** The reader reads the corpus only, so a public Gemini proxy is cost and risk with no user | Maintainer | 31 Oct |

## 7. Done last iteration (12–27 Oct)

Corpus validated against verse schema v2 in CI · Pulavar line-level retrieval; reflection check that rejects uncited claims; ADK-safe tool signatures · Reader: single-layer toggle, corpus-only glossary, Tamil typography, lines 1–100 first, mobile, journeys, Z1 ழ brand mark · Safety/ops: functions locked down; unverified "scholar-verified" claims removed from home; `/avai` behind a flag; security headers; Cloudflare deploy fixed · Gemini batch pipeline + nightly workflow removed (stored data kept) · Red-team taxonomy + 150 prompts · Public brochures (Tamil + English) · Avai production: health/readiness/capabilities, telemetry + INR cost, durable sessions + Redis rate limit, self-hosted backend + guards, Ollama, fast eval + live smoke, Tamil grounding · Corpus: idyll line gaps and heading ranges repaired from Project Madurai (0 known gaps); Tirukkural + Naladiyar added with public-domain English (Pope; Pope/Ellis) · Library: one Tamil Library catalog, artifact register + scholar reader, story seeds and anthology, corpus entity and artifact indexes, Avai research campaigns, offline Nakkirar fallback, nine-layer reader
