---
name: experiment-registry
description: Maintain experiments/registry.json (and its rendered registry.html dashboard), the ID/superseding conventions, and the validate_registry wiring. Use when registering, updating, or auditing experiments.
---

# Experiment registry

## Purpose

Keep `experiments/registry.json` (the machine-readable source of truth) accurate
and consistent with the cards (`experiments/<ID>/card.md`) and `results/`
directories. The dashboard `experiments/registry.html` is **rendered** from it
(`sh scripts/render.sh experiments/registry.json`) — never hand-edited.

## When to use

- Registering a new experiment (a card moves to `draft`).
- Updating a record on any status change (approved/launched/analyzed/done/failed).
- Auditing consistency, or reconciling after time away.

## When not to use

- As a substitute for an existing experiment tracker (W&B/MLflow) — the registry
  *complements* it; it does not replace run-level logging.

## ID & superseding conventions

- IDs follow `E<seq>_<slug>` (or the project convention in `decisions/answers.md`);
  the same ID is used on the card, config, launcher, `results/`, and the record.
- A re-run varying the same axis gets a **new** record (`E12_<slug>__v2`) with
  `supersedes` set to the original. Completed cards are not edited.

## Procedure

1. On a status change, update **both** the card's frontmatter (`status`,
   `gate_result`, `smoke_passed`) and the `registry.json` record (plus
   `actual_cost`, `code_version`); re-render the card and the registry.
2. Run `python scripts/validate_registry.py`; fix or flag every reported
   inconsistency.
3. Reconcile `launched` records against `results/<ID>/` — artifacts win
   (`reference/session-recovery.md`).
4. Keep the schema in `templates/experiments/README.md`; don't add fields ad hoc.

## Output artifact

An updated `registry.json`, validated green, and a re-rendered `registry.html`.

## Safety constraints

- Never fabricate a record for a run that didn't happen.
- Never mark `done` while results are missing or the gate is `pending`.
- The registry records state; it never confirms a verdict (that's the human gate).
