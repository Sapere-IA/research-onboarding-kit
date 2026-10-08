---
doc: card
title: E002_example-label-smoothing — Label smoothing on the baseline
experiment_id: E002_example-label-smoothing
status: draft
gate_result: pending
plan_ref: PLAN.md § P2
supersedes: none
approver: supervisor
budget: 2 GPU-h
smoke_passed: TODO
---

<!-- Kit reference example: a card waiting for approval (⛔ gate 1). Open card.html to review it. -->

## Summary

Does label smoothing (ε = 0.1) improve calibration of the E001 baseline without costing accuracy? It passes if ECE drops by ≥ 20% relative while top-1 stays within 0.3 pt.

## Hypothesis

H1: Label smoothing with ε = 0.1 lowers expected calibration error on the frozen CIFAR-10 test set without hurting accuracy.

## Change under test

C1: Cross-entropy with label smoothing ε = 0.1 instead of ε = 0; everything else as `E001_example-baseline`.

## Baseline

`E001_example-baseline`: top-1 93.12% ± 0.18 (3 seeds); ECE to be computed from its saved logits.

## Metrics and gate

M1: Expected calibration error (15 bins) on the frozen test set, mean over 3 seeds.
M2: Top-1 accuracy on the frozen test set, mean over 3 seeds.
G1: Pass if M1 drops by ≥ 20% relative to E001 (M1).
G2: Pass only if M2 stays within 0.3 pt of E001 (M2).

## Setup

| Item | Value |
| --- | --- |
| Config | `configs/E002_example-label-smoothing.yaml` |
| Launcher | `launchers/E002_example-label-smoothing.sh` |
| Code | TODO: git SHA at launch |
| Data | `cifar10` (sha256:e1f2a3…) |
| Frozen inputs | `cifar10_test_frozen` |
| Seeds | 1337, 1338, 1339 |
| Smoke test | `SMOKE=1 bash launchers/E002_example-label-smoothing.sh` |

## Open questions

::: card blocking-yes
#### Q1 — Compute E001's ECE from saved logits or re-run it? [!blocking Blocking]

- **Question:** Are E001's saved test logits enough to compute its ECE, or should E001 be re-evaluated?
- **Default if unanswered:** Recompute ECE from the saved logits; no new training run.
:::

## Assumptions

::: card risk-low
#### A1 — ε = 0.1 is the standard setting [!pending Pending]

- **Assumption:** ε = 0.1 is the value used by the cited papers, so no sweep is needed for this card.
- **Impact if wrong:** A follow-up card sweeps ε; this card's verdict still stands for ε = 0.1.
:::

## Plan

1. [ ] T1: Build config and launcher — Only after the card is approved.
2. [ ] T2: Smoke test passes locally — `SMOKE=1 bash launchers/E002_example-label-smoothing.sh`.
3. [ ] T3: Hand over the cluster run — 3 seeds, ≤ 2 GPU-h.
4. [ ] T4: Analyze against G1 and G2 — Skeptic pass before proposing a verdict.
5. [ ] T5: Verdict confirmed — Notebook entry and registry row updated.

## Runs

None yet.

## Results

Pending — run not returned.

## Skeptic

Not run yet.

## Verdict

Pending.

## Follow-ups

None yet.
