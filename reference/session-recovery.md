# Session recovery

Sessions get interrupted, go stale, or go wrong: days pass, compaction summarizes details away, a run launched last week finally returns, or the agent heads the wrong way for several turns. Every harness has features for this; one rule keeps them safe in an RDD project:

> **Durable artifacts are the source of truth, never chat history.**
> `experiments/registry.json` holds experiment state, the cards (`experiments/<ID>/card.md`) hold hypotheses, designs, runs and results, the decision logs hold settled decisions, `notebook/NOTEBOOK.md` holds what happened (and the `## Resume here` handoff), and `results/` holds what actually came back. A summary, restored checkpoint or resumed conversation is for reorienting — verify anything it claims against the artifacts before acting.

The RDD addition to the SDD rule is **reconcile against `results/`**: runs complete outside the session.

## Feature landscape

| Harness | Recap / resume | Rewind / undo | Compaction | Transcripts |
| --- | --- | --- | --- | --- |
| Claude Code | `/recap`; `claude --continue` / `--resume`; `/branch` | `/rewind` (agent's direct file edits only) | `/compact [focus]` | `~/.claude/projects/`; `/export` |
| Codex CLI | `codex resume` | none — use git | `/compact` | session files |
| Cursor | chat history | checkpoints restore files from chat | summarize / new chat | chat history |
| OpenCode | `/sessions` (alias `/resume`) | `/undo`, `/redo` | `/compact` | `/export` |
| Antigravity | conversation history | none documented — use git | none documented — new conversation | conversation history |

Verified 2026-09-27; re-verify before relying on syntax. Sessions are per machine and directory; none syncs across machines. No rewind restores bash side effects, manual edits, or **external run state**.

## The practices

### 1. Close sessions with the `closing` skill

Before stopping, switching tasks, or handing work over, invoke the `closing` skill: it checks registry, cards, notebook and decisions against what happened, flags unapplied `*.feedback.md` files and unlogged runs, and writes the `## Resume here` block at the top of `notebook/NOTEBOOK.md` (current experiment, status, next action, launched jobs, blockers, uncommitted work). Then it runs a cold-start test: could a fresh session continue from the files alone?

### 2. Reorient — then verify against artifacts

After time away: read `## Resume here` in `NOTEBOOK.md` (and the harness recap, if any), then open the artifacts: `registry.json` for actual statuses, the active card for what was approved and the declared gate, recent notebook entries, the decision logs. The handoff says where to look; the artifacts say what is true.

### 3. Reconcile against `results/`

The conversation can be hours or days behind reality. After any resume or compaction:

- For every `launched` card, check `results/<ID>/`. If outputs arrived, the card is ready for analysis even if the chat says "waiting".
- A run may have **failed** while you were away — check logs and exit status; don't assume success.
- `validate_registry.py` flags status/results disagreements. **Artifacts win**: update card and registry to match the filesystem, then continue.

### 4. Rewind when the agent went the wrong way

Rewinding beats arguing a session back on course — but a launched job, a deleted file or a mutated dataset survives the rewind. Check `git status` and `results/` afterwards.

### 5. Write state when it happens

Verdicts, status changes, gate decisions, run rows and constraints go into the artifacts *when they happen*, so losing a session loses nothing that matters.

## Resume checklist

1. `notebook/NOTEBOOK.md` `## Resume here` — the last handoff.
2. `registry.json` — the experiment you think you are on, and every `launched`/`analyzed` card.
3. Each `launched` card — outputs in `results/<ID>/` now? A failure?
4. The active card — hypothesis, single change, and **declared gate** as approved, not as remembered.
5. Pending `*.feedback.md` files — the researcher's review, not yet applied.
6. `git status` and the diff; decision logs and notebook entries since the context you remember.

If memory and an artifact disagree, trust the artifact and say so before continuing.

## RDD constraints

- Rewind and resume never change experiment state: a card `launched` before a rewind is still `launched`; its outcome is whatever `results/` and the registry show.
- Restored context does not revive an approval: the card on disk is authoritative, and approval is whatever the card and registry say.
- Recovery features are conveniences, not audit trails — artifacts and git history are the record (see `reference/autonomy-policy.md` for runs nobody watches).
