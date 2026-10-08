---
doc: notebook
title: Lab notebook — Example RDD project
---

<!-- Kit reference example. Not installed into target projects. -->

## Resume here

- **Updated:** 2026-06-13
- **Active:** `E002_example-label-smoothing` (`draft`) — waiting for card approval (⛔ gate 1).
- **Next action:** apply the supervisor's `card.feedback.md`, then build the config and launcher.
- **Waiting on:** card approval; answer to Q1.
- **Uncommitted work:** none.

## Entries

### 2026-06-13 — E002_example-label-smoothing — card drafted

Label smoothing (ε = 0.1) against E001; gate on calibration (ECE) with accuracy held. Rendered for review: [card](../experiments/E002_example-label-smoothing/card.html).

### 2026-06-12 — E001_example-baseline — verdict confirmed (pass)

3 seeds: 93.12% ± 0.18 top-1, within 0.5 pt of the published 93.0%. The skeptic could not refute; the supervisor confirmed. Phase 2 may now compare against E001. [card](../experiments/E001_example-baseline/card.html)

### 2026-06-11 — E001_example-baseline — launched

Smoke test (100-sample CPU overfit) passed locally; SLURM job 88123, 3 seeds. No numbers recorded until the run returns.

### 2026-06-10 — Harness installed, E001 drafted

First card is a baseline reproduction, approved by the supervisor before any run. CIFAR-10 test set frozen in the manifest.
