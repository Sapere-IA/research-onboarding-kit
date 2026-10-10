# Research Onboarding Kit

This kit installs a **Research Driven Development (RDD)** harness in any research repository you work on with a coding agent: **Claude Code, OpenAI Codex CLI, Cursor, OpenCode, Google Antigravity**, or another harness with documented fallbacks. It is the research sibling of the [`sdd-onboarding-kit`](https://github.com/Sapere-IA/sdd-onboarding-kit). It is built for ML research, computational science, data analysis and paper-producing work.

It is a reusable template, not a global configuration. Onboarding produces a project-specific harness: `AGENTS.md`, the harness's `agents/` and `skills/`, `PLAN.md`, `experiments/` (cards + registry), `notebook/NOTEBOOK.md`, `decisions/`, a renderer and validation scripts.

Full documentation: **[`DOCUMENTATION.html`](DOCUMENTATION.html)** (open it in a browser). Version: [`VERSION`](VERSION) · changes: [`CHANGELOG.md`](CHANGELOG.md).

## The experiment loop

The central object is the **experiment card**: one concise markdown file per experiment, `experiments/<ID>/card.md`.

1. **Classify** the task: infrastructure (an infra-spec with tests), experiment (the card loop) or analysis (a cited report).
2. **Draft the card.** It has exactly one change under test, a baseline, and metrics and gates declared *before* launch.
3. ⛔ **The researcher approves the card** on its review page. No config, launcher or run happens before this.
4. **Build the run artifacts:** config, launcher, and a smoke test that must pass locally.
5. **Launch.** The agent runs cheap local jobs itself. Expensive or cluster jobs are handed to the researcher, the card goes to `launched`, and the agent waits.
6. **Analyze** real results only. The skeptic tries to refute the result, and every run is logged, failures included.
7. ⛔ **The researcher confirms the verdict.** The agent proposes; it never declares a gate passed.
8. **Record** the result in the notebook and the registry.

The two gates sit where research goes expensively or dishonestly wrong: **launching compute** and **making claims**. Reading, plotting, drafting and infrastructure work stay friction-free.

## Why these mechanisms

The kit grew out of a project that lost about six months to three problems: untested simultaneous changes, a silently corrupted validation set, and checkpoint selection tied to that set.

| Failure mode | Countermeasure |
|---|---|
| Many simultaneous changes; results unattributable | One change per experiment, enforced by the card |
| Evaluation data silently mutated or leaked | Frozen-artifact policy + manifest + `check_frozen.py` |
| No baseline; can't tell if anything improved | Baseline reproduction before new experiments |
| Silent retries and cherry-picking | Every run logged in the card, failures and negatives included |
| Results not reproducible months later | Config-as-spec, seeds, environment capture, data versioning |
| Compute wasted on undebugged jobs | Smoke test before any cluster submission |
| Knowledge trapped in one head or chat | Lab notebook, decision logs, `## Resume here` handoff |
| Paper claims not traceable to artifacts | Claim → card → artifact traceability |

## Documents: markdown in, one review page out

Every human-facing document is markdown with frontmatter: cards, `PLAN.md`, the notebook, analysis reports, infra-specs and notes. Markdown is the source of truth. It is cheap for the agent to read and write, and it diffs cleanly.

```bash
sh scripts/render.sh experiments/E012_frozen-encoder/card.md   # → card.html
sh scripts/render.sh --all                                     # every document + registry.html
```

The renderer needs no runtime: it uses POSIX `sh`, and `render.ps1` covers Windows. Each document becomes one interactive page with these parts:

- an "At a glance" summary
- a status stepper
- a ⛔ gate box when a decision is due
- "Needs your decision"
- collapsible sections

Every ID'd item has Accept / Change / Reject / Answer / Comment buttons. The researcher clicks **Approve card** (or **Confirm verdict**), saves `card.feedback.md`, and tells the agent to *read the feedback*. The agent applies the feedback to the markdown and re-renders the page. The experiment dashboard, `registry.html`, is rendered from `experiments/registry.json`.

Examples: [a card awaiting approval](experiments/E002_example-label-smoothing/card.html) · [a finished card](experiments/E001_example-baseline/card.html) · [the registry](experiments/registry.html) · [the notebook](notebook/NOTEBOOK.html).

## Works with every harness

The kit's files use the Claude Code layout (`.claude/`) as the reference; [`reference/harness-primitives.md`](reference/harness-primitives.md) maps each concept.

| Concept | Claude Code | Codex CLI | Cursor | OpenCode | Antigravity |
| --- | --- | --- | --- | --- | --- |
| Instruction file | `AGENTS.md` via a `CLAUDE.md` stub | `AGENTS.md` | `AGENTS.md` | `AGENTS.md` | `AGENTS.md` |
| Skills (`SKILL.md`) | `.claude/skills/` | `.agents/skills/` | `.cursor/skills/` | `.opencode/skills/` | `.agents/skills/` |
| Subagents | `.claude/agents/*.md` | `.codex/agents/*.toml` | `.cursor/agents/*.md` | `.opencode/agents/*.md` | `.agents/agents/*.md` |
| Hooks | `.claude/settings.json` | `.codex/hooks.json` | `.cursor/hooks.json` | JS plugin → same scripts | `.agents/hooks.json` |

Where a harness lacks a concept, the kit falls back. Subagents become roles that the main conversation plays, skills are read on demand, and hooks stay at the instruction level. One project can be shared by several harnesses: `AGENTS.md`, the cards, the registry and the notebook are common to all of them.

## Install

Copy this folder into your project, open your coding agent there, and run:

```text
Read `research-onboarding-kit/instructions.md` and configure this repository to
use Research Driven Development with this harness. Ask me all necessary
questions before making project-specific decisions.
```

The agent inspects the repository and asks the questions in `questions.md`, starting with a recommended-defaults profile. It then generates the harness, renders `PLAN.md` and the registry, and proposes a first card, usually a baseline reproduction.

## What gets installed

**Always:**

- A short `AGENTS.md` (plus a `CLAUDE.md` stub for Claude Code), a `PLAN.md` and the project map.
- The roles: research-lead, experiment-designer, analyst, skeptic (read-only), scribe and literature-scout (read-only).
- The `research-workflow` skill: the loop, the state machine, classification, the skeptic checklist, `doc-format.md`, and the document templates and render assets.
- The session skills:
  - `bro` re-explains something in plain language.
  - `closing` audits the artifacts at the end of a session and writes the `## Resume here` handoff.
  - `rdd-update` updates the harness from this kit.
- `experiments/registry.json`, `notebook/NOTEBOOK.md`, `decisions/answers.md`, `scripts/render.sh` and `scripts/render.ps1`.
- The validators: `validate_structure`, `validate_registry`, `check_placeholders`, `check_frozen` and `capture_environment`.
- `<harness-dir>/rdd-kit-manifest.json`.

**Only when you select them:**

- Any of 15 optional packs ([`skills/optional/`](skills/optional/README.md)): `experiment-registry`, `cluster-ops`, `reproducibility-audit`, `dependency-freshness`, `paper-draft`, `paper-trail`, `literature-watch`, `figure-style`, `data-provenance`, `decision-log`, `failure-learning`, `git-discipline`, `project-map`, `context-audit` and `goblin-mode` (one card unattended, invocation = both gate decisions; only when asked for by name).
- Hooks: harness-neutral example scripts, advisory or blocking, disabled by default.
- MCPs: none are configured by default.

Nothing phones home, stores credentials or enables external access: the default install is fully local.

## Staying up to date

Watch this repository's releases (**Watch → Custom → Releases**). To update an installed project, invoke its `rdd-update` skill. The skill does four things:

- reads the manifest
- fetches the kit
- refreshes unmodified files mechanically
- merges adapted files and runs the `CHANGELOG.md` migration steps, with your approval for each

## Safety model

- **Two human gates** the agent never crosses: card approval and verdict confirmation. An approving feedback file counts as the decision, and the agent never writes one itself.
- **No expensive compute without approval**, and a smoke test before any cluster job.
- **Frozen artifacts never change.** A replacement gets a new name and a decision.
- **Every run is logged** and no metrics are shopped for.
- **Memory discipline:** nothing is written to global memory without approval of the exact text, and no secrets or embargoed data go into any layer.
- **Hooks** are advisory or blocking, never mutating, and off by default.
- **Autonomy** is limited to read-only monitoring and never crosses a gate; the opt-in `goblin-mode` pack is the one recorded exception, scoped to a single invoked card.

## Key files

| File | Purpose |
|---|---|
| `instructions.md` | Onboarding procedure the agent follows |
| `questions.md` | Decisions to ask before writing files (§0: harness) |
| `agents/` | The six research roles |
| `skills/research-workflow/` | The core loop, `doc-format.md`, state machine, skeptic checklist |
| `skills/bro/`, `skills/closing/`, `skills/rdd-update/` | Session and update skills |
| `skills/optional/` | 15 optional packs |
| `templates/docs/` | Card, plan, notebook, analysis, infra-spec, doc templates |
| `templates/render/` | Page shell, `research.css`, `research.js` |
| `scripts/` | Renderer (`render.sh` / `render.ps1`) and Python validators |
| `reference/` | RDD theory, harness mapping, integrity/reproducibility/compute/frozen/memory/autonomy policies |
| `hooks/` | Hook policy, per-harness wiring, example scripts |
| `experiments/`, `notebook/` | Rendered reference examples (not installed) |
| `CHANGELOG.md` / `VERSION` | Releases with migration notes for `rdd-update` |

## Contributing

Fork the repository, branch from `main` (`fix/…`, `feat/…`), keep each PR to one concern, and open it against `main`. Only the owner merges.

- Keep kit files in English and in `{{PLACEHOLDER}}` template syntax. Generated project artifacts may use the project's language.
- Keep installable content (agents, skills, templates, policies) harness-neutral. Harness names belong only in per-harness tables.
- Keep `scripts/render.sh` and `scripts/render.ps1` in sync. After touching the renderer or an example, re-render: `sh scripts/render.sh experiments notebook experiments/*/`.
- Keep the hook adapter block byte-identical across hooks. Hooks are POSIX bash and fail open without `jq`.
- Validators use the Python standard library only and must run on POSIX and Windows.
- A release bumps `VERSION` and adds a `CHANGELOG.md` entry with **Changes** and **Migration**.
- Run `scripts/update-manifest.sh` after adding, renaming or deleting files. CI must pass.

Report issues with a short description, reproduction steps, and expected vs. actual behavior.

## License

MIT — see [LICENSE](LICENSE).
