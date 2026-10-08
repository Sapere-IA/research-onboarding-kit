---
name: reproducibility-audit
description: Verify that a finished experiment can be rerun from its artifacts alone. Use before submitting a paper, or when a result needs to be trusted months later.
---

# Reproducibility audit

## Purpose

Take a finished card and confirm it meets the bar of
`reference/reproducibility-policy.md`: a colleague (or you in six months) can
reproduce its headline number from the artifacts alone.

## When to use

- Before a paper submission, for every card whose result the paper cites.
- When a result is about to become load-bearing (a baseline others build on).
- When inheriting someone else's experiments.

## When not to use

- On a `draft`/`approved` card (nothing has run yet).
- As a reason to rerun expensive compute casually — reruns are human-gated.

## Procedure

Work the checklist for the target card:

1. **Config** — one config fully specifies the run; its path is on the card.
2. **Seeds** — all recorded; determinism flags noted; residual nondeterminism
   stated.
3. **Environment** — a snapshot exists for the run (incl. git SHA);
   `capture_environment.py` output is referenced.
4. **Data** — referenced by hash/version; run `python scripts/check_frozen.py`
   for frozen inputs and confirm green.
5. **Figures** — each names its generating script and inputs and regenerates from
   them.
6. **Resumability** — the run resumes from its last checkpoint, or the card states
   why not.

Produce an **audit report** (`reports/repro-<ID>.md` from
`<harness-dir>/skills/research-workflow/templates/docs/analysis.md.template`; table cells `!ok` / `!blocking`): per-item
pass/fail, what's missing, and the exact fix for each gap. Render it with
`sh scripts/render.sh`.

## Output artifact

A reproducibility audit report listing each requirement as pass/fail with
remediation; gaps flagged before the paper proceeds.

## Safety constraints

- Verifying provenance never exposes secrets — env vars by name only.
- A failed audit blocks the claim, not the paper's other work; report honestly.
- Do not rerun expensive compute to "prove" reproducibility without approval.
