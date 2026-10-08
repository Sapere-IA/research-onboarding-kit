# RDD onboarding questions

Ask these **before** writing any project file, and record the answers in
`decisions/answers.md`. Group them into one or two `AskUserQuestion` rounds; use
free text where options don't fit (or the harness's equivalent question tool). Questions marked **(auto)** should first be
answered by inspecting the repository and only confirmed with the researcher.

If the researcher wants a default recommendation, offer the **Recommended
defaults profile** below as a single question first; if accepted, ask only the
genuinely project-specific items (harness §0, domain & goal §A1, commands & compute §C,
data & frozen artifacts §D, evaluation gate & smoke test §E, and any flagged
deviations).

---

## Recommended defaults profile

Offer this first. If accepted, most of §F is set automatically.

```yaml
work_types: [infrastructure, experiment, analysis]   # all three installed
human_gates: card_approval + verdict_confirmation     # both ⛔ required
local_first: true                                     # no external MCP/CLI required
experiment_tracker: complement_existing_or_none       # registry never replaces W&B/MLflow
id_convention: "E<seq>_<slug>"
registry_state: experiments/registry.json             # source of truth
documents: markdown_rendered_to_review_pages          # render.sh; review via feedback files
commit_rendered_pages: false                           # *.html gitignored; markdown is the record
hooks_profile: advisory_only_disabled_until_approved
blocking_hooks: available_opt_in                       # launch-approval + frozen-writes
frozen_artifacts_policy: required                      # manifest + check_frozen
smoke_test_required_before_cluster: true
every_run_logged: true                                 # failures + negatives included
compute_gate: ask_before_expensive_or_paid_runs
memory_scope: project_default_global_only_with_explicit_approval
autonomy: disabled_except_documented_readonly_monitoring
language_artifacts: project_language                   # kit files stay English
dependency_freshness: advisory                         # see §F19
optional_packs: recommend_per_answers                  # see §F16
```

---

## 0. Harness **(auto)**

The kit's files use the Claude Code layout as the reference; `reference/harness-primitives.md` maps it to every harness.

1. Which harness runs this onboarding — Claude Code (`.claude/`, `AGENTS.md` + `CLAUDE.md` stub), Codex CLI (`.codex/` + `.agents/skills/`), Cursor (`.cursor/`), OpenCode (`.opencode/`), Antigravity (`.agents/`), or another (fallbacks apply)? Usually inferable — state it and confirm.
2. Does the team use other harnesses on this repository? Existing harness directories are hints — confirm, do not assume. Each extra harness gets its own copies of skills and agents, hook wiring and MCP config; everything else is shared.
3. Which directory is primary (`<harness-dir>` for the manifest and validators)? Default: the harness running the onboarding.

## A. Project identity

1. Research domain and a one-sentence goal of the project.
2. Is there a prior publication/baseline this continues? Where does it live
   (paper sources, reference code, checkpoints)? **(auto: look for `paper/`,
   `baseline/`, checkpoints, citations in README)**
3. Publication target and rough timeline (journal/conference/thesis/internal)?

## B. People and approval

4. Solo or team? Who approves what — supervisor sign-off on gates? co-author
   review of cards? (Sets the `approver` on cards and the verdict gate.)
5. Default language for generated artifacts (kit files stay English)?

## C. Technical stack **(auto where possible)**

6. Languages, frameworks, environments (conda/venv/containers), test runner.
   **(auto: `environment.yml`, `requirements.txt`, `pyproject.toml`, lockfiles)**
7. Where does code run: local only / cluster (which scheduler — SLURM, HTCondor,
   …) / cloud / mixed? Does the agent's machine have a GPU? Who launches long jobs?
8. Experiment tracking already in use (W&B, MLflow, TensorBoard, none)? The kit's
   registry **complements, never replaces**, an existing tracker.

## D. Data

9. Data sources, sizes, licenses/sensitivity (PII? embargoed collaboration data?
   open?). Anything the agent must **never** upload, print, or commit?
10. Which artifacts must be **frozen** (eval sets, benchmark splits, reference
    checkpoints)? These go in `data/frozen-manifest.json`.
11. Data versioning convention (DVC, content hashes, dated filenames, none yet)?

## E. Experiments and evaluation

12. What are the project's evaluation metrics, and what counts as a pass/gate for
    an experiment? *(If unknown, install the question into `PLAN.md` as a TODO
    gate — the reviewer blocks dependent experiments until it's defined.)*
13. Compute budget per experiment (GPU-hours, walltime, queue limits) and per
    month.
14. Smoke-test policy: the smallest run that proves a job won't crash (e.g.
    100-sample overfit on CPU)? *(If unknown, record a TODO; cluster submissions
    are blocked until defined.)*
15. Naming convention for experiments (default `E<seq>_<slug>`; configs and
    launchers carry the same ID).

## F. Harness scope

16. Which optional packs to install (see `skills/optional/README.md`)? Recommend
    defaults based on answers:
    - cluster → `cluster-ops`;
    - paper target → `paper-draft` + `paper-trail` + `literature-watch`;
    - team → `decision-log` (recommended always);
    - data with licenses/sensitivity → `data-provenance`;
    - before-submission → `reproducibility-audit`;
    - plots in the paper → `figure-style`;
    - `experiment-registry` recommended for every project;
    - long sessions → `context-audit`; large or fast-changing repo → `project-map`;
    - fast-moving ML libraries/APIs → `dependency-freshness`.
    Present them in the themed bundles of `skills/optional/README.md` (≤ 4 options
    per question).
17. Hooks: none / advisory only / advisory + blocking (default: advisory only,
    disabled until approved), wired for each harness in §0. Confirm bash + `jq`
    before enabling.
18. Rendered pages (`*.html` next to each document): gitignored (default — the
    markdown is the record and anyone can re-render) or committed (e.g. to browse
    cards on the git host)?
19. Dependency freshness: before changing ML frameworks, libraries, cluster images
    or external APIs, verify current docs and record the evidence — advisory
    (default), required for changes that affect results, or off?
20. Any existing conventions (lab notebook, ADRs, style guides) the kit must
    adopt instead of its own templates? **(auto: look for `docs/`, `notebooks/`,
    `adr/`, an existing `NOTEBOOK`)**

---

## What the agent must NOT assume

- Whether every task uses RDD (vs. the infra/analysis paths).
- The evaluation metric or what counts as a passed gate.
- The smoke-test definition.
- Compute budgets, scheduler commands, partitions, or module loads.
- Which artifacts are frozen, or what data is sensitive.
- Which harness(es) the team uses beyond the one running the onboarding.
- Which optional packs to install, or whether hooks are enabled.
- Whether autonomous monitoring beyond read-only is allowed.

If a decision is missing, ask. Unknowns become explicit TODOs, never invented
values.
