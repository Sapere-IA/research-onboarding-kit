# Task classification

Step 1 of the loop. Every task is one of three types; the type decides the path.
Misclassifying is the common early mistake — an "experiment" that is really
plumbing should take the infra path, and a "card" that needs a traceability
matrix is probably infrastructure.

## The three types

### Infrastructure task → mini-SDD path
Code whose job is to be correct, not to test a hypothesis: data pipelines,
loaders, evaluation harnesses, metric implementations, plotting libraries,
training-loop scaffolding, cluster glue.

- Path: write `specs/<module>/spec.md` (`infra-spec.md.template`) — contract,
  requirements, acceptance tests, out of scope — **before** code;
  tests must pass before `done`. Ordinary software discipline.
- Signal: "does it work / is it correct?" is the question, not "is the hypothesis
  true?".

### Experiment → the card loop
A test of a hypothesis with exactly one change under test, a baseline, and a
declared gate.

- Path: the experiment card and the full loop (`workflow.md`), two ⛔ gates.
- Signal: there is a metric, a baseline, and a result that could come out either
  way.

### Analysis / writing task → cited report
Interpretation of existing results: figures, tables, paper sections, summaries.

- Path: an analysis report (`reports/<slug>.md`, `analysis.md.template`) whose
  every quantitative claim cites a card or dataset ID. **Not** gated on the
  experiment loop — reading results, making plots, and exploring data stay
  friction-free (`reference/research-integrity-policy.md`: gates protect launches
  and claims, not analysis).
- Signal: no new run is needed; the inputs are existing artifacts.

## Quick decision

| If the task… | Type |
|---|---|
| produces or changes code that other experiments rely on | Infrastructure |
| tests one change against a baseline with a metric | Experiment |
| interprets results that already exist | Analysis / writing |
| creates a frozen artifact (eval split, reference checkpoint) | Infrastructure (+ frozen manifest entry) |
| needs more than one change to be tested at once | Split into multiple experiments |

## Edge cases

- **"Just try a quick run"** — still an experiment; even a quick run gets a card
  (it can be a short one), because unattributed runs are the failure mode RDD
  exists to prevent.
- **A run whose only purpose is to make a figure** — analysis, unless it requires
  a new training/eval run, in which case it's an experiment that feeds an
  analysis.
- **Refactoring experiment code** — infrastructure; the experiments that depend
  on it keep their cards.
