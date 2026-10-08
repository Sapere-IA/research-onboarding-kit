# Examples

Short worked examples of the loop. Illustrative — adapt to the project.

## Example 1 — a clean experiment

> Researcher: "Try freezing the encoder and see if calibration improves."

1. **Classify** → experiment (one change, a metric, a baseline).
2. **Draft** `experiments/E012_frozen-encoder/card.md`: H1 (freezing improves OOD
   calibration without hurting accuracy); C1 = `encoder.requires_grad=False`, all
   else as `E011`; baseline `E011`; M1 accuracy, M2 ECE; G1 "M2 down ≥ 20%
   relative", G2 "M1 within 0.5 pt". Registry record `draft`; render the card.
3. ⛔ The researcher reviews `card.html`, changes G1 to 15% and approves in the
   same feedback file. Because the feedback changed the card, the agent applies
   it, re-renders and asks again; the second file approves with no changes →
   `approved`, gates frozen.
4. Build `configs/E012_frozen-encoder.yaml`, `launchers/E012_frozen-encoder.sh`;
   smoke test (100-sample CPU overfit) passes → `smoke_passed` + Runs row R1.
5. Cluster job → hand over `sbatch launchers/E012_frozen-encoder.sh`; the
   researcher pastes back the job ID → Runs row R2, `launched`; **wait**.
6. Results land in `results/E012_frozen-encoder/`. Skeptic: `BLK-1: one seed —
   variance unverified` → run 3 seeds (Runs R3) and re-check. Fill Results,
   propose "pass on G1 and G2", `analyzed`, render.
7. ⛔ The researcher confirms the verdict on the page → `done`, `gate_result: pass`.
8. Notebook entry, registry row (`actual_cost`), re-render card and registry.

## Example 2 — classification catches plumbing

> Researcher: "Make a clean held-out validation split."

→ **Infrastructure**, not an experiment: write an `infra-spec` (contract: input
data → split with recorded seed; acceptance tests: sizes, no overlap,
determinism), implement, tests pass. Then register the split in the frozen
manifest with its checksum (`reference/frozen-artifacts-policy.md`). No card.

## Example 3 — a negative result is still a result

> A run underperforms the baseline.

The card records the real numbers and a `fail`/negative verdict; it is **not**
deleted or silently re-run until a seed "works". The notebook logs it; if it
settles something ("approach X doesn't help here"), propose a
`rejected-options.md` entry. This is the anti-p-hacking rule in action.

## Example 4 — the human runs the job, days pass

After resuming a session: a card is `launched`. Check `results/E012/` — outputs
are there now (the run finished while away). Reconcile: the card is really ready
for analysis even though the chat said "waiting". `validate_registry.py` would
flag the mismatch. Artifacts win — proceed to step 6
(`reference/session-recovery.md`).
