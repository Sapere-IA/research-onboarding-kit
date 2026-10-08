# Research integrity policy

Research code fails differently from product code. A feature either works or it
doesn't; an experiment can produce a number that is *wrong in a way that looks
right*. The expensive failures in research — the ones that cost months — are
almost never crashes. They are a silently corrupted validation set, a metric
chosen after seeing the results, a baseline that was never fair, a "win" that
was really a leak. This policy exists to make the honest path the cheapest path,
so that the structure of the work resists those failures by default.

The kit enforces integrity through artifacts, not interrogation. The experiment
card, the registry, and the notebook are pre-structured so that logging the
truth is less effort than hiding it.

## The non-negotiable rules

### 1. Every run is logged — including failures and negative results

A run that crashed, diverged, underperformed, or refuted the hypothesis is a
**result**, not an embarrassment to delete. It goes in the card's Results
section and the registry with an honest verdict (`failed`, or `done` with a
negative finding). Silently re-running until a seed "works" and reporting only
that seed is p-hacking; the kit treats deletion of inconvenient runs as the
integrity violation it is.

- The registry row exists from `launched` onward, before the outcome is known.
- Negative results get the same write-up discipline as positive ones.
- If a run is discarded, the card records *why* (e.g. "OOM at epoch 3, config
  fixed in E014") — discarding is logged, not invisible.

### 2. Gate criteria are declared before launch, never after

The metrics and the pass/fail threshold for an experiment are written into the
card **before** the run is launched (the card moves to `approved` with the gate
filled in). Looking at the results and then deciding what counts as success is
metric shopping. If the declared gate turns out to be wrong, you may change it —
but only by recording a dated decision (`decisions/`) that says what changed and
why, leaving the original gate visible. The card's design section is
append-only after approval; corrections append, they do not overwrite.

### 3. Claims trace to artifacts

Every quantitative claim — in an analysis report, a figure caption, a paper
sentence — names the experiment card ID or dataset ID it comes from. A number
with no traceable source is not allowed to stand. At write-up time the
`paper-trail` pack makes this a table (claim → card → artifact); even without
it, the rule holds: if you cannot point to the run that produced a number, you
cannot publish the number.

### 4. Honest uncertainty is first-class

A model that "wins" with suspicious confidence is a finding to **investigate**,
not to celebrate. Calibration checks, seed variance, and sanity baselines are
part of the verdict, not optional extras:

- A single-seed result is reported as single-seed; the gate is not "passed" on
  one seed when the plan asks for variance estimates.
- A result that beats the baseline by implausible margins triggers a
  leakage/identity check before it is believed.
- "We don't know yet" is a legitimate verdict (`inconclusive`); the kit provides
  the cell for it precisely so nobody rounds uncertainty up to success.

### 5. The skeptic runs before the verdict, not after

The `skeptic` agent's job is to *try to refute* the proposed verdict —
statistical validity, calibration, data leakage, baseline fairness,
claim–artifact traceability — before the researcher is asked to confirm it. A
verdict that has not survived an adversarial pass is not ready to propose.

## What this looks like in the loop

| Moment | Integrity action |
|---|---|
| Card drafted | Exactly one change under test; metrics + gate written down |
| Card approved (⛔) | Gate is now frozen for this run; changing it later needs a logged decision |
| Launched | Registry row created immediately; no "expected results" pre-filled |
| Results in | Real outputs only; failures and negatives recorded the same as wins |
| Verdict proposed | Skeptic has tried to refute it; calibration/variance/leakage checked |
| Verdict confirmed (⛔) | Researcher confirms; significant outcomes propose a decision-log entry |

## Boundaries

- This policy governs honesty of process, not the science itself — it does not
  tell you which hypothesis is right, only that you must report what actually
  happened.
- It never asks you to expose raw sensitive data to prove a point; claims trace
  to artifact **IDs and paths**, not to pasted private content (see
  `reference/frozen-artifacts-policy.md` and the data-sensitivity answers in
  `decisions/answers.md`).
- The agent proposes verdicts and decision entries; it never declares a plan gate
  passed on its own (see `reference/human-in-the-loop-policy.md`).

---

*Distilled from a real case: a project that lost ~6 months to simultaneous
untested changes, a silently corrupted validation set, and checkpoint selection
keyed to it. When in doubt about a rule's value, check it against that story.*
