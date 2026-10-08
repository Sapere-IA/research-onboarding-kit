---
name: closing
description: Close a research session so a fresh session with empty context can continue from the files alone. Use when the researcher is about to stop, switch experiments, compact, hand the work to someone else, or leave runs going on the cluster.
argument-hint: "[optional focus, e.g. an experiment ID]"
---

# Closing — leave the research record resumable

## Purpose

Answer three questions before the session ends:

1. Is everything important written down?
2. Do the registry, the cards, the notebook and memory match what actually happened — and what is on disk in `results/`?
3. If a new session with empty context opened this repo, could it continue from here, including runs still in flight?

Chat history is lost; the artifacts are the record (`reference/session-recovery.md`, and the "Session recovery" rule in `AGENTS.md`). This skill closes the gap between the two.

## Procedure

### 1. Gather what happened

- This conversation: experiments touched, cards drafted or edited, approvals and verdict confirmations given, runs launched or handed over (commands, job IDs), results that came back, questions answered, assumptions confirmed or rejected, decisions settled, problems hit, work left half-done.
- The repo: `git status`, `git diff --stat` (staged and unstaged), `git log --oneline -10`, and the `results/` directories of every active experiment.

### 2. Audit the artifacts against reality

For each item, compare what the file says with what happened and what is on disk:

- `experiments/registry.json` vs each touched card's frontmatter — `status` and `gate_result` must match; `smoke_passed`, `code_version`, `actual_cost`, `updated` current. Run `python scripts/validate_registry.py`.
- `results/<ID>/` vs status — a `launched` card whose results arrived (or whose run failed) is stale; an `analyzed`/`done` card with an empty results dir is wrong. Artifacts win.
- Card **Runs** table — every run started this session has a row (date, exact command or job ID, outcome), failures included. Runs still in flight say so and name what to paste back.
- Card **Plan** markers (`[ ]`, `[>]`, `[x]`, `[!]`) match the work actually done.
- Card **Open questions** / **Assumptions** — answered questions resolved, assumptions accepted or rejected.
- Card **Skeptic** and **Verdict** — findings raised or resolved; a proposed verdict is labeled proposed, never confirmed without the researcher.
- `**/*.feedback.md` — pending review feedback not yet applied (apply it, or list it as the next action).
- `notebook/NOTEBOOK.md` — every state change this session (launched, results in, verdict confirmed, failed, abandoned) has a dated entry.
- `PLAN.md` — gates moved only by confirmed verdicts; plan changes agreed in chat but not written.
- Decision logs (`decisions/`) and project memory per `reference/memory-policy.md` (`AGENTS.md`, `decisions/`, the harness's own memory if the project uses one).
- Project map / `AGENTS.md` — commands, structure or conventions that changed.

### 3. Fix the gaps

- Write only facts that happened in this session or are visible in the repo. **Never invent results, numbers, run outcomes or decisions**; a run without outputs stays `launched`.
- Update card sections, plan markers, runs rows, open questions, assumptions and notebook entries directly; keep card frontmatter and the registry record in sync.
- Gates stay human: never set `approved` or `done`, never mark a gate passed, unless the researcher approved it in this session (in chat or with an approving feedback file); if the record lags behind a real approval, update it and cite the approval.
- Memory writes and decision-log entries follow the memory policy: show the exact entry text and ask before writing. Never write global memory from this skill.
- Re-render every document whose markdown changed: `sh scripts/render.sh <file.md>` (or `sh scripts/render.sh --all`; Windows: `pwsh scripts/render.ps1`).

### 4. Write the handoff

Use the project's session-handoff location if `AGENTS.md` or `decisions/answers.md` names one. Otherwise keep a single `## Resume here` block at the top of `notebook/NOTEBOOK.md`, above the entries — replace it on each close, never append a new one:

```markdown
## Resume here

- **Updated:** YYYY-MM-DD
- **Active experiment(s):** E012_slug (`launched`), E013_slug (`draft`)
- **Next action:** <one concrete step, e.g. "when results/E012_slug/ has metrics.json, run T4 in its card">
- **Waiting on:** <job IDs and what to paste back, card approval, verdict confirmation, open question Qn — or "nothing">
- **Uncommitted work:** <summary of git status, or "none">
- **Notes:** <anything a fresh session would otherwise rediscover the hard way>
```

Keep it short: it points at artifacts, it does not duplicate them. When nothing is active, say so and name the next candidate from `PLAN.md` or the registry.

### 5. Cold-start test

Using only the files (not this conversation), answer: which experiments are active, their status, what is running where, the next action, and what is waiting on the researcher? If any answer needs chat context, fix the artifact and test again.

### 6. Report

```text
Closing checklist
✓/✗ registry.json matches card frontmatter and results/ (validate_registry green)
✓/✗ runs logged (in-flight runs name what to paste back)
✓/✗ card plan markers, questions, assumptions, skeptic, verdict up to date
✓/✗ notebook entries for every state change
✓/✗ decisions and memory recorded (or proposed and declined)
✓/✗ no pending *.feedback.md
✓/✗ changed docs re-rendered
✓/✗ handoff written
✓/✗ cold-start test passed
A fresh session can resume from: <file and section>
```

Explain every ✗ in one line.

### 7. Uncommitted work

Show `git status` and a short summary of the diff, then ask whether to commit, following the project's git policy (`AGENTS.md`, and the `git-discipline` skill if installed). Never commit, push, stash, reset, delete anything, or touch `results/` and frozen artifacts without explicit approval.
