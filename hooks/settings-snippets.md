# Hook wiring snippets per harness

Examples only. **Nothing here is active until the researcher approves it and it is written into the harness's hook file.** Copy the chosen scripts into `<harness-dir>/hooks/`, adapt paths and matchers, and verify event and tool names against the installed harness version. The scripts are identical in every harness (`hooks-policy.md`, "Hook contract"); only the wiring differs.

Two tiers: **advisory** (enable first) and **blocking** (opt-in, once the loop is trusted). Verdict confirmation (gate 2) has no hook: it stays a human decision.

## Claude Code — `.claude/settings.json`

### Advisory tier

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/suggest-card.sh" },
          { "type": "command", "command": "bash .claude/hooks/frozen-path-warning.sh" },
          { "type": "command", "command": "bash .claude/hooks/smoke-test-reminder.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/post-results-reminder.sh" }
        ]
      }
    ]
  }
}
```

### Blocking tier

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/block-unapproved-launch.sh" },
          { "type": "command", "command": "bash .claude/hooks/block-frozen-writes.sh" }
        ]
      }
    ]
  }
}
```

Results usually land through the run itself, not an agent edit: `post-results-reminder.sh` fires only when the agent writes under `results/`. Add `"Bash"` to a matcher only if the team wants the guards on shell commands too (the scripts then see `rdd_command`, not a file path, and allow).

## Codex CLI — `.codex/hooks.json` or `[hooks]` in `.codex/config.toml`

Same events, payload and exit codes as Claude Code: copy the Claude Code JSON into `.codex/hooks.json` with paths changed to `.codex/hooks/...`. TOML equivalent:

```toml
[[hooks.PreToolUse]]
matcher = "Edit|Write"

[[hooks.PreToolUse.hooks]]
type = "command"
command = "bash .codex/hooks/block-unapproved-launch.sh"
timeout = 30
```

Project hooks load only after the project is trusted; the researcher reviews them with `/hooks` on first start.

## Cursor — `.cursor/hooks.json`

Set `RDD_HOOK_OUTPUT=cursor` for JSON denies (exit 2 also blocks); advisory hooks after an edit use `plain`.

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      { "matcher": "Write", "command": "RDD_HOOK_OUTPUT=cursor bash .cursor/hooks/suggest-card.sh" },
      { "matcher": "Write", "command": "RDD_HOOK_OUTPUT=cursor bash .cursor/hooks/frozen-path-warning.sh" },
      { "matcher": "Write", "command": "RDD_HOOK_OUTPUT=cursor bash .cursor/hooks/smoke-test-reminder.sh" },
      { "matcher": "Write", "command": "RDD_HOOK_OUTPUT=cursor bash .cursor/hooks/block-unapproved-launch.sh" },
      { "matcher": "Write", "command": "RDD_HOOK_OUTPUT=cursor bash .cursor/hooks/block-frozen-writes.sh" }
    ],
    "afterFileEdit": [
      { "command": "RDD_HOOK_OUTPUT=plain bash .cursor/hooks/post-results-reminder.sh" }
    ]
  }
}
```

Drop the two `block-*` lines for the advisory tier. `CURSOR_PROJECT_DIR` is picked up by the adapter.

## Antigravity — `.agents/hooks.json`

Matches Antigravity tool names and expects a stdout JSON decision: set `RDD_HOOK_OUTPUT=antigravity`.

```json
{
  "rdd-harness": {
    "PreToolUse": [
      {
        "matcher": "write_to_file|replace_file_content|multi_replace_file_content",
        "hooks": [
          { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/suggest-card.sh", "timeout": 10 },
          { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/frozen-path-warning.sh", "timeout": 10 },
          { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/smoke-test-reminder.sh", "timeout": 10 },
          { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/block-unapproved-launch.sh", "timeout": 10 },
          { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/block-frozen-writes.sh", "timeout": 10 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "write_to_file|replace_file_content|multi_replace_file_content",
        "hooks": [ { "type": "command", "command": "RDD_HOOK_OUTPUT=antigravity bash .agents/hooks/post-results-reminder.sh", "timeout": 10 } ]
      }
    ]
  }
}
```

The project directory comes from the payload's `workspacePaths[0]`.

## OpenCode — `.opencode/plugins/rdd-hooks.js`

OpenCode runs JavaScript plugins, not shell hooks. This plugin calls the same scripts through the explicit-override interface (no stdin); a non-zero exit blocks the tool call.

```js
// .opencode/plugins/rdd-hooks.js — forwards RDD hook scripts (adapt paths and the lists below)
import { execFileSync } from "node:child_process"

const HOOKS = ".opencode/hooks"
const BLOCKING = ["block-unapproved-launch.sh", "block-frozen-writes.sh"]     // empty for the advisory tier
const ADVISORY_BEFORE = ["suggest-card.sh", "frozen-path-warning.sh", "smoke-test-reminder.sh"]
const run = (script, env, directory) => {
  try {
    const out = execFileSync("bash", [`${HOOKS}/${script}`], {
      cwd: directory, env: { ...process.env, RDD_PROJECT_DIR: directory, RDD_HOOK_OUTPUT: "plain", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { ok: true, out: String(out) }
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message) }
  }
}

export const RddHooks = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    if (!["write", "edit"].includes(input.tool)) return
    const env = { RDD_HOOK_FILE: output.args.filePath }
    for (const s of ADVISORY_BEFORE) run(s, env, directory)
    for (const s of BLOCKING) {
      const r = run(s, env, directory)
      if (!r.ok) throw new Error(r.out)
    }
  },
  "tool.execute.after": async (input, output) => {
    if (["write", "edit"].includes(input.tool)) run("post-results-reminder.sh", { RDD_HOOK_FILE: output.args?.filePath }, directory)
  },
})
```

Verify tool names (`write`, `edit`) and argument keys (`filePath`) against the installed OpenCode version. Advisory text from `plain` mode goes to the plugin's stderr.

## Notes

- Advisory hooks never block. Blocking hooks deny through `rdd_block`.
- All hooks fail open when `jq` is missing. Fail-closed needs explicit, recorded approval (`decisions/`).
- Keep matchers narrow: an over-broad blocking hook stops legitimate work.
- Record the harness, its version and the enabled hooks in `decisions/answers.md`.
