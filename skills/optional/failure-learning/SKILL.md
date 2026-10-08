---
name: failure-learning
description: Turn a real research mistake (wrong prior, leaked split, unseeded run, metric shopping) into a reusable lesson. Drafts a structured entry and proposes where it should live. Never writes memory without approval.
---

# Failure learning

## Purpose

Convert meaningful mistakes into durable, reusable lessons so the project (and
future sessions) don't repeat them. Implements `reference/memory-policy.md` for
research errors.

## Research failure examples this catches

- A **leaked split** (train/eval overlap; tuning on the frozen test set).
- An **unseeded run** that can't be reproduced.
- **Metric shopping** (gate criteria changed after seeing results).
- A **wrong prior** or unfair baseline that invalidated a comparison.
- A **silently mutated** eval set discovered late.

## When to use

- After a mistake that cost real time or invalidated a result.
- When the same error has recurred.
- When the skeptic surfaces a systemic issue worth remembering.

## When not to use

- Trivial slips with no future lesson; unconfirmed speculation; anything with
  secrets or sensitive data.

## Procedure

1. Draft an entry from `entry-template.md` (copied from
   `templates/memory/failure-learning-entry.md`): title, date, scope, trigger,
   what went wrong, root cause, rule to remember, where to apply / not apply,
   source card/experiment.
2. **Show the exact text and ask where it should live:**
   ```
   1. Yes, global memory.
   2. Yes, project memory only (decision log).
   3. No, keep it only in the card / notebook.
   4. Revise the wording first.
   ```
3. Write only where the researcher chose. Global memory only on explicit choice,
   and only if genuinely project-independent.
4. If load-bearing, also propose an `AGENTS.md` hard rule.

## Output artifact

A failure-learning entry in the chosen location (decision log preferred), or
nothing if the researcher declines.

## Safety constraints

- **Never write global memory without explicit approval of the exact text.**
- Never store secrets or sensitive/embargoed data in any memory layer.
- The advisory hook may *suggest* running this skill; it never writes memory.
