---
name: research-workflow
description: Run the Research Driven Development (RDD) experiment loop. Use when starting, designing, launching or analyzing an experiment, writing an infra-spec or analysis report, or when AGENTS.md says a task follows RDD.
argument-hint: "[experiment-id-or-task-description]"
---

# RDD workflow

The central artifact is the **experiment card**: one markdown file, `experiments/<ID>/card.md`, holding the whole experiment in sections. The loop has two human gates (⛔).

## Supporting files

Read the one you need before acting:

- `workflow.md` — the loop, step by step.
- `classification-policy.md` — infrastructure / experiment / analysis.
- `experiment-state-machine.md` — card statuses and who may move them.
- `doc-format.md` — templates, rendering, review feedback, conciseness, markdown conventions.
- `skeptic-checklist.md` — before proposing a verdict.
- `examples.md` — worked examples.
- `templates/docs/` — document templates; `templates/render/` — the page renderer's assets.

## Core rules

1. **Classify first.** Infrastructure → `infra-spec` + tests. Experiment → this loop. Analysis → cited report.
2. **Markdown is the source; the page is rendered.** Write `.md` from `templates/docs/`, render with `sh scripts/render.sh <file>`, never edit the HTML. The researcher reviews on the page and hands back `<name>.feedback.md` (`doc-format.md`).
3. **One change per card; gate declared before launch.**
4. **No config, launcher or run before card approval (⛔ gate 1).** Smoke test passes locally before any expensive or cluster launch.
5. **Results only from real outputs.** Every run logged in the card's Runs table, failures and negatives included.
6. **The agent proposes the verdict; the researcher confirms it (⛔ gate 2).** The agent never declares a gate passed.
7. **Concise.** Summary ≤ 3 sentences, one sentence per item, each fact once (`doc-format.md` § Conciseness).

## Standard execution

1. Identify the task (the skill argument). If empty, pick the next eligible card from `experiments/registry.json`: an `approved` card awaiting launch, a `launched` card whose `results/<ID>/` now has outputs, or a card with a pending `card.feedback.md`.
2. Classify it.
3. Experiment: draft the card, add the registry record (`draft`), render, ⛔ stop for approval.
4. After approval: config, launcher, smoke test; launch within budget or hand over; `launched`; wait.
5. Results in: verify against the gates, skeptic pass, fill Results, propose the verdict, `analyzed`, render, ⛔ stop for confirmation.
6. Confirmed: notebook entry, registry row, `done` (or `failed`); re-render.

## State lives in artifacts

`registry.json` is the status source of truth; the card's frontmatter mirrors it; `NOTEBOOK.md` carries the narrative. After any resume or compaction, reconcile the registry and cards against `results/` — artifacts win (`reference/session-recovery.md`). Before stopping, run the `closing` skill.
