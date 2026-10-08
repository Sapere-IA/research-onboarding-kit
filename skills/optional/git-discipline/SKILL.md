---
name: git-discipline
description: Work cleanly with branches, diffs, commits, and PR descriptions without risky git actions. Use when the researcher asks for commits, branches, or PR text tied to RDD work.
---

# Git discipline

## Purpose

Produce clean, traceable git artifacts tied to RDD work (cards, infra-specs,
analysis reports) while keeping every mutating git action permission-gated. This
skill supports the workflow; it never bypasses a gate.

## Rules

1. **Inspect `git status` and the diff before changes** — know the working-tree
   state first.
2. **Never overwrite uncommitted work** — no checkout/restore/stash over it; if it
   blocks the task, stop and ask.
3. **Do not commit unless asked.**
4. **Do not push unless asked.**
5. **Do not force-push unless explicitly approved — and document it** (what was
   rewritten, why, the approval).
6. **Do not merge PRs unless explicitly instructed** (never autonomous —
   `reference/autonomy-policy.md`).
7. **When commits are requested, reference the RDD artifact** (card ID,
   infra-spec, or report) in the message, following the project's convention.

A project may pre-authorize specific operations in its git policy; everything
else stays ask-first.

## When to use

- The researcher asks to commit, branch, or open a PR.
- Writing a commit message or PR description for completed RDD work.
- Inspecting repository state before starting.

## When not to use

- As permission for git operations the researcher didn't request.
- For history surgery (interactive rebase, force-push recovery) — surface it and
  let the researcher drive.

## Required inputs

- The artifact the change traces to (card ID / infra-spec / report).
- The project's git policy from `AGENTS.md` (branch naming, commit convention,
  whether the agent may commit/push).

## Procedure

1. Inspect `git status` and the diff; never overwrite uncommitted work.
2. If a branch is needed, follow the project's naming convention; ask if none.
3. For commits, fill `templates/commit-message.template` (artifact reference,
   what changed, why). **Check the diff for secrets and sensitive data first** —
   never commit data, checkpoints, tokens, or embargoed content.
4. Confirm before each mutating operation unless pre-authorized.

## Output artifact

Only the requested commits/branches/PR text, with traceable messages.

## Safety constraints

- Do not commit, push, merge, or open PRs unless asked.
- Never force-push or skip hooks without explicit recorded approval.
- **Never commit secrets, datasets, checkpoints, or sensitive/embargoed data** —
  large/sensitive artifacts belong in data versioning, not git history.
- Respect protected branches and the project's git policy.
