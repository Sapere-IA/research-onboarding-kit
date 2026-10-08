---
name: cluster-ops
description: The project's real cluster recipe — scheduler commands, partitions, module loads, data staging, resume procedure, and the hand-over format. Use when launching, monitoring, or resuming jobs on the cluster.
---

# Cluster ops

> **Generated, project-specific.** This file is filled from the project's answers
> (`questions.md` §C7) during onboarding (like the SDD kit's `run-and-verify` pack).
> Unknown values are recorded as `TODO: ask the researcher` — **never invented**.

## Purpose

Hold the real commands for running jobs on this project's cluster, so launches
are correct and reproducible and the implement/run split stays coherent across
sessions (`reference/compute-budget-policy.md`).

## When to use

- Building a launcher for a cluster job.
- Handing a job over to the human to submit.
- Monitoring or resuming a running/preempted job.

## When not to use

- For cheap local runs within budget (those don't need the scheduler).
- To submit a job autonomously — expensive launches are human-gated
  (`reference/human-in-the-loop-policy.md`, `reference/autonomy-policy.md`).

## Project recipe (fill during onboarding)

```text
Scheduler:        {{SCHEDULER}}            # SLURM / HTCondor / … / TODO
Submit:           {{SUBMIT_COMMAND}}       # e.g. sbatch launchers/<ID>.sh / TODO
Queue status:     {{STATUS_COMMAND}}       # e.g. squeue -u $USER / TODO
Cancel:           {{CANCEL_COMMAND}}       # e.g. scancel <jobid> / TODO
Partitions:       {{PARTITIONS}}           # names + limits / TODO
Account/QOS:      {{ACCOUNT}}              # / TODO
Module loads:     {{MODULE_LOADS}}         # e.g. module load cuda/12.4 / TODO
Env activation:   {{ENV_ACTIVATION}}       # e.g. conda activate proj / TODO
Data staging:     {{DATA_STAGING}}         # scratch paths, copy-in steps / TODO
Walltime limits:  {{WALLTIME_LIMITS}}      # / TODO
Resume procedure: {{RESUME_PROCEDURE}}     # how --resume + checkpoints work here
```

## Hand-over format

When a job must be submitted by the human:

1. Confirm the smoke test passed locally (`smoke_passed` recorded).
2. Give the **exact** submission command and the output artifacts it will create
   (`results/<ID>/...`).
3. Ask the human to paste back the **job ID** (or "done").
4. Set the card's frontmatter and registry status to `launched`, log the job in
   the card's **Runs** table, and **wait** — no fabricated results. The `launched` status is the cross-session sync point.

## Output artifact

A correct launcher + a hand-over note; status moved to `launched`.

## Safety constraints

- Never invent scheduler commands, partitions, or limits — TODO if unknown.
- Never submit expensive/paid jobs autonomously or without approval.
- Never store cluster credentials in any file.
