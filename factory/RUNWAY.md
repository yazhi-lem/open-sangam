# RUNWAY — open-sangam · 2026-10-27 → 2027-03-31

> **Plan reset, 20 Nov 2026:** we are replanning from scratch, so every launch and due date in this doc is TBD (replanning).

## 1. Milestones

| Date | Milestone | Gate (how we know) | RAG |
|---|---|---|---|
| TBD (replanning) | Scholar engaged | Agreement + first 20 lines reviewed | 🔴 |
| TBD (replanning) | Avai gold set | 200 Q with sources, ≥ 15% unanswerable | 🟡 |
| TBD (replanning) | English for 1–100 drafted | Schema CI green; `englishMeta` names the author | 🔴 |
| TBD (replanning) | Avai ≥ 90% citation accuracy | Published eval report | ⚪ |
| TBD (replanning) | 1–100 signed off; correction log + credits; 100 Avai answers native-reviewed | `verified: true` on every launch record | 🔴 |
| TBD (replanning) | Launch-readiness review | Gate checklist in `NEXT.md` all ✅ | ⚪ |
| **TBD (replanning)** | **Open Sangam reader public: Maduraikanchi 1–100** | Live on `sangam.yazhi.dev`; campaign out | 🔴 |
| TBD (replanning) | 50 testers onboarded; feedback triaged; launch blockers closed | Blocker list empty | ⚪ |
| **TBD (replanning)** | **Avai + Pulavar public beta** | `/avai` flag on in production; readiness green; runbook followed | 🟡 |
| TBD (replanning) | 350 red-team prompts native-reviewed | Review sheet | 🟢 |
| TBD (replanning) | Suggest-an-edit flow for scholars | Contribution → review → `verified` round trip works | ⚪ |
| **TBD (replanning)** | Maduraikanchi 101–300 through the same pipeline · 500+ red-team prompts on HuggingFace with a datasheet | Same scholar gate · dataset card | ⚪ |
| TBD (replanning) | Audio, quizzes/progress, next poem; storage decision; colophon metadata (Phase C) | See §6 | ⚪ |

## 2. Critical path (launch date TBD (replanning))

```
scholar engaged (TBD (replanning)) ─┬─► 62–74 fill checked (TBD (replanning)) ─────────┐
                          ├─► urai licence or own urai (TBD (replanning)) ────┤
                          └─► English 1–100 (TBD (replanning)) ───────────────┴─► sign-off 20 lines/day (TBD (replanning))
                                                                            │
                                         credits + correction log (TBD (replanning)) ◄─┘
                                                                            ▼
                                                   readiness review (TBD (replanning)) ─► launch (TBD (replanning))
```

**Float: 3 working days** (TBD (replanning)). The scholar is a single point of failure. If fewer than 60 lines are signed
by TBD (replanning), invoke the cut list at once rather than on TBD (replanning).

Avai's critical path is gold set → host decision → measurement → native review → testers → beta, with ~1 week of
float. Its main risk is accuracy below 90% (R5).

## 3. Cross-repo dependencies

| We need | From | By | Status |
|---|---|---|---|
| Launch campaigns for TBD (replanning) (reader) and TBD (replanning) (Avai) | yazhi-dev (Media) | assets TBD (replanning) | ⚪ |
| Avai chat entry point on yazhi.dev (login-free read mode) | yazhi-dev | TBD (replanning) | 🟡 |
| A model host that meets the Yazhi sovereign-by-default policy, plus the shared release/rollback template | yazhi-api (platform) | TBD (replanning) | ⚪ |
| First-line support for beta testers | platform team | TBD (replanning) | ⚪ |
| **We provide:** Sangam labels, poems and English gold (*eurai*) for Adhan SFT | → adhan | ongoing | 🟢 |

## 4. Risk register

| # | Risk | L | I | Mitigation | Trigger to act | Owner |
|---|---|---|---|---|---|---|
| R1 | Scholar unavailable or slower than 20 lines/day | 3 | 3 | Name a second reviewer now; batch review by section; tooling that shows the three layers side by side | < 60 lines signed by TBD (replanning) | Mozhi lead |
| R2 | The Project Madurai lines (62–74) fail the scholar's check, or their reuse terms are unclear | 1 | 2 | Scholar checks against a print edition; fall back to a visible "missing in source" marker | Not cleared by TBD (replanning) | Mozhi lead |
| R3 | Urai permission refused or silent | 2 | 3 | Own urai for 1–100 (small) | No yes by TBD (replanning) | Mozhi lead |
| R4 | English quality is too literal or too loose (style guide §2) | 2 | 2 | Translator follows `editorial-style-guide.md`; scholar checks against a print edition | Scholar rejects > 20% | Translator |
| R5 | Avai < 90% on the gold set | 2 | 3 | Deterministic grounding (`TamilGroundingPlugin`), reflection check, abstain more | < 85% on TBD (replanning) | Avai lead |
| R6 | Model host conflicts with the sovereignty policy, or costs spike | 2 | 2 | Decide D4 explicitly; rate limit (12/min) + INR cost telemetry; budget alert | Cost per 1k answers above budget | Avai lead |
| R7 | Abuse or jailbreaks at public beta | 2 | 2 | 150 → 350 red-team prompts; rate limiting; invite-only first week | Any CRITICAL red-team failure | Avai lead |
| R8 | Contributors churn because reviews go unanswered (contributions waiting 4 weeks) | 3 | 1 | 48 h first-review rota (yazhi-dev policy, TBD (replanning)) | Any external change > 48 h | Maintainer |

## 5. Cut list (in order, if the launch date is at risk)

The scholar gate never moves. Unsigned text is never shown as verified.

1. Drop keyword glosses for 1–100; keep the English lines.
2. Launch with the lines that are signed, contiguous from line 1 (for example 1–61), and publish the remainder as "in
   review". Say so on the page.
3. Launch two layers (Tamil + English) if the urai is neither licensed nor reviewed.
4. Slip the reader and launch it together with Avai, one campaign. This is better than shipping unsigned.

For Avai (TBD (replanning)): (1) invite-only beta instead of public → (2) retrieval-only mode (cited passages, no generated
prose) → (3) slip a week.

## 6. Beyond launch (Q1 2027)

Lines 301–782 and a second poem via suggest-an-edit · adopt static JSON and retire the dead Firestore path · colophon
metadata → poet/patron pages · audio for one poem · Learn mode · a versioned public dataset · frontend + Functions
tests in CI. Detail: `archives/2026-10-27-docs-digest.md` §4 (roadmap).
