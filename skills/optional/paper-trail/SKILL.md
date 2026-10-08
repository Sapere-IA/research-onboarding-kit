---
name: paper-trail
description: Write-up support — build the claim→card→artifact table, figure provenance, the reproducibility statement, and the journal checklist. Use when drafting or checking a paper.
---

# Paper trail

## Purpose

Make every claim in the paper traceable to an artifact, and assemble the
provenance a venue expects. Enforces the claims-trace-to-artifacts rule
(`reference/research-integrity-policy.md`) at write-up.

## When to use

- Drafting paper sections that report results.
- Before submission: assembling figure provenance and a reproducibility statement.
- Checking a draft for untraceable numbers.

## When not to use

- To write the scientific narrative for the author — the agent drafts and traces;
  the author commits the claim (`reference/human-in-the-loop-policy.md`).

## Procedure

1. **Claim table** — for every quantitative claim in the draft, a row:
   `claim → card ID → artifact file → value`. A claim with no card is a stop:
   either find the run or remove the claim.
2. **Figure provenance** — each figure names its generating script and inputs
   (card IDs / result files); confirm it regenerates (`figure-style` /
   `reproducibility-policy.md`).
3. **Reproducibility statement** — assemble from the cards: configs, seeds, env,
   data versions/hashes, compute. Run `reproducibility-audit` for the cited cards.
4. **Journal/venue checklist** — fill the target venue's checklist
   ({{VENUE_CHECKLIST}} — set at onboarding); flag anything unmet.

## Output artifact

A claim→card→artifact table, figure-provenance list, reproducibility statement,
and a completed venue checklist — as an analysis report (`reports/paper-trail.md`).

## Safety constraints

- Never write a paper claim the agent cannot trace to a real artifact.
- Never overstate the reproducibility statement beyond what the cards support.
- Do not upload/submit anything; the author submits.
