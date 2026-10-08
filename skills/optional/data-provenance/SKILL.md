---
name: data-provenance
description: Maintain dataset cards (origin, license, processing, hashes, sensitivity class) and the procedure for when data changes. Use when adding, processing, or documenting a dataset.
---

# Data provenance

## Purpose

Know exactly what data the project uses, where it came from, what may be done
with it, and that it hasn't silently changed. Supports the reproducibility and
frozen-artifacts policies.

## When to use

- Adding a new dataset or a processed derivative.
- Documenting an existing dataset's origin/license/sensitivity.
- When data changes (a new release, a reprocessing step).

## When not to use

- For transient scratch outputs that aren't inputs to any experiment.

## Procedure

1. Create a **dataset card** per dataset:
   - origin (source, URL/DOI, version/date),
   - license and **sensitivity class** (open / restricted / embargoed / PII),
   - processing steps (how raw → used; the script that did it),
   - content hash and size; whether it is **frozen**.
2. If frozen (eval set, split, benchmark), register it in
   `data/frozen-manifest.json` and record the checksum with
   `python scripts/check_frozen.py --write`
   (`reference/frozen-artifacts-policy.md`).
3. Record what must **never** be uploaded/printed/committed (from
   `decisions/answers.md`).
4. On a data change: do **not** mutate a frozen artifact — create a new
   version with a new ID and a decision entry; update the dataset card.

## Output artifact

Dataset cards (`docs/data/<dataset>.md` from `<harness-dir>/skills/research-workflow/templates/docs/doc.md.template`,
rendered with `sh scripts/render.sh`) and, for frozen data, manifest entries with
checksums.

## Safety constraints

- Never write sensitive/embargoed data or PII into any artifact, card, or memory
  — reference by ID/hash only (`reference/memory-policy.md`).
- Never upload or share data without approval.
- Mutating a frozen dataset is forbidden; replacements get new names + a decision.
