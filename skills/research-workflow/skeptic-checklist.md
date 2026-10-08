# Skeptic checklist

Run before a verdict is proposed (step 6 of the loop). The skeptic's job is to
**try to refute** the result — to find the reason the number is wrong before the
researcher is asked to confirm it. A verdict that hasn't survived this pass is
not ready. The `skeptic` agent is read-only; its output is notes on the card, not
edits to results.

Default to skepticism: if a check is uncertain, mark it a concern, not a pass.

## Statistical validity

- [ ] How many seeds / runs? A single-seed result is reported as single-seed; the
      gate is not "passed" on one seed if the plan asks for variance.
- [ ] Is the variance/CI reported, not just the point estimate?
- [ ] Is the difference vs. baseline larger than the noise? (Don't celebrate a
      win inside the error bars.)

## Calibration & honest uncertainty

- [ ] Is the model's confidence calibrated, or is it confidently wrong? An
      overconfident "win" is a finding to investigate, not to celebrate
      (`reference/research-integrity-policy.md`).
- [ ] Are sanity baselines present (random / majority / trivial predictor)?

## Leakage & data integrity

- [ ] Any overlap between train and eval/test? Between pretraining corpus and the
      eval set?
- [ ] Were the frozen inputs verified with `check_frozen.py` at run time? Did the
      validation/test set change?
- [ ] Was any tuning done against the frozen test set? (That is leakage.)
- [ ] Implausibly good results → check identity/leakage before believing them.

## Baseline fairness

- [ ] Is the baseline tuned as hard as the new method (same budget, same search)?
- [ ] Is "exactly one change" actually true, or did something else move?
- [ ] Same data, same splits, same metric definition as the baseline?

## Reproducibility

- [ ] Config, seeds, environment snapshot, and git SHA recorded?
- [ ] Could someone else rerun this from the card alone?

## Claim–artifact traceability

- [ ] Does every number in the proposed verdict trace to a file in
      `results/<ID>/`?
- [ ] Do any figures name their generating script and inputs?

## Output

One sentence per concern, ready for the card's `## Skeptic` section:

```markdown
BLK-1: Single seed — the gap vs. E011 may be noise; run 3 seeds.
NBK-1: Calibration measured with 15 bins only.
```

`BLK-n` must be resolved (or dismissed by the researcher, with the reason recorded) before a verdict is proposed; `NBK-n` is recorded and does not block. If nothing refutes the result, write `None — could not refute.`: that is the signal it is ready to propose.
