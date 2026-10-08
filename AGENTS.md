# Instructions for coding agents working inside this kit

This repository is the research-onboarding-kit: it installs a Research Driven Development (RDD) harness into another repository. It is not a target project. These instructions apply to any coding agent (Claude Code, Codex, Cursor, OpenCode, Antigravity or another harness).

## Installing RDD into a project

1. Read `instructions.md`, then `questions.md`, then `output-project-structure.md`.
2. Use `templates/`, `agents/`, `skills/`, `hooks/`, `mcps/` and `scripts/` as source material.
3. Generate the project's own `AGENTS.md` from `templates/AGENTS.md.template` (plus the `CLAUDE.md` import stub from `templates/CLAUDE.md.template` when Claude Code is used). This file is not the project's instruction file.
4. Map the reference layout (`.claude/`) to the harness being installed with `reference/harness-primitives.md`.
5. Ask before enabling hooks, configuring MCPs, changing git policy, or assuming commands, metrics, budgets or frozen artifacts.

## Changing the kit

1. If `todolist.md` exists (gitignored, local-only), it lists the tasks; otherwise ask what to change. If `bugs.md` exists, check its bugs are fixed. Tick what you complete.
2. Keep installable files (agents, skills, templates, policies) harness-neutral: harness names and commands only inside per-harness tables.
3. Human-facing documents are markdown rendered by `scripts/render.sh` / `scripts/render.ps1` (keep them in sync) with the assets in `templates/render/`. After changing the renderer or an example, re-render the examples: `sh scripts/render.sh experiments notebook experiments/*/`.
4. Hook scripts keep the shared adapter block byte-identical (`hooks/hooks-policy.md`).
5. A release bumps `VERSION` and adds a `CHANGELOG.md` entry with **Changes** and **Migration** (the `rdd-update` skill executes the migration steps).
6. After adding, renaming or deleting files, run `scripts/update-manifest.sh`.
