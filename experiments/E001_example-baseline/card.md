---
doc: card
title: E001_example-baseline — Reproduce the published CNN baseline
experiment_id: E001_example-baseline
status: done
gate_result: pass
plan_ref: PLAN.md § P1
supersedes: none
approver: supervisor
budget: 2 GPU-h
smoke_passed: 2026-06-11
---

<!-- Kit reference example (illustrative numbers). Not installed into target projects. -->

## Summary

Reproduce the published ResNet-20 CIFAR-10 result (93.0% top-1) in our pipeline before any new experiment. It passes if the 3-seed mean is within 0.5 pt of the paper.

## Hypothesis

H1: Our pipeline reproduces the published ResNet-20 CIFAR-10 baseline, so later cards have a trustworthy reference.

## Change under test

C1: None — a baseline reproduction; the published recipe is ported unchanged into our pipeline.

## Baseline

Published: 93.0% top-1 (paper, Table 1). This card becomes the in-house baseline later cards compare against.

## Metrics and gate

M1: Top-1 accuracy on the frozen CIFAR-10 test set, mean over 3 seeds.
G1: Pass if the M1 mean is ≥ 92.5% (within 0.5 pt of the published 93.0%).

## Setup

| Item | Value |
| --- | --- |
| Config | `configs/E001_example-baseline.yaml` |
| Launcher | `launchers/E001_example-baseline.sh` |
| Code | `a1b2c3d` (clean) |
| Data | `cifar10` (sha256:e1f2a3…) |
| Frozen inputs | `cifar10_test_frozen` — `check_frozen.py` green |
| Seeds | 1337, 1338, 1339 |
| Smoke test | `SMOKE=1 bash launchers/E001_example-baseline.sh` |

## Plan

1. [x] T1: Build config and launcher — After approval on 2026-06-10.
2. [x] T2: Smoke test passes locally — 100-sample CPU overfit, 2026-06-11.
3. [x] T3: Hand over the cluster run — `sbatch launchers/E001_example-baseline.sh`, job 88123.
4. [x] T4: Analyze against G1 — Skeptic could not refute.
5. [x] T5: Verdict confirmed — Supervisor, 2026-06-12.

## Runs

| Run | Date | Command / job | Outcome | Notes |
| --- | --- | --- | --- | --- |
| R1 | 2026-06-11 | `SMOKE=1 bash launchers/E001_example-baseline.sh` | !ok finished | Smoke test, local CPU |
| R2 | 2026-06-11 | SLURM job 88123 (3 seeds) | !ok finished | 1.7 GPU-h actual |

## Results

| Metric | Published | This run (mean ± sd) | Gate | Verdict |
| --- | --- | --- | --- | --- |
| M1 | 93.00% | 93.12% ± 0.18 | ≥ 92.5% | !ok pass |

Artifacts: `results/E001_example-baseline/metrics.json`, training curves in the same folder.

## Skeptic

NBK-1: The +0.12 pt gap is inside the seed noise (sd 0.18): a reproduction, not an improvement.
NBK-2: No train/test overlap; the test set is frozen and unchanged; model selection used a separate validation split.

## Verdict

Proposed: [!ok pass] — the 3-seed mean (93.12%) is within 0.5 pt of the published 93.0%.
Confirmed: [!ok confirmed] — supervisor, 2026-06-12.

## Follow-ups

- Phase 2 cards compare against E001 (e.g. `E002_example-label-smoothing`).
- Decision candidate: "E001 is the canonical CIFAR-10 baseline" → `decisions/architecture-decisions.md`.
