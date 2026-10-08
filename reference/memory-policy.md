# Memory policy

Knowledge can persist across sessions in several places that differ in scope, visibility and risk. This policy says which layer holds what, with one non-negotiable rule:

**The agent never writes memory silently. Every memory write — global or project — requires explicit researcher approval of the exact entry text.**

## Memory layers

| Layer | Location | Scope | Versioned | Who sees it |
|---|---|---|---|---|
| Global (user) memory | the harness's user-level instruction file: `~/.claude/CLAUDE.md` (Claude Code), `~/.codex/AGENTS.md` (Codex), `~/.cursor/rules/` (Cursor), `~/.config/opencode/AGENTS.md` (OpenCode), `~/.gemini/GEMINI.md` (Antigravity) | All projects of this user | No | This user |
| Auto memory | harness-managed notes outside the repo (e.g. Claude Code `~/.claude/projects/<project>/memory/`) | One project, one user | No | This user |
| Project instructions | `./AGENTS.md` (team; plus the `CLAUDE.md` import stub for Claude Code) and a personal gitignored file where supported (`CLAUDE.local.md`) | One project | `AGENTS.md` yes | Team / this user |
| Decision logs | `decisions/` (`answers.md`, decisions, failure-learning entries) | One project | Yes | Team |
| Lab notebook | `notebook/NOTEBOOK.md` | One project | Yes | Team |
| Experiment card | `experiments/<ID>/card.md` | One experiment | Yes | Team |

- **Global memory** loads into every session of every project — the most expensive and most dangerous layer. Project-specific rules go there only with explicit approval of exactly that.
- **Auto memory** lives outside the repo and is not reviewed by the team. Lessons and decisions that matter go to **versioned project artifacts** instead.
- **Project memory is the default destination**: load-bearing rules in `AGENTS.md` (short — `reference/context-economy.md`), decisions and lessons in `decisions/`, what-happened in `NOTEBOOK.md`, per-run detail in the card.

## What may be stored where

| Kind of knowledge | Correct layer |
|---|---|
| Personal, project-independent preference | Global memory — with approval |
| Reusable project lesson (leaked split, unseeded run, wrong prior) | `decisions/` entry; an `AGENTS.md` hard rule if load-bearing |
| Methodological decision | Decision log / ADR |
| One-off finding tied to one experiment | The card / `NOTEBOOK.md` |
| Secrets, credentials, tokens, private endpoints | Nowhere. Never. |
| Sensitive/embargoed data, PII | Nowhere. Reference by ID/hash only. |
| Unconfirmed conclusions | Nowhere until confirmed |

## Mandatory confirmation before any memory write

Show the exact proposed text and ask:

```text
I found a reusable lesson from this:

<proposed memory entry>

Do you want me to record this?
1. Yes, global memory.
2. Yes, project memory only (decision log).
3. No, keep it only in the card / notebook.
4. Revise the wording first.
```

1. **Global** → append to the harness's user-level file; only on this explicit choice, and only if genuinely project-independent.
2. **Project** (default) → append to a decision log in the failure-learning entry format; propose an `AGENTS.md` hard rule only if load-bearing.
3. **Card/notebook only** → no memory write.
4. **Revise** → rewrite and ask again.

No answer → nothing is written.

## Entry format

`templates/memory/failure-learning-entry.md` (installed by the `failure-learning` pack): title, date, scope, trigger, what went wrong, root cause, rule to remember, where to apply / not apply, source card.

## Security and privacy

- Never store secrets, credentials, tokens or connection strings in any layer.
- Never store sensitive, embargoed or personal data — reference datasets by ID and hash (`reference/frozen-artifacts-policy.md`, data-sensitivity answers in `decisions/answers.md`).
- Everything in `decisions/`, `NOTEBOOK.md`, the cards and `AGENTS.md` is visible to everyone with repo access.

## Relationship to skills and hooks

The `failure-learning` pack implements this policy for research mistakes (wrong prior, leaked split, unseeded run, metric shopping); the `closing` skill proposes, never writes, missing decisions and lessons at the end of a session. Advisory hooks may *suggest* these; they never write memory.
