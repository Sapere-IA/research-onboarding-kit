# Compute-budget policy

Compute is the scarce, costly, often shared resource in research. A bug
discovered after a three-day run on a contended cluster queue is expensive twice
— the wasted GPU-hours and the wasted wall-clock. This policy keeps compute
spend deliberate: every expensive run is budgeted in advance, smoke-tested
before it queues, resumable when it runs, and tracked against its budget after.

## Budgets live on the card

Every experiment card declares a compute budget **before** launch: GPU-hours (or
CPU-hours), wall-clock, and any queue/partition limits. The budget is part of
the approval the researcher gives at the card-approval gate — approving the card
approves the spend.

- A run that would exceed its declared budget does not silently continue; it
  **returns to the researcher** with what it has so far and an estimate of what
  finishing would cost.
- Per-month or per-project budgets (from `decisions/answers.md`) bound the sum;
  when a new experiment would blow the monthly budget, that is a planning
  decision, not the agent's call.

## Smoke test before the queue

No expensive job is submitted until a **smoke test** has passed on the local
machine. The smoke test is the smallest run that proves the job will not crash:
a tiny-sample overfit, one step, one batch, a CPU-sized configuration — whatever
exercises the full code path cheaply. The card records the smoke-test command
and the date it passed; the launcher template wires it in.

- If the project has not defined what its smoke test is, that is a TODO gate:
  the reviewer blocks cluster submissions until a smoke-test definition exists
  (`questions.md` §14).
- The smoke test catches the cheap failures (shape mismatches, missing files,
  typos in the config, bad paths) before they cost queue time.
- A passing smoke test is a precondition recorded on the card, not a verbal "I
  ran something small once".

## Resumable by design

Long jobs checkpoint and accept a `--resume` flag, so preemption, time limits,
or crashes cost the time since the last checkpoint, not the whole run. The
launcher carries the checkpoint directory and resume convention. Resumability is
also a reproducibility property (`reference/reproducibility-policy.md`): a job
that resumes from a checkpoint can be restarted from one to verify a stage.

## Track actual vs budgeted

After a run, the card records **actual** cost next to the budgeted cost. This is
not bureaucracy — systematic underestimates are how projects run out of compute
mid-quarter. The registry can surface the running total; large overruns are
worth a notebook note and, if they change the plan, a decision entry.

## The implement / run split

In research the expensive step often runs **outside the agent's session** — on a
cluster, over days, launched by a human. The kit treats "implement" and "run" as
separable:

- The agent prepares runnable, resumable artifacts (config + launcher + passing
  smoke test) and hands over the **exact submission command** and the expected
  output artifacts.
- The human submits; the agent marks the card `launched` and **waits** — it does
  not fabricate results or write "expected" numbers into the card.
- When results return, the agent analyzes them. The `launched` status is the
  synchronization point across sessions (`reference/session-recovery.md`).

The `cluster-ops` pack holds the project-specific scheduler recipe (real
`sbatch`/`squeue`/partition/module-load commands, data-staging paths, the
hand-over format). Unknown values are TODOs, never invented.

## What the agent may and may not do

The agent **may**, without asking: run smoke tests and cheap local jobs within a
stated budget; estimate costs; prepare configs and launchers.

The agent **must ask** before: launching expensive or long compute; anything that
spends money (paid cloud, paid API quota); exceeding a declared budget. These
are on the human-gate list in `reference/human-in-the-loop-policy.md`, and they
hold under autonomy too (`reference/autonomy-policy.md` — an autonomous loop
gets no extra compute permission).
