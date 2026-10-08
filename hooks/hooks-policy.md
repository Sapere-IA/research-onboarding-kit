# Hooks policy for the RDD harness

Hooks enforce parts of the experiment loop deterministically, whether or not the agent remembers the rules. The RDD gates protect two things: **launches** and **claims**. The hooks reinforce the launch side (card approval, smoke test, frozen artifacts). The claim side (verdict confirmation, gate 2) stays a human decision by design and has **no hook substitute**.

**Do not enable hooks without explicit researcher approval.**

## Harness support

Hook support differs per harness (`reference/harness-primitives.md`):

| Harness | Hook mechanism | Kit support |
| --- | --- | --- |
| Claude Code | `.claude/settings.json` → `hooks` (`PreToolUse`, `PostToolUse`) | Full: scripts + wiring snippets |
| Codex CLI | `.codex/hooks.json` or `[hooks]` in `.codex/config.toml`; same events, payload and exit codes as Claude Code; loads once the project is trusted | Full: same snippets as Claude Code |
| Cursor | `.cursor/hooks.json` (`preToolUse`, `afterFileEdit`) | Full: scripts read Cursor payloads; `RDD_HOOK_OUTPUT=cursor` for JSON denies |
| Antigravity | `.agents/hooks.json` (`PreToolUse`, `PostToolUse`; tools `write_to_file`, `replace_file_content`) | Full: scripts read `toolCall` payloads; `RDD_HOOK_OUTPUT=antigravity` |
| OpenCode | JavaScript plugins in `.opencode/plugins/` (`tool.execute.before/after`); no shell hooks | Via a small plugin that calls the same scripts |
| Other | none | Nothing installed; rules stay in `AGENTS.md` and the skill (the kit's default posture) |

The hook **scripts are the same file in every harness**; only the wiring differs (`settings-snippets.md`).

## Hook contract

Every kit hook starts with the same adapter block (between `# ---- RDD hook adapter` and `# ---- end RDD hook adapter ----`). It provides these values, explicit overrides first:

| Value | Explicit override | Read from the payload on stdin |
| --- | --- | --- |
| `rdd_project_dir` | `RDD_PROJECT_DIR`, else `CLAUDE_PROJECT_DIR`, else `CURSOR_PROJECT_DIR` | `.cwd` or `.workspacePaths[0]`; else the current directory |
| `rdd_file` | `RDD_HOOK_FILE`, else the first argument | `.tool_input.file_path`, `.file_path` (Cursor), `.toolCall.args.TargetFile` (Antigravity) |
| `rdd_command` | `RDD_HOOK_COMMAND` | `.tool_input.command`, `.command`, `.toolCall.args.CommandLine` |
| `rdd_content` | `RDD_HOOK_CONTENT` | `.tool_input.content` / `.new_string`, Cursor `.edits[]`, Antigravity `CodeContent` |
| `rdd_tool` | `RDD_HOOK_TOOL` | `.tool_name` or `.toolCall.name` |
| `rdd_session` | `RDD_HOOK_SESSION` | `.session_id` or `.conversationId`; default `no-session` |
| `rdd_event` | `RDD_HOOK_EVENT` | `.hook_event_name`; default per script |

Two output helpers, formatted per `RDD_HOOK_OUTPUT`:

| `RDD_HOOK_OUTPUT` | `rdd_block "<reason>"` (deny) | `rdd_context "<text>"` (advisory) | Use for |
| --- | --- | --- | --- |
| `exit` (default) | reason on stderr, exit 2 | `hookSpecificOutput.additionalContext` JSON on stdout | Claude Code, Codex; Cursor also honors exit 2 |
| `cursor` | `{"permission": "deny", …}` on stdout | `{"permission": "allow", "agent_message": …}` | Cursor |
| `antigravity` | `{"decision": "deny", "reason": …}` on stdout | text on stderr | Antigravity |
| `plain` | reason on stderr, exit 2 | text on stderr | OpenCode plugin, wrappers, manual runs |

Rules for adding or adapting a hook:

- Keep the adapter block byte-identical across scripts (CI checks it); put project logic below it and use only the `rdd_*` values.
- Explicit overrides win, so any script runs without stdin: `RDD_HOOK_FILE=launchers/E012_x.sh bash block-unapproved-launch.sh`.
- Block only through `rdd_block`, never `exit 2` directly, so the wiring's output format applies.
- Fail open when `jq` is missing (allow, warn where useful), unless the team explicitly accepts fail-closed.
- Verify event and payload field names against the installed harness version before enabling.

## Environment requirements

The scripts are bash and use `jq` to read hook payloads, `experiments/registry.json` and `data/frozen-manifest.json`. On Windows: Git Bash (or WSL) plus `jq` on `PATH`.

## Safety classification

- **Advisory** — observes and suggests. Never blocks, never writes. Safe to enable first.
- **Blocking** — can stop a tool call. Writes nothing. Enable once the rule is trusted.
- **Mutating** — changes files or state. **The kit ships none.** Adding one needs explicit opt-in and a README listing every side effect.
- **Dangerous** — touches external systems, credentials, git history, clusters or sensitive data. **The kit ships none and recommends against them.**

## The kit's example hooks

All are **examples, disabled by default**. Installing the kit enables none.

| Hook | Class | Behavior |
| --- | --- | --- |
| `suggest-card.sh` | Advisory | Edit to `configs/` or `launchers/` with no approved card for that ID: reminds to draft and approve `experiments/<ID>/card.md`. |
| `frozen-path-warning.sh` | Advisory | Write to a frozen-manifest path: warns. |
| `smoke-test-reminder.sh` | Advisory | Launcher written for an ID with no `smoke_passed`: reminds to run the smoke test first. |
| `post-results-reminder.sh` | Advisory | File lands under `results/<ID>/`: reminds to fill Results and Runs from real outputs, update the registry, run the skeptic and re-render. |
| `block-unapproved-launch.sh` | Blocking (opt-in) | Denies writes to `configs/<ID>.*` or `launchers/<ID>.*` unless the registry says `approved` or later (gate 1). |
| `block-frozen-writes.sh` | Blocking (opt-in) | Denies writes under any non-retired frozen path. |

The experiment ID is the config/launcher basename without its extension (`configs/E012_frozen-encoder.yaml` → `E012_frozen-encoder`).

## What the hooks never do

- Confirm a verdict or declare a gate passed (`reference/human-in-the-loop-policy.md`).
- Launch, delete, upload or mutate anything.
- Write the card, registry, notebook or memory.

## Recommended rollout

1. Install the scripts as examples; enable nothing.
2. Ask which hooks to enable; confirm bash and `jq` on every machine.
3. Enable the advisory tier first.
4. Add the blocking tier once the team trusts the loop.

## Before enabling a hook, record

Harness and wiring file, event, matcher, command (including `RDD_HOOK_OUTPUT`), whether it blocks, which files it reads, and which false positives are acceptable — in `decisions/answers.md`.
