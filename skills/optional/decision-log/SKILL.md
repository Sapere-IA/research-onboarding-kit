---
name: decision-log
description: Record durable methodological and workflow decisions in the project's decision log. Use when a card, analysis, or discussion settles something future sessions must not re-litigate.
---

# Decision log

## Purpose

Make significant decisions survive compaction and new sessions by recording them
in versioned files instead of chat history.

## Where decisions live

- `decisions/answers.md` — onboarding answers (always created).
- `decisions/architecture-decisions.md` — durable methodological/architecture
  choices (research statuses: `active` / `superseded` / `rejected`, with a
  "Revisit if" field).
- `decisions/rejected-options.md` — approaches/models/datasets considered and
  rejected.
- `docs/adr/` — if the project already uses ADRs, methodological decisions go
  there in the existing format instead.

## When to use

- A card or analysis settles a methodological choice (especially when an
  alternative was rejected, or when a result rules an approach out).
- A workflow rule is agreed ("from now on, every gate needs 3 seeds").
- The same question keeps recurring across sessions.

## When not to use

- Trivial choices; one-off task instructions; unconfirmed speculation; anything
  with secrets or sensitive data.

## Procedure

1. Confirm the decision is durable and non-trivial.
2. Pick the target file (methodological → architecture-decisions; rejected
   approach → rejected-options).
3. Draft the entry in the target file's format (date, status, context, decision,
   alternatives, consequences, revisit-if, source = card ID / report / notebook).
4. **Propose the exact text; do not write without approval.**
5. On approval, append below the marker, newest first.
6. If it contradicts an earlier entry, mark the old one `superseded`, don't delete.
7. If load-bearing for every session, also propose a one-line `AGENTS.md` hard
   rule (`reference/memory-policy.md`).

## Output artifact

An appended entry in `decisions/*.md` (or `docs/adr/`).

## Safety constraints

- Propose, don't overproduce; never write without approval of the exact text.
- Never log secrets or sensitive data; project memory only, never global.
