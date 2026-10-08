---
name: project-map
description: Generate or refresh the project map artifact. Use after significant repository structure changes (new data/results/model directories, moved entrypoints, changed commands) or when the map is missing or stale.
---

# Project map

## Purpose

Create or update the project map — the concise orientation artifact (default `<harness-dir>/context/project-map.md`) that tells the agent where code, data, configs, results and frozen artifacts live without loading many files. Onboarding generates the first map; this pack refreshes it.

## When to use

- The map does not exist (generation was deferred at onboarding).
- A top-level or load-bearing directory was added, renamed, or removed (data, checkpoints, results, `paper/`).
- An entrypoint moved, or environment/test/smoke/submit commands changed.
- A new frozen artifact, protected baseline, or sensitive-data path appeared.
- The map demonstrably disagrees with the repository.

## When not to use

- Routine file additions inside existing directories (a new card, a new results folder).
- As a substitute for reading the actual code when building run artifacts.

## Required inputs

- The existing map, or the template (`templates/project-map.md.template` in the kit).
- Repository inspection: tree (depth 2–3), environment files, scripts, launchers, CI config, docs; `data/frozen-manifest.json`.
- The protected/frozen areas and sensitive-data rules in `AGENTS.md`.

## Procedure

1. Inspect the repository (delegate to a subagent if the survey is large; never open large data or checkpoint files).
2. Fill or update the map's sections: tree, planned dirs, entrypoints and commands, protected/frozen areas, key external facts.
3. Keep it one to two screens; annotate, do not enumerate.
4. Record unknown commands as `TODO: ask the researcher` — never invent.
5. Verify `AGENTS.md` links the map at its configured location.

## Output artifact

The project map at its configured location (default `<harness-dir>/context/project-map.md`).

## Safety constraints

- Never record secrets, credentials, tokens, or sensitive/embargoed data — paths and IDs only.
- Do not change `AGENTS.md` beyond the map link without approval.
- If the map's location is unclear, ask instead of creating a second map.
