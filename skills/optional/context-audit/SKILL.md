---
name: context-audit
description: Inspect and reduce the context-window usage of the current session. Use when a session has grown long, behavior degrades, after noisy log or results triage, or before starting an unrelated experiment in the same session.
---

# Context audit

## Purpose

Keep the context window healthy: audit what is loaded and recommend targeted cleanup, following `reference/context-economy.md`.

## When to use

- A long session where responses degrade or lose track.
- Before switching to an unrelated experiment or analysis.
- After a noisy investigation (training logs, a results directory, many files).
- The researcher asks "why is context full?".

## When not to use

- Short sessions with no symptoms — auditing costs context too.
- Mid-analysis of a returned run: reach a stable point (Results filled, card saved) first.

## Required inputs

- The active card's status and next step (`experiments/registry.json`, `card.md`) and any unresolved questions — these must survive compaction.

## Procedure

1. Inspect context usage with the harness's command (table in `reference/context-economy.md`); identify the dominant consumers (large logs, MCP toolsets, long outputs).
2. Decide: continue, compact, or start fresh.
3. **Before compacting, write anything durable to its artifact**: card sections (Runs, Results, Skeptic), registry status, notebook entry, decision proposals. Artifacts, not chat, are the source of truth.
4. Compact with focus instructions where the harness accepts them — preserve the approved gate (`G1`), card status and next step, discovered constraints (data quirks, leakage risks), and open questions.
5. Recommend subagents (`skeptic`, `literature-scout`, or a general explorer) for upcoming noisy exploration.

## Output artifact

None by default. If durable information lived only in chat, the output is the updated artifacts written before compaction.

## Safety constraints

- Never discard unresolved questions, unlogged runs, or unrecorded decisions by compacting.
- Inspect and advise only; no memory or global-configuration writes.
