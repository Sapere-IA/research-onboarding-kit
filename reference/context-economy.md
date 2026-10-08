# Context economy

The agent's context window is a scarce, shared resource. Project instructions, file contents, tool definitions and conversation history all compete for it; quality degrades before capacity runs out — instructions dilute, earlier decisions fade, settled things get re-derived.

## The principle

Load the minimum context the current step needs, keep durable knowledge in files instead of chat, and reset between unrelated tasks.

## Harness commands

| Harness | Inspect context usage | Compact / summarize | Fresh start |
| --- | --- | --- | --- |
| Claude Code | `/context` | `/compact [focus instructions]` | `/clear` |
| Codex CLI | `/status` | `/compact` | `/new` |
| Cursor | context indicator in the chat UI | summarize from the chat UI / new chat | new chat |
| OpenCode | session view | `/compact` (alias `/summarize`) | `/new` (alias `/clear`) |
| Antigravity | conversation view | no compaction command documented — start a new conversation | new conversation |

Verified 2026-09-27; re-verify against the installed version.

## Practices

### Keep `AGENTS.md` concise and linked

`AGENTS.md` loads into every session, so every line has a permanent cost. Keep stable facts and short rules there (commands, hard rules, locations); link deeper files (policies, skills, project map, `PLAN.md`, decision logs) instead of copying them. Multi-step procedures belong in the `research-workflow` skill, whose body loads only when used. A section longer than a screen belongs in a linked file.

### Compact between unrelated tasks — selectively

Compact between unrelated experiments, after noisy log or results triage, or when usage climbs. Where the harness accepts focus instructions, preserve:

- the approved card's hypothesis (`H1`), single change (`C1`) and gate (`G1`);
- card status and next step;
- constraints discovered (data quirks, leakage risks, environment gotchas);
- unresolved questions.

```text
/compact Preserve: E012's approved gate G1 (ECE down ≥20%, accuracy within 0.5pt),
that it is launched as SLURM job 4417291 awaiting results, that val_frozen_v2 must
not be reshuffled, and the open question Q1 about seed variance.
```

Compaction is safe because durable truth lives in files (`experiments/registry.json`, the cards, `notebook/NOTEBOOK.md`, decision logs). Write anything that matters to an artifact **before** compacting. Where a harness cannot compact, write the artifacts and start fresh.

### Delegate noisy research to subagents

Locating code, surveying a results directory, triaging training logs, scanning a dataset — delegate to a subagent and keep only the conclusion. `literature-scout` and `skeptic` are read-only by design for this reason. Where the harness has no subagents, do the exploration in a fresh session and record the conclusion.

### Skills for long procedures; MCPs only when needed

The experiment loop, the reproducibility audit, the cluster hand-over are skills, loaded on invocation — never pasted into `AGENTS.md`. Every configured MCP adds tool definitions to every session: configure per project, only when needed, scoped to a subagent where possible (`mcps/mcp-criteria.md`, `reference/cli-vs-mcp-policy.md`).

### Read rendered pages' sources, not the pages

Human-facing docs are markdown rendered to HTML. Read and edit the `.md`; never load a rendered `.html` (it embeds the CSS/JS bundle).

## Good vs bad context loading

| Situation | Bad (context-expensive) | Good (context-economical) |
|---|---|---|
| Project orientation | Paste the tree and ten files into chat | Link the project map from `AGENTS.md` |
| The experiment loop | Copy the workflow into `AGENTS.md` | Keep it in the `research-workflow` skill |
| Triaging a long run log | Read the whole log in the main session | Subagent summarizes; returns the failure + line refs |
| Reviewing a card | Open `card.html` | Read `card.md` |
| Task switch | Continue in the same long session | Compact, or start fresh if unrelated |
| External tools | Enable every MCP globally | Configure per project, scope heavy ones to subagents |
| Past decisions | Rely on chat history | Decision logs / cards, linked from `AGENTS.md` |

## Where durable context lives

| Kind of knowledge | Artifact |
|---|---|
| Stable rules and commands | `AGENTS.md` (short, linked) |
| Plan, phases, gates | `PLAN.md` |
| Experiment state | `experiments/registry.json` |
| Per-experiment design, runs, results, verdict | `experiments/<ID>/card.md` |
| Decisions and rejected options | `decisions/` |
| What happened; the resume handoff | `notebook/NOTEBOOK.md` |
| Procedures | `<harness-dir>/skills/` |
