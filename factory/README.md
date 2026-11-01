# factory/ — CURRENT · NEXT · RUNWAY

The same three planning docs live in every Yazhi repo. Each one answers one question.

| File | Question | Horizon | Changes |
|---|---|---|---|
| [`CURRENT.md`](CURRENT.md) | Where are we, truthfully? Measured facts, RAG health, blockers, decisions waiting | today | Reset every Monday |
| [`NEXT.md`](NEXT.md) | What do we commit to finish? Ranked tasks with DRI, size, exit criterion | 2 weeks | At iteration planning; frozen mid-iteration except P0 incidents |
| [`RUNWAY.md`](RUNWAY.md) | How do we reach launch, and what breaks if we don't? Milestones, critical path, risks, cut list | launch + 1 quarter | Every iteration boundary |

Superseded docs go to [`../archives/`](../archives) as dated, compressed snapshots.

## Rhythm

**Monday:** re-measure `CURRENT`. **Every second Monday:** close the iteration, pull from `RUNWAY` into `NEXT`.
**Any blocker older than 48 h:** escalate it in `CURRENT` with a named ask. **Any slip:** update `RUNWAY` first, then
tell the people downstream.

## Rules

1. **Facts, not adjectives.** Every number names its source (a file, a run, or a command).
2. **One DRI per task.** Use a role until a person is named; treat "unassigned" as a blocker.
3. **Every task has an exit criterion a stranger can check.**
4. **Size: S ≤ 1 day, M ≤ 3, L ≤ 5.** Split anything bigger before it enters `NEXT`.
5. **Capacity before commitment.** `NEXT` holds at most velocity × 2 weeks; the overflow returns to `RUNWAY`.
6. **Gates are hard, scope is soft.** When a date is at risk, use the cut list. Never lower a quality gate.
7. **Rank by** what unblocks the critical path, then risk retired, then value.
8. **No tracker IDs, change-request numbers, local paths or agent-session details.** Describe work by what it is.
   Public repos also never carry client names, prices or private-repo internals.
9. **Done means merged to `main`.**

Legend: 🟢 on track · 🟡 at risk · 🔴 needs a decision or a cut · ⚪ not started · ⛔ blocked.
**P0** blocks a gate or the critical path · **P1** needed for the milestone · **P2** improves it.

## Skeleton for a new repo

- **`CURRENT`:** Headline · Health (workstream, RAG, fact + source, next checkpoint) · Key metrics (now, target,
  source) · In review · Blockers (oldest first) · Decisions needed (options, recommendation, decider, date) · Done
  last iteration.
- **`NEXT`:** iteration goal · capacity · table (ID, P, task, DRI, size, exit criterion, depends on, due) · stretch ·
  explicitly not this iteration.
- **`RUNWAY`:** milestones with gates · critical path · cross-repo dependencies · risk register (L, I, mitigation,
  trigger, owner) · cut list · beyond launch.
