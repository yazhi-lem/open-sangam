# NEXT — open-sangam · iteration 1 · 2026-10-28 → 2026-11-10

**Iteration goal:** by 10 Nov, Maduraikanchi 1–100 is complete in three layers and signed off line by line, and Avai
has a measured ≥ 90% citation accuracy on its gold set. The 14 Nov and 21 Nov launches then become a release step,
not a scramble.

**Capacity:** _set this to measured velocity × 2 weeks_. The scholar's review time is the scarce resource: plan
**20 lines/day** with 3 days of buffer.
**Committed:** reader P0 ≈ 8 days (spread across scholar, translator and a frontend DRI) · Avai P0 ≈ 7 days · P1 ≈ 4 days

### Reader: Maduraikanchi 1–100 (launch 14 Nov)

| ID | P | Task | DRI | Size | Exit criterion | Depends on | Due |
|---|---|---|---|---|---|---|---|
| R1 | P0 | **Lock in the scholar.** Name, agreement, credit line, review format (per-line ✅ / ✏️ with reason), and a daily quota of 20 lines from 29 Oct | Mozhi lead | S (1d) | Written agreement; first 20 lines reviewed by 30 Oct | — | 29 Oct |
| R2 | P0 | **Decide the 62–74 source gap** (`CURRENT` D1): marker text, or a second licence-cleared source | Mozhi lead + scholar | S (0.5d) | Decision recorded in `data/texts/maduraikanchi/README.md`; if (b), the reader renders a visible gap marker (test) | R1 | 30 Oct |
| R3 | P0 | **Urai licence.** Send the written request to the source site; if there is no yes by 3 Nov, draft own urai for 1–100, marked draft | Mozhi lead | S (1d) + M fallback | Permission archived in `docs/`, **or** own urai for 9 sections in the corpus with `verified: false` | — | 3 Nov |
| R4 | P0 | **English lines + keyword glosses, 1–100** by a human translator, or as drafts the scholar reviews line by line; `englishMeta` records the author | Translator (assign) | M (3d) | 9 launch sections carry `english` + glosses; schema v2 CI green | R1 | 1 Nov |
| R5 | P0 | **Scholar sign-off pass** across all three layers, written as `verified: true` + reviewer + date per record, through one reviewed change | Scholar · Mozhi lead (merges) | L (5 review days) | 100/100 launch lines (or 95 + an approved gap marker) `verified: true`; correction diff in the review change | R2–R4 | 8 Nov |
| R6 | P0 | **Correction log + contributor credits page** | Frontend DRI | S (1d) | `/credits` lists the scholar, translator and contributors; the correction log renders from the review change | R5 | 8 Nov |
| R7 | P0 | **Launch-readiness review**: run the gate checklist (below) on a production build | Mozhi lead | S (0.5d) | Every checklist row ✅ or has a waiver signed by the lead | R5, R6 | 10 Nov |
| R8 | P1 | Land the waiting mobile/Tamil fixes and decide the draft-labelling change | Frontend DRI | S (1d) | Both merged or closed with a reason | — | 31 Oct |
| R9 | P1 | Hand the launch campaign assets (screens, a 3-line pitch, credits) to yazhi-dev Media | Mozhi lead | S (0.5d) | Assets delivered | R7 | 11 Nov |

**Reader launch gate checklist (R7):** 100 lines signed (or 95 + approved marker) · three layers shown only for signed
records · no unverified English presented as verified · Tamil never letter-spaced · 360 px layout OK · Lighthouse
mobile ≥ 90 on `/book/maduraikanchi` · CSP violations in report-only reviewed (empty, or explained) · rollback = the
previous Cloudflare Pages deployment, one click, tested.

### Avai + Pulavar (beta 21 Nov)

| ID | P | Task | DRI | Size | Exit criterion | Depends on | Due |
|---|---|---|---|---|---|---|---|
| A1 | P0 | **One date.** Change `docs/avai/avai-launch-runbook.md` to 21 Nov | Avai lead | S (0.1d) | Runbook and `factory/RUNWAY.md` agree | — | 28 Oct |
| A2 | P0 | **200-question gold set with sources**: literature, grammar, word meaning and usage, plus ≥ 15% unanswerable (correct answer = abstain) | Avai lead + a Tamil reviewer | M (3d) | `agents/avai/evals/gold_v1.jsonl` + datasheet; every source id resolves in the corpus (test) | — | 31 Oct |
| A3 | P0 | **Measure and reach ≥ 90% citation accuracy** with the live smoke harness on the chosen beta model; publish the report | Avai lead | M (3d) | `docs/avai-eval-v1.md` with accuracy, abstention precision/recall, cost per answer (INR) and a per-category breakdown | A2, A5 | 5 Nov |
| A4 | P0 | **Native review of 100 sampled answers**; fix what it finds | Tamil reviewer | M (2d) | Review sheet committed; fixes merged; re-measure ≥ 90% | A3 | 8 Nov |
| A5 | P0 | **Choose the beta model host** (`CURRENT` D4) and pin it in config and the runbook | Avai lead + platform | S (0.5d) | `SANGAM_AGENT_BACKEND`/`MODEL` pinned for production; readiness gate green on staging | — | 3 Nov |
| A6 | P1 | **Recruit 50 invited testers**: an invite list across students, teachers and scholars, with a consent note | Avai lead | S (1d) | 50 confirmed | — | 12 Nov |
| A7 | P1 | **Feedback button on every answer**, logged with `trace_id`, no PII | Frontend DRI | S (1d) | Button live behind the flag; event visible in `/avai/metrics` | — | 10 Nov |

### Repo health

| ID | P | Task | DRI | Size | Exit criterion | Due |
|---|---|---|---|---|---|---|
| H1 | P1 | First review on the two external contributions; close the two lint drafts; decide the functions removal (`CURRENT` D5) | Maintainer | S (1d) | No external change waits more than 48 h for a first review | 29 Oct |
| H2 | P1 | Close backlog items already done in code (layer toggle, glossary, typography, schema CI, red-team 150, reflection check, the three first agent scaffolds, the Ainkurunooru loader) | Maintainer | S (0.5d) | Open backlog = open work | 31 Oct |
| H3 | P1 | Doc drift fixes from `archives/2026-10-27-docs-digest.md` §3 | Maintainer | S (1d) | README/architecture/integration docs match production | 6 Nov |

## Stretch

Vitest smoke tests for the launch route · CSP from report-only to enforce if clean.

## Explicitly not this iteration

Audio, quizzes, other poems, 3D/graph work, A2A/A2UI, new agent workflows. All are deferred to 2027 by the Q4 plan.
