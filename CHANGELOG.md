# Changelog

Kit versions are tracked in `VERSION` and tagged in git (`v<version>`). Each entry lists **Changes** (what is different in the kit) and **Migration** (what `rdd-update` must do to bring an existing install up to date). The `rdd-update` skill reads the entries between the installed version and the latest, and executes the migration steps with researcher approval.

## 2.1.0 — 2026-10-10

Mirrors `sdd-onboarding-kit` 3.1.0.

### Changes

- **New optional pack: `goblin-mode`.** Runs one experiment card (or infra-spec) unattended, as far as it can go: the invocation is recorded in the card frontmatter and the registry as the researcher's decision at **both** RDD gates (with notes that the card was not human-reviewed before launch and the verdict was not human-confirmed), then card, config, launcher, smoke test, launch within the card's budget, analysis, skeptic, verdict, notebook and registry, the `closing` handoff, commits on a feature branch, push and one pull request — with no question to the researcher until the final report. Two end states: **completed** when results came back in the session, or **launched and waiting** when the run is on a cluster or longer than the session (re-invoking on the same ID continues from analysis). It declares a goal condition the harness's persistence feature can check (`/goal` on Claude Code; single pass elsewhere), bounds (3 consecutive fix attempts per failure, the card and project compute budgets, immediate stop on hook or permission denial), and a "deciding alone" rule: how-to-run questions are resolved conservatively and recorded as auto-decided; questions about the hypothesis, change, gate criteria, budget, frozen data, money, plan scope or paper claims stop the run. Never merges, force-pushes, touches the default or protected branches, moves a `PLAN.md` gate, writes paper text, memory or decision logs (propose-only), or disables a hook. An early stop leaves WIP committed on the branch and a `## Resume here` handoff.
- **Autonomy and human-in-the-loop policies: recorded exception.** `reference/autonomy-policy.md` gains a "Recorded exception: goblin-mode" section scoping the only sanctioned way across the gates without a human checkpoint; `reference/human-in-the-loop-policy.md` points to it. Installing the pack is the recorded decision the policies require.
- **Onboarding.** `questions.md` §F16: the agent never suggests `goblin-mode` (install only when asked by name) and, if selected, confirms what it relaxes and records it in `decisions/answers.md`. The "Repo & session" bundle is now "Repo, session & autonomy". `skills/optional/README.md`, `README.md` and `DOCUMENTATION.html` list 15 packs.

### Migration (from 2.0.0)

Nothing is required. Optional steps, each with approval:

1. If `autonomy-policy.md` or `human-in-the-loop-policy.md` was vendored under `<harness-dir>/reference/`, refresh it from the kit.
2. If the researcher asks for `goblin-mode`, copy `skills/optional/goblin-mode/SKILL.md` to `<harness-dir>/skills/goblin-mode/SKILL.md` in every harness directory, add it by name to the installed-skills list in `AGENTS.md`, make sure the git policy names the branch convention, default branch and PR tooling, and record the selection and the relaxed items (both gates by invocation, cheap-local launches within budget, whether cluster launches within budget are pre-authorized, feature branch + PR, 3 fix attempts, no time cap) in `decisions/answers.md` (and `decisions/workflow-decisions.md` if the `decision-log` pack is installed).

## 2.0.0 — 2026-10-08

Brings the kit in line with its sibling, the `sdd-onboarding-kit` (2.0 → 3.0).

### Changes

- **Markdown is the source of truth.** Every human-facing document — experiment cards, `PLAN.md`, the lab notebook, analysis reports, infra-specs, generic docs — is markdown with YAML frontmatter (`doc:` names its type). Agents read and write only the `.md`; it is cheaper to read and write than HTML and diffs cleanly. Templates live in `templates/docs/*.md.template`; conventions in `skills/research-workflow/doc-format.md` (replaces `experiment-card-format.md`).
- **One concise doc per experiment.** The experiment card is a single `experiments/<ID>/card.md` with sections: Summary, Hypothesis (`H1`), Change under test (`C1`, exactly one), Baseline, Metrics and gate (`M<n>`, `G<n>`), Setup, optional Open questions / Assumptions, Plan (timeline), Runs (every run, failures included), Results, Skeptic (`BLK-n` / `NBK-n`), Verdict, Follow-ups. Card frontmatter carries `status` and `gate_result`, which must match `registry.json`.
- **One interactive page per document.** `sh scripts/render.sh <file.md | dir | registry.json | --all>` writes a self-contained page next to each source (`card.md` → `card.html`): an "At a glance" summary, a status stepper and key stats, "Needs your decision" (open questions, pending assumptions, the pending gate), collapsible sections, ID chips that link to their definition, print styles.
- **Review in the page, hand back a file.** Every item with an ID gets Accept / Change / Reject / Answer / Comment. The page verdict is contextual — "Approve card" (gate 1) on a draft card, "Confirm verdict" (gate 2) on an analyzed card, "Approve plan" on `PLAN.md`. The researcher saves `<name>.feedback.md` next to the source (or downloads it, or copies it into the chat); the agent applies it to the markdown, re-renders and deletes the file. An approving feedback file with no change or reject items is the researcher's gate decision.
- **Registry dashboard is rendered.** `registry.html` is generated from `experiments/registry.json` (status counts, gate results, links to each card); it is never hand-maintained. The `PLAN.html` twin is gone — `PLAN.md` renders to `PLAN.html` on demand.
- **No runtime needed.** The renderer is POSIX `sh` (`scripts/render.sh`) with a PowerShell port (`scripts/render.ps1`); markdown is embedded verbatim and rendered in the browser by `research.js`. Rendered pages and feedback files are gitignored by default (onboarding asks whether to commit rendered pages). The `research.css` / `research.js` copies in every artifact folder are gone: assets are inlined.
- **New design.** The Sapere IA palette (paper / ink / lime / coral; Instrument Sans + JetBrains Mono). Light by default; follows the OS dark mode and has a toggle; works at phone width. `README.html` and `DOCUMENTATION.html` use the same design and are shorter.
- **Concise documents.** `doc-format.md` sets budgets: Summary ≤ 3 sentences, one sentence per item, one-screen sections, ≤ ~8 plan tasks, a card readable in about three minutes. Each fact lives once; everything else references it by ID. Optional sections are deleted when they do not apply.
- **Multi-harness support.** The kit installs under Claude Code, OpenAI Codex CLI, Cursor, OpenCode and Google Antigravity (with fallbacks for others). `AGENTS.md` is the canonical project instruction file (`templates/AGENTS.md.template`); `templates/CLAUDE.md.template` is a two-line `@AGENTS.md` import stub generated only for Claude Code. `reference/harness-primitives.md` maps instruction file, skills, subagents, hooks, MCP config and compaction to each harness. Installable content is harness-neutral (`<harness-dir>`, "the agent"). `questions.md` gains §0 Harness.
- **Harness-neutral hooks.** Every example hook starts with an identical adapter block that reads the payloads of Claude Code, Codex, Cursor and Antigravity (or explicit `RDD_HOOK_*` variables / a path argument) and blocks or advises per `RDD_HOOK_OUTPUT`. `hooks/settings-snippets.md` carries wiring for every harness.
- **New core skills.** `bro` re-explains your previous message, a file, a card item, an experiment or a term in plain language in ≤ ~150 words. `closing` is an end-of-session audit: registry vs cards vs `results/`, runs logged, notebook entries, pending feedback, a `## Resume here` handoff at the top of `NOTEBOOK.md`, a cold-start test, and asking before committing. `rdd-update` updates an installed harness from the kit, driven by this changelog.
- **Install manifest.** Onboarding writes `<harness-dir>/rdd-kit-manifest.json` (kit version, harness block, per-file hashes and `adapted` flag; schema `templates/rdd-kit-manifest.schema.md`) as its last step.
- **New optional packs.** `context-audit`, `project-map` and `dependency-freshness` (ported from the SDD kit, research-flavored). New reference policies: `reference/cli-vs-mcp-policy.md` and `reference/dependency-freshness-policy.md`.

### Migration (from 1.x)

Run with researcher approval, per step (`rdd-update` § 1.x → 2.0.0 has the details). 1.x installs have no manifest, so `rdd-update` runs in bootstrap mode.

1. Move `CLAUDE.md` into `AGENTS.md` (template wording) and replace `CLAUDE.md` with the `@AGENTS.md` stub when Claude Code is used; record the harness in `decisions/answers.md`.
2. Install `scripts/render.sh` / `scripts/render.ps1` and the render assets into `<harness-dir>/skills/research-workflow/templates/render/`.
3. Refresh the `research-workflow` skill (`doc-format.md` replaces `experiment-card-format.md`), replace its `*.html.template` document templates with the `*.md.template` set, refresh optional packs and agents preserving project adaptations, and install `bro`, `closing` and `rdd-update`.
4. Convert each `experiments/<ID>/card.html` to `card.md`; frontmatter `status` / `gate_result` equal the registry record; results, run logs, skeptic notes and verdicts verbatim. Point each registry `card_path` at `card.md`.
5. Convert `NOTEBOOK.html` → `NOTEBOOK.md`, delete `PLAN.html` (add `doc: plan` frontmatter to `PLAN.md`), convert analysis reports, infra-specs and other HTML docs to markdown.
6. Render one converted card and have the researcher compare it with the old HTML before going further.
7. Delete the old hand-written HTML and every `research.css` / `research.js` copy; re-render with `sh scripts/render.sh --all`.
8. Gitignore rendered pages (unless the project commits them) and `*.feedback.md`.
9. Refresh installed hook scripts (new adapter block; wiring unchanged).
10. Refresh the validation scripts.
11. Write `<harness-dir>/rdd-kit-manifest.json`.

## 1.0.0

The original Research Driven Development kit for Claude Code: the experiment loop with two human gates (card approval, verdict confirmation), six agents, the `research-workflow` skill, eleven optional packs, advisory and blocking hooks, the frozen-artifact, reproducibility, compute-budget and integrity policies, cross-platform Python validators, and hand-written styled HTML artifacts (cards, registry, notebook, `PLAN.html` twin) sharing copied `research.css` / `research.js` assets. No migration.
