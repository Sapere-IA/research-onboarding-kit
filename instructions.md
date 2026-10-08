# RDD onboarding instructions

You are installing **Research Driven Development (RDD)** into the current target repository, for one or more coding-agent harnesses (Claude Code, Codex CLI, Cursor, OpenCode, Antigravity, or another with fallbacks).

Install a project-specific harness. Do **not** run experiments or change research code during onboarding unless the researcher asks for that separately afterwards.

`<harness-dir>` below is the primary harness directory (`.claude/` for Claude Code; the mapping for every harness is in `reference/harness-primitives.md`). The kit's files use the Claude Code layout as the reference.

## Read first

1. `reference/rdd-theory.md`
2. `reference/research-integrity-policy.md`, `reproducibility-policy.md`, `human-in-the-loop-policy.md`, `compute-budget-policy.md`, `frozen-artifacts-policy.md`
3. `reference/harness-primitives.md`
4. `questions.md`, `output-project-structure.md`
5. `templates/AGENTS.md.template`
6. `agents/*.md`
7. `skills/research-workflow/SKILL.md`, `workflow.md`, `doc-format.md`
8. `hooks/hooks-policy.md`, `mcps/mcp-criteria.md`

If a file is missing, stop and say which.

## Phase 1 — Inspect the repository (change nothing)

- Harness(es) in use: the one running this onboarding; existing `.claude/`, `.codex/`, `.cursor/`, `.opencode/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`.
- Languages, environment manager (conda/venv/container), test runner.
- Where code runs (local/cluster/cloud), scheduler files (SLURM scripts, `*.sub`), GPU availability.
- Experiment tracker (W&B, MLflow, TensorBoard).
- Data layout, sizes, licenses, anything sensitive or embargoed.
- Prior baselines, checkpoints, `paper/`, citations.
- Existing plan, lab notebook, `docs/adr/`.
- Git branch and cleanliness.

Read existing files before overwriting anything. Draft answers for the **(auto)** questions.

## Phase 2 — Ask

Use `questions.md`. Offer the recommended defaults profile first; then ask only what you cannot infer, grouped by section. Record every answer in `decisions/answers.md`.

## Phase 3 — Generate the harness

Create or update, in this order:

1. **`AGENTS.md`** from `templates/AGENTS.md.template` — short and project-specific; hard rules from the answers; link the project map, never embed a tree. Fill `{{HARNESS_DIR}}`, `{{SKILL_INVOCATION}}`, `{{CONTEXT_COMMANDS}}` and `{{HARNESS_NOTES}}` (fallbacks for missing skills/subagents) from `reference/harness-primitives.md`; `{{RENDER_COMMAND}}` is `sh scripts/render.sh`. If an existing `CLAUDE.md` holds project content, merge it into `AGENTS.md`. When Claude Code is used, write `CLAUDE.md` from `templates/CLAUDE.md.template` (the `@AGENTS.md` stub).
2. **Project map** `<harness-dir>/context/project-map.md` from `templates/project-map.md.template` — shallow tree, commands, protected and frozen areas. Unknown commands: `TODO: ask the researcher`. Never record secrets.
3. **The core skill**: copy `skills/research-workflow/` to `<harness-dir>/skills/research-workflow/`, plus `templates/docs/` → `templates/docs/` and `templates/render/` → `templates/render/` inside it (the doc templates keep their `{{PLACEHOLDER}}` tokens — they are instantiated per document), plus `templates/config.yaml.template` and `templates/launcher.sh.template` into its `templates/`.
4. **Renderer**: copy `scripts/render.sh` and `scripts/render.ps1` into the project's `scripts/`.
5. **`PLAN.md`** from `templates/docs/PLAN.md.template` (`approval: pending`), or adopt an existing plan by adding the frontmatter. Offer to draft it from the interview. An undefined metric or gate becomes an explicit TODO gate.
6. **`experiments/registry.json`** from `templates/registry.json.template`; `experiments/README.md` from `templates/experiments/README.md`.
7. **`notebook/NOTEBOOK.md`** from `templates/docs/NOTEBOOK.md.template`.
8. **`decisions/answers.md`** (filled), plus the decision logs if the `decision-log` pack is selected.
9. **Session skills** (always): copy `skills/bro/`, `skills/closing/` and `skills/rdd-update/` to `<harness-dir>/skills/`.
10. **Optional packs** selected: copy `skills/optional/<name>/` to `<harness-dir>/skills/<name>/`, adapting placeholders. `cluster-ops` is generated with the real scheduler commands (unknowns are TODOs). `paper-draft` also copies `templates/paper/` to `paper/` (instantiate the `.template` files; title, authors, venue in `main.tex`; sections stay near-empty until their milestone).
11. **Roles**: copy `agents/*.md` to `<harness-dir>/agents/` in the harness's format (Codex: TOML; keep `skeptic` and `literature-scout` read-only). Without subagent support, keep them as role files and say so in `{{HARNESS_NOTES}}`.
12. **Hooks** (only if approved): copy the chosen `hooks/examples/*.sh` to `<harness-dir>/hooks/` and add the wiring from `hooks/settings-snippets.md` for each harness. Confirm bash + `jq` first.
13. **Scripts**: copy `scripts/{validate_structure,validate_registry,capture_environment,check_frozen,check_placeholders}.py` into `scripts/`. If any artifact is frozen, create `data/frozen-manifest.json` and record checksums with `check_frozen.py --write`.
14. **`.gitignore`**: add `*.feedback.md`; unless the project commits rendered pages (`questions.md` §F), also add `PLAN.html`, `notebook/*.html`, `experiments/**/*.html`, `specs/**/*.html`, `reports/*.html`, `docs/*.html`.
15. **Additional harnesses** (if any): copy the skills and agents into each one's directories in its format, plus its hook wiring and MCP config. `AGENTS.md`, `PLAN.md`, `experiments/`, `notebook/`, `decisions/` and `scripts/` are shared, never duplicated.
16. **Render** everything once: `sh scripts/render.sh --all`.
17. **Manifest** (last): write `<harness-dir>/rdd-kit-manifest.json` per `templates/rdd-kit-manifest.schema.md` — kit version from `VERSION`, the `harness` block, one record per installed file.

Adapt every file to the project. No unresolved placeholder may remain in final files, except inside `<harness-dir>/skills/research-workflow/templates/`.

Do **not** copy the kit's own examples (`experiments/E00*_example-*`, `notebook/NOTEBOOK.md`, `configs/`, `launchers/`, `results/`, `data/`) into the project.

## Phase 4 — Validate

1. `python scripts/validate_structure.py` (set `RDD_HARNESS_DIR` when it is not `.claude`).
2. `python scripts/validate_registry.py` — an empty registry is valid.
3. `python scripts/check_placeholders.py` — it skips the per-document templates by design, so anything it reports is a real leftover. Do not hand-grep for tokens.
4. `AGENTS.md` points to the skill, `PLAN.md`, the registry, the notebook, the project map, and the render command.
5. Open `PLAN.html` and `experiments/registry.html`: both render styled, with no error banner.
6. Frozen artifacts (if any) are recorded and `check_frozen.py` is green.

## Phase 5 — Summary

Report: files created or changed; harness(es) installed; hooks and MCPs enabled or left off; commands detected; open TODOs (undefined gates, unknown commands, smoke-test definition); and the first prompt to start work.

## Phase 6 — First card

Propose the first card — usually a **baseline reproduction** — and render it for review. Do not start it without approval (⛔ gate 1).

## Not during onboarding

Running experiments or launching compute; changing or regenerating data; refactoring code; inventing metrics, budgets or scheduler commands; enabling external integrations without approval; committing unless asked.
