---
name: closing
description: Close a research session so a fresh session with empty context can continue from the files alone — audit the record, update project memory, commit, push, and say whether it is safe to close. Use when the researcher is about to stop, switch experiments, compact, hand the work to someone else, or leave runs going on the cluster.
argument-hint: "[optional focus, e.g. an experiment ID; 'no push' or 'no commit' to stop earlier]"
---

# Closing — leave the research record resumable

## Purpose

Answer three questions before the session ends:

1. Is everything important written down?
2. Do the registry, the cards, the notebook and memory match what actually happened — and what is on disk in `results/`?
3. If a new session with empty context opened this repo, could it continue from here, including runs still in flight?

Chat history is lost; the artifacts are the record (`reference/session-recovery.md`, and the "Session recovery" rule in `AGENTS.md`). This skill closes the gap between the two.

**Invoking this skill is the researcher's approval** to update project memory, commit the session's work and push it, as described in steps 3, 7 and 8. Do not ask again whether to commit, push or update memory; do it and report. The researcher can narrow this in the invocation (`no push`, `no commit`); the project's git policy and the limits below still apply. It is not approval for anything else: gates, verdicts, `results/` and frozen artifacts stay as they are.

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
- Memory writes and decision-log entries: the invocation counts as the researcher's choice of **project memory** under the memory policy (`reference/memory-policy.md` § Closing). Write project-scoped entries (decision logs, `AGENTS.md` facts that changed, the harness's project memory if the project uses one) without asking, and list the exact text of each in the report. Only confirmed facts: an unconfirmed conclusion or proposed verdict is never written to memory. Never write global memory from this skill: list a project-independent lesson as a proposal instead.
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
✓/✗ decisions and project memory recorded (exact entries listed; global-memory proposals listed, not written)
✓/✗ no pending *.feedback.md
✓/✗ changed docs re-rendered
✓/✗ handoff written
✓/✗ cold-start test passed
A fresh session can resume from: <file and section>
```

Explain every ✗ in one line.

### 7. Commit

Show `git status` and a short summary of the diff, then commit the session's work following the project's git policy (`AGENTS.md`, and the `git-discipline` skill if installed): its branch rules, message convention and attribution. Use one commit per logical change when the policy asks for it; otherwise one commit.

- Stage only files this session produced or changed. Leave out anything that looks like a secret or credential (`.env`, keys, tokens), sensitive or embargoed data, large generated or binary files, anything the `.gitignore` or the frozen-artifacts policy keeps out of git (`results/`, checkpoints, raw data), and unrelated changes that were already there before the session; list them in the report.
- Never modify, move or delete anything under `results/` or a frozen artifact to make the commit work.
- If a commit hook fails, fix the cause and commit again; never bypass hooks (`--no-verify` or equivalent).
- If the git policy forbids committing on the current branch (for example the default or a protected branch), do not commit: report it and leave the work uncommitted.

### 8. Push and finish

- Push the current branch to its upstream (set the upstream on first push if the policy allows it). Never force-push, and never push a branch the git policy says not to push directly.
- Never stash, reset, rebase, delete branches or discard changes.
- If the push is rejected (remote ahead, no remote, no permission), stop: do not pull, merge or rebase on your own. Report the reason.
- Re-check `git status` and the branch's ahead/behind count against its upstream after pushing.

End the report with one line:

- `✓ Safe to close the session.` — the checklist is all ✓ (or every ✗ is explained and recorded in the handoff), memory is written, the work is committed and pushed, and the working tree is clean apart from files deliberately left out. Runs still in flight do not block this when the handoff names them and what to paste back.
- `✗ Not safe to close yet: <reason>` — and what the researcher needs to do or decide.
