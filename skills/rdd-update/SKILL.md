---
name: rdd-update
description: Update this project's RDD harness from the research-onboarding-kit. Use when the researcher asks to update RDD, sync the harness with the kit, or apply a new kit version.
---

# RDD harness update skill

Bring this project's installed RDD harness up to date with the latest published version of the `research-onboarding-kit`, preserving every project-specific adaptation.

Kit source: `https://github.com/Sapere-IA/research-onboarding-kit` (or the path recorded as `kit_source` in the manifest).

## Safety rules (read first)

- Touch only harness files: `AGENTS.md` (RDD sections only) and the `CLAUDE.md` stub, every harness directory listed in the manifest's `harness` block (`.claude/`, `.codex/`, `.cursor/`, `.opencode/`, `.agents/`), `scripts/` harness scripts, document templates and render assets, hooks installed by onboarding, `.gitignore` entries the kit owns, and research documents **only** for format migrations a changelog entry requires.
- Never touch research code, configs, launchers, `results/`, data or frozen artifacts. A format migration rewrites a document's form, never its findings: results, verdicts, run logs and dates stay verbatim.
- Every migration step and every adapted-file merge requires researcher approval before it is applied. Mechanical refreshes of unmodified verbatim assets may be batched under a single approval.
- Never delete or overwrite a locally edited file without showing the researcher what would be lost.
- Work on a clean git state: if the repo has uncommitted changes to harness files or research documents, ask the researcher to commit or stash first, so the update is a reviewable diff.
- Clean up the temporary kit clone when done.

## Procedure

### 1. Read the local manifest

Read `<harness-dir>/rdd-kit-manifest.json` (look in `.claude/`, `.codex/`, `.cursor/`, `.opencode/`, `.agents/`; schema: the kit's `templates/rdd-kit-manifest.schema.md`). It records `kit_version`, the `harness` block, `commit_rendered_pages`, and, per installed file, its kit source path, hashes and `adapted` flag. A manifest without a `harness` block is a Claude Code install (`.claude/`).

**If the manifest is missing** (every 1.x install), enter bootstrap mode:

1. Fetch the kit (step 2) first.
2. Detect the harness directories present, then reconstruct the file list by matching installed harness files against the kit's layout (`<harness-dir>/agents/*`, `<harness-dir>/skills/research-workflow/*`, optional packs, templates, scripts, hooks, vendored `<harness-dir>/reference/*`).
3. A file byte-identical to some kit version's source is verbatim; anything else is `adapted: true`. `cluster-ops` and generated files are always adapted.
4. Treat the installed version as unknown: a harness with `experiments/*/card.html`, `notebook/NOTEBOOK.html` or `PLAN.html` and no `scripts/render.sh` is 1.x. Apply every changelog entry's migration whose changes are not already present (verify, don't assume), and flag uncertainty to the researcher instead of guessing.

### 2. Fetch the kit

```bash
git clone --depth 1 https://github.com/Sapere-IA/research-onboarding-kit <tmp-dir>
```

If the researcher keeps a local checkout, use that path instead (read-only). Read the kit's `VERSION` and `CHANGELOG.md`.

### 3. Compare versions

- Installed `kit_version` == kit `VERSION`: report "already up to date" and stop.
- Otherwise, read every `CHANGELOG.md` entry newer than the installed version — these define both what changed and the migration steps.

### 4. Refresh verbatim assets

For each manifest record with `adapted: false` whose kit source changed:

- If the installed file's current SHA-256 still equals the manifest's `installed_sha256`: overwrite with the new kit version (mechanical; batch these under one approval).
- If not, the researcher edited it locally: show the three-way situation (manifest version → local edits → new kit version) and ask.

### 5. Merge adapted files

For each `adapted: true` file whose kit source changed:

1. Diff the kit source between the installed and new versions to isolate what the kit actually changed.
2. Apply only those changes to the installed file, preserving the project adaptations (commands, paths, approvers, gates, policies recorded in `decisions/answers.md`) and the harness packaging (agent frontmatter or Codex TOML, `<harness-dir>` paths). Apply the same change to every copy listed for additional harnesses.
3. Show the resulting diff and get approval per file (related files may be grouped).

### 6. Run migrations

Execute the changelog **Migration** steps for each version being crossed, in order, each with approval. Never run a destructive step (deleting files, `git rm`) without showing exactly what it removes.

#### 1.x → 2.0.0

The `CHANGELOG.md` entry stays authoritative; these are the steps it implies. Each step needs approval; apply every harness-directory step to each harness directory in use.

1. **Instruction file.** Move the content of `CLAUDE.md` into `AGENTS.md`, applying the wording of the kit's `templates/AGENTS.md.template` (harness-neutral roles section, `.md` document paths, the render command and feedback flow, "Session skills", "Harness updates"). If Claude Code is used, replace `CLAUDE.md` with the two-line `@AGENTS.md` stub from `templates/CLAUDE.md.template`. Record the harness(es) in `decisions/answers.md` (new "Harness" section, `questions.md` §0).
2. **Renderer.** Install `scripts/render.sh` and `scripts/render.ps1` verbatim, and the render assets (`page-shell.html.template`, `research.css`, `research.js`) into `<harness-dir>/skills/research-workflow/templates/render/`.
3. **Skill, templates and agents.** Refresh `<harness-dir>/skills/research-workflow/` (new `doc-format.md` replaces `experiment-card-format.md`; workflow, state machine, classification and skeptic files updated), replace its `*.html.template` document templates with the `templates/docs/*.md.template` set, refresh installed optional packs and the agents (step 4/5 rules). Install the new core skills `bro`, `closing` and `rdd-update` into every harness skills directory.
4. **Convert experiment cards.** For each `experiments/<ID>/card.html`, write `experiments/<ID>/card.md` from `card.md.template`: frontmatter from the meta-table (`experiment_id`, `status`, `gate_result`, `plan_ref`, `supersedes`, `approver`, `smoke_passed`, `budget`) — `status` and `gate_result` must equal the `registry.json` record; the hypothesis → `H1:`, the change under test → `C1:`, metrics/gate rows → `M<n>:` / `G<n>:`, the setup table, the lifecycle timeline → the Plan markers, results, skeptic notes (`BLK-n` / `NBK-n`) and verdict carried **verbatim** (numbers, dates, confirmations untouched). Apply the conciseness budgets only to wording, never to findings; add a `## Summary` of ≤ 3 sentences. Then update each registry record's `card_path` to `card.md`.
5. **Convert the other documents.** `notebook/NOTEBOOK.html` → `notebook/NOTEBOOK.md` (`doc: notebook`, entries newest first, verbatim); `PLAN.html` is deleted — `PLAN.md` stays canonical and gains frontmatter (`doc: plan`, `title`); analysis reports → `analysis.md` (`doc: analysis`), infra-specs → `specs/<module>/spec.md` (`doc: infra-spec`), other HTML docs → `doc.md` (`doc: doc`); `registry.html` is no longer hand-maintained (it is rendered from `registry.json`).
6. **Spot-check.** Render one converted card (`sh scripts/render.sh experiments/<ID>/card.md`) and have the researcher compare it with the old `card.html` before converting or deleting anything else. Fix the conversion until they approve.
7. **Remove the old HTML.** After the spot-check approval, show and delete the old hand-written HTML (`card.html` sources, `NOTEBOOK.html`, `PLAN.html`, `registry.html`, report/spec HTML) and every copied `research.css` / `research.js` (`experiments/`, `notebook/`, `specs/`, `docs/`). Re-render everything with `sh scripts/render.sh --all`.
8. **Gitignore.** Unless the project commits rendered pages (record the answer as `commit_rendered_pages` in the manifest), add the rendered artifacts to `.gitignore`: `experiments/**/*.html`, `notebook/*.html`, `specs/**/*.html`, `reports/*.html`, `docs/*.html` (only if `docs/` holds kit documents), `PLAN.html`; always add `*.feedback.md`. `git rm --cached` previously committed rendered files after approval; do not commit yourself.
9. **Hooks.** If hooks were installed, refresh the scripts from the kit (the harness-neutral adapter block is new; project logic below it is preserved) and keep the existing wiring — the default output mode is Claude Code's. Wire additional harnesses only if the researcher asks (`hooks/settings-snippets.md`).
10. **Validators.** Refresh `scripts/validate_structure.py`, `validate_registry.py` and `check_placeholders.py` (they now read `card.md` frontmatter, `AGENTS.md` and `<harness-dir>`).
11. **Manifest.** Write `<harness-dir>/rdd-kit-manifest.json` (step 7).

#### 2.0.0 → 2.1.0

No mandatory step. If `autonomy-policy.md` or `human-in-the-loop-policy.md` is vendored under `<harness-dir>/reference/`, refresh it. Install the `goblin-mode` pack only if the researcher asks for it (`CHANGELOG.md` 2.1.0 Migration step 2).

### 7. Rewrite the manifest and report

- Rewrite `<harness-dir>/rdd-kit-manifest.json`: new `kit_version`, `updated_at`, the `harness` block, `commit_rendered_pages`, fresh hashes for every touched file; add records for newly installed files and drop records for removed ones.
- Run `python scripts/validate_structure.py` and `python scripts/validate_registry.py` (set `RDD_HARNESS_DIR=<harness-dir>` when it is not `.claude`).
- Delete the temporary clone.
- Report: previous → new version, files refreshed mechanically, files merged, files skipped (locally edited, researcher declined), documents converted, migration steps run, and anything left for the researcher (commits, pending spot-checks).
