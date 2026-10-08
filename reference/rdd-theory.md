# Research Driven Development (RDD) — theory

RDD is the research analog of Spec Driven Development. SDD's central object is the
**feature spec**; RDD's central object is the **experiment**. The two share a
philosophy — project-specific generation, human-gated transitions, context
economy, local-first, artifacts over chat — but they target different failure
modes, because research code fails differently from product code.

This document explains *why* the kit is shaped the way it is. The operational
procedure lives in `skills/research-workflow/SKILL.md`; the rules live in the
`reference/` policies; this is the reasoning that ties them together.

## The failure modes RDD is built against

Product software fails by crashing or by not meeting a requirement. Research code
fails by producing a number that is *wrong in a way that looks right*. The
expensive failures cost months, not minutes, and they cluster:

| Failure mode in research code | Kit countermeasure |
|---|---|
| Many simultaneous changes; results unattributable | **One change per experiment**, enforced by the card |
| Evaluation data silently mutated / leaks / drifts | **Frozen-artifact policy** + manifest + advisory hook |
| No baseline; can't tell if anything improved | **Baseline & reproduction gate** before new experiments |
| Silent retries and cherry-picking (p-hacking) | **Every run logged**, including failures and negatives |
| Results not reproducible months later | **Config-as-spec, seeds, env capture, data versioning** |
| Working code replaced and lost | Protected `baseline/` reference implementations |
| Compute wasted on undebugged jobs | **Smoke-test policy** before cluster submission |
| Knowledge trapped in one head / one chat | Decision logs, lab notebook, recorded onboarding answers |
| Claims in the paper not traceable to artifacts | **Claim → experiment → artifact traceability** at write-up |

Every mechanism in the kit maps to a row here. When a rule's value is unclear,
trace it back to the failure it prevents.

## The experiment loop

RDD replaces SDD's spec loop (requirements → design → tasks → code → tests) with
the **experiment loop**, with two human gates (⛔):

1. **Classify** the task (infrastructure / experiment / analysis-writing).
2. **Draft the card** — hypothesis, exactly one change under test, baseline,
   metrics + gate criteria declared *now*, compute budget, artifacts to produce.
3. ⛔ **Researcher approves the card** — no config, launcher, or run before this.
4. **Implement run artifacts** — config (the machine-readable spec), launcher,
   and a **smoke test** that must pass locally first.
5. **Launch** — cheap locally within budget the agent may run; expensive/cluster
   work is handed over to the human, the card goes `launched`, and the agent waits.
6. **Collect & analyze** — verify real results against the declared gate; the
   skeptic tries to refute; every run logged, failures and negatives included.
7. ⛔ **Verdict confirmed** — the agent proposes, the researcher confirms; only then
   does a plan gate move and a decision get proposed.
8. **Scribe updates** the notebook and registry; a card is not `done` while its
   artifacts are missing or its registry row is stale.

The gates sit at the two places research goes expensively or dishonestly wrong:
**launching compute** and **making claims**. Everything else — reading,
analyzing, plotting, drafting, coding infrastructure, smoke-testing — stays
friction-free. *Do not gate analysis on process.*

## The implement / run split

A structural difference from SDD: the expensive step (training, simulation,
field/lab work) often runs **outside the agent's session** — on a cluster, over
days, launched by a human. So the kit separates "implement" from "run":

- The agent prepares runnable, **resumable** artifacts (config + launcher + passing
  smoke test) and hands over the exact submission command and expected outputs.
- The human executes; the agent marks the card `launched` and waits — no fabricated
  or "expected" results.
- The agent analyzes when results return.

The `launched` status is the synchronization point across sessions; after any
resume, state is reconciled against the `results/` directories
(`reference/session-recovery.md`). The harness must stay coherent across that
gap, which is why state lives in files, not chat.

## Unit-of-work taxonomy

Not every task is an experiment. Onboarding installs three work types:

1. **Infrastructure task** (pipelines, libraries, eval code) — ordinary software,
   gets ordinary software discipline: a short spec (module contract + acceptance
   tests) before code, tests must pass. This is the mini-SDD path.
2. **Experiment** (the core unit) — the experiment card and the loop above.
3. **Analysis / writing task** — produces a report or document whose every
   quantitative claim cites an experiment card or dataset by ID.

Classifying correctly is the first step of the loop: an "experiment" that is
really plumbing should take the infra path; a "card" that needs a traceability
matrix is probably infrastructure.

## Inherited principles (identical to SDD)

1. **Project-specific generation, never generic copying** — onboarding asks;
   missing decisions are asked, not assumed.
2. **Human-in-the-loop** — transitions that matter are human-gated; the agent
   proposes, the researcher approves.
3. **Context economy** — `AGENTS.md` stays short and links out; procedures live
   in skills; durable knowledge in artifacts.
4. **Local-first** — fully functional with no external MCP/CLI; external tools
   are optional, approval-gated, narrower-tool-preferred.
5. **Artifacts over chat** — work survives interruptions because state lives in
   files; after resume/compaction, artifacts win.
6. **Hooks advisory or blocking, never mutating/dangerous; disabled by default.**
7. **Memory discipline** — no global memory write without explicit approval of
   the exact text; no secrets or sensitive data in any layer.
8. **English canonical for kit files**; generated artifacts may use the
   project's language.

## The deliberate weight of the card

The experiment card is intentionally **heavier than a chat message and lighter
than an SDD spec**. It is enough for a research cadence — card + registry +
notebook — without the full traceability machinery of a product spec. Resist
adding matrices; if a task needs that much structure, it is infrastructure. The
card's job is to make the honest, reproducible path the cheapest one to follow.

---

*This kit was distilled from a real case: a project that lost ~6 months to
simultaneous untested changes, a silently corrupted validation set, and
checkpoint selection keyed to it.*
