# Expected project structure after onboarding

A repository with the RDD harness installed. Optional pieces (decision logs, packs, hooks, `paper/`) appear only when selected. `<harness-dir>` is `.claude/` for Claude Code (other harnesses: `reference/harness-primitives.md`). `*.html` pages are rendered from the markdown next to them and gitignored unless the project commits them.

```text
target-project/
├── AGENTS.md                         # project instructions for every coding agent (short; links out)
├── CLAUDE.md                         # `@AGENTS.md` import stub (Claude Code only)
├── PLAN.md                           # objectives, phases, gates, experiment matrix (doc: plan)
├── PLAN.html                         # rendered review page
├── decisions/
│   ├── answers.md                    # recorded onboarding answers
│   └── architecture-decisions.md …   # (decision-log pack)
├── experiments/
│   ├── README.md                     # layout + registry schema
│   ├── registry.json                 # MACHINE STATE — status source of truth
│   ├── registry.html                 # dashboard, rendered from registry.json
│   └── E001_<slug>/
│       ├── card.md                   # THE experiment: one doc with sections
│       ├── card.html                 # rendered review page
│       └── analysis.md               # (optional) analysis report
├── notebook/
│   └── NOTEBOOK.md                   # newest-first lab notebook; `## Resume here` on top
├── specs/<module>/spec.md            # (infra tasks) mini-SDD contract + acceptance tests
├── reports/<slug>.md                 # (analysis tasks) cited reports
├── paper/                            # (paper-draft pack) progressive LaTeX write-up
├── configs/E001_<slug>.yaml          # one config = one card
├── launchers/E001_<slug>.sh          # ID, output dir, resume, scheduler block
├── results/E001_<slug>/              # real run outputs (cards reconcile against these)
├── data/frozen-manifest.json         # (if any artifact is frozen)
├── scripts/
│   ├── render.sh  render.ps1         # markdown → review pages (no runtime needed)
│   ├── validate_structure.py  validate_registry.py  check_placeholders.py
│   └── capture_environment.py  check_frozen.py
└── <harness-dir>/
    ├── agents/                       # research-lead, experiment-designer, analyst, skeptic, scribe, literature-scout
    ├── skills/
    │   ├── research-workflow/        # core skill + doc-format.md + templates/{docs,render}/
    │   ├── bro/  closing/  rdd-update/
    │   └── <optional packs>/
    ├── context/project-map.md
    ├── hooks/                        # only if hooks were approved
    ├── settings.json                 # (Claude Code) only if hooks/MCPs are configured
    └── rdd-kit-manifest.json         # kit version, harness block, installed-file hashes
```

## Format conventions

- **Markdown with frontmatter** for every human-facing document (cards, plan, notebook, analysis, infra-specs, notes). It is the source of truth; `scripts/render.sh` turns each into an interactive page for review, and the researcher's verdicts come back as `<name>.feedback.md` (`<harness-dir>/skills/research-workflow/doc-format.md`).
- **Machine state**: `experiments/registry.json`; `validate_registry.py` checks it against card frontmatter and `results/`.
- **Markdown, agent-facing**: `AGENTS.md`, skills, agents, decisions, project map.
- **Text**: `configs/*.yaml`, `launchers/*.sh`. **LaTeX**: `paper/` (paper-draft pack).

## Not installed

The kit's examples (`experiments/E00*_example-*`, `notebook/NOTEBOOK.md`, `configs/`, `launchers/`, `results/`, `data/`) and the kit-root `templates/`, `reference/`, `hooks/examples/`, `agents/` — only their adapted copies.
