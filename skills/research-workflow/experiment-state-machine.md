# Experiment state machine

The `status` field on each card and registry record. `experiments/registry.json`
is the source of truth; the card's frontmatter `status` mirrors it.

```text
draft → approved → launched → analyzed → done
                       └----------------→ failed     (crash / gate not met)
   (any) -----------------------------→ abandoned    (researcher stops it)
```

## States

| Status | Meaning | Entered when |
|---|---|---|
| `draft` | Card being written | Card created |
| `approved` | ⛔ Researcher approved; gate criteria frozen | Researcher confirms the card |
| `launched` | Submitted / running (often outside the session) | Smoke test passed + launch/hand-over done |
| `analyzed` | Real results collected and checked; verdict proposed | Results in `results/<ID>/`, skeptic done |
| `done` | ⛔ Verdict confirmed; artifacts complete; registry current | Researcher confirms the verdict |
| `failed` | Run crashed/diverged or gate failed — recorded, not deleted | Honest negative/failure outcome |
| `abandoned` | Discontinued before completion | Researcher decides to stop it |

## Transition rules

- `draft → approved` is the **only** way past gate 1 and is **human-only**. No
  loop, hook, or autonomous run substitutes for it.
- `approved → launched` requires a recorded smoke-test pass (`smoke_passed`
  non-null). Expensive launches are human-gated.
- `launched → analyzed` requires **real** results on disk. A run may instead go
  `launched → failed` (crash, divergence, OOM) — that is a logged outcome.
- `analyzed → done` is gate 2 and is **human-only** (verdict confirmation). A
  proposed verdict of "gate not met" still goes through confirmation and lands as
  `done` (with a negative finding) or `failed`, per the researcher.
- `→ abandoned` from any state requires a researcher decision and a notebook note
  explaining why.
- A re-run of the same axis is a **new card** (`__v2`, `supersedes:`), never an
  edit of a completed card's design.

## What the agent may do per state

| State | The agent may (no approval) | The agent must ask |
|---|---|---|
| draft | draft/edit the card | — |
| approved | build config/launcher, run smoke test, cheap-local launch within budget | expensive/cluster/paid launch |
| launched | poll for results, prepare analysis scaffolding | — (no fabricating results) |
| analyzed | propose verdict, run skeptic, draft decision entries | confirm the verdict / pass a gate |
| done | update notebook/registry | reopen a done card |
