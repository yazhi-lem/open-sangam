# Next Actions: Open Sangam and Avai (Q4 2026)

> This file mirrors the Yazhi Q4 2026 launch plan as of **8 Oct 2026**. The longer-range vision
> stays in [docs/ROADMAP.md](./docs/ROADMAP.md).

This repo carries two Q4 projects: the **Open Sangam reader** and **Avai + Pulavar**, the Tamil enquiry space.
The Pulavar answer format and refusal rule landed in [#97](https://github.com/yazhi-lem/open-sangam/pull/97) and [#99](https://github.com/yazhi-lem/open-sangam/pull/99).

## 1. Open Sangam reader: public launch **14 Nov 2026**

| | |
|---|---|
| Federal | **Mozhi** (shared with Illakiya) |
| Scope on 14 Nov | **Maduraikanchi lines 1–100** in three layers: Sangam Tamil · modern Tamil · English. Every line is signed off by a Tamil scholar |
| After launch | Lines 101–300 through the same pipeline by **31 Dec 2026** |
| Deferred to 2027 | Audio recitation, quizzes and progress tracking, other poems |
| Launch gate | Scholar sign-off on all 100 lines |

| Target date | Milestone | What |
|---|---|---|
| 9 Oct 2026 | Extract | Scrape and clean Maduraikanchi (782 lines) |
| 11 Oct 2026 | Extract | Define the poem → line → word JSON schema and validate it in CI |
| 18 Oct 2026 | Verify | Recruit a Tamil scholar to review Open Sangam's Maduraikanchi lines |
| 25 Oct 2026 | Annotate | Draft the modern Tamil urai for lines 1–100, marked draft |
| 1 Nov 2026 | Annotate | Write English lines and keyword glosses for lines 1–100 |
| 5 Nov 2026 | Reader launch | Build the layered view toggle in the Open Sangam reader |
| 8 Nov 2026 | Verify | Get scholar sign-off on all 100 lines |
| 8 Nov 2026 | Verify | Publish the correction log and contributor credits page |
| 10 Nov 2026 | Reader launch | Build the click-to-define glossary in the Open Sangam reader |
| 10 Nov 2026 | Reader launch | Set mobile typography: Noto Sans Tamil, no tracking on Tamil |
| 14 Nov 2026 | Reader launch | Launch the Open Sangam reader publicly with Maduraikanchi 1–100 |
| 5 Dec 2026 | Community edits | Build the suggest-an-edit flow for scholars |
| 31 Dec 2026 | Community edits | Run Maduraikanchi lines 101–300 through the same pipeline |

## 2. Avai + Pulavar: public beta **21 Nov 2026**

| | |
|---|---|
| Federal | **Avai** |
| What it is | Ask anything about Tamil. The Pulavar agent answers on literature, grammar, word meaning and usage, with a source for every claim |
| Answer rule | Pulavar says "I don't know" rather than answer without a source |
| Launch gates | Citation accuracy **≥90%** on a 200-question gold set; native review of 100 sampled answers |
| Also by 31 Dec | Tamil red-team suite (500+ prompts) published with a datasheet on HuggingFace |

| Target date | Milestone | What |
|---|---|---|
| 11 Oct 2026 | Define | Define the Pulavar answer format with inline citations |
| 15 Oct 2026 | Internal alpha | Build Pulavar retrieval over Open Sangam and licensed references |
| 16 Oct 2026 | Internal alpha | Add a reflection check to the Pulavar prompt for uncited claims |
| 18 Oct 2026 | Internal alpha | Ship the Avai chat UI on yazhi.dev with login-free read mode |
| 31 Oct 2026 | Evaluate | Write the Avai 200-question gold set with sources |
| 31 Oct 2026 | Red-team suite | Write the red-team taxonomy and the first 150 prompts |
| 5 Nov 2026 | Evaluate | Measure Pulavar citation accuracy and reach ≥90% on the gold set |
| 8 Nov 2026 | Evaluate | Native-review 100 sampled Pulavar answers and apply the fixes |
| 12 Nov 2026 | Public beta | Recruit 50 invited Avai testers |
| 14 Nov 2026 | Public beta | Add a feedback button to every Avai answer |
| 19 Nov 2026 | Public beta | Triage Avai tester feedback and close the launch blockers |
| 21 Nov 2026 | Public beta | Launch the Avai public beta |
| 30 Nov 2026 | Red-team suite | Native-review the 350 Avai red-team prompts |
| 31 Dec 2026 | Red-team suite | Publish 500+ prompt red-team suite with datasheet on HuggingFace |

## 3. Immediate next actions

1. Scrape and clean Maduraikanchi (782 lines), then define and CI-validate the poem → line → word JSON schema.
2. Bring a Tamil scholar on board to review lines 1–100.
3. Pulavar retrieval over Open Sangam and references, plus a reflection check for uncited claims.
4. Review the open contributor PRs [#90](https://github.com/yazhi-lem/open-sangam/pull/90) and [#93](https://github.com/yazhi-lem/open-sangam/pull/93) (headings and poet names).

## 4. What changed from the previous version of this file

The previous file promised an October pilot covering **all 18 anthologies** plus a live poet-agent demo, and a December
launch with the 3D Tiṇai navigator, knowledge graph and PWA. The Q4 plan is narrower: Maduraikanchi 1–100 (14 Nov),
lines 101–300 (31 Dec) and the Avai beta (21 Nov). The 3D world, knowledge graph and PWA remain longer-range ideas in
[docs/ROADMAP.md](./docs/ROADMAP.md).
