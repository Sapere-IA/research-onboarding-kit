# Harness primitives used by this kit

The RDD harness is built from five agent-harness concepts: a **project instruction file**, **skills**, **subagents**, **hooks**, and **MCP servers**, plus local files as memory. Every supported harness (Claude Code, OpenAI Codex CLI, Cursor, OpenCode, Google Antigravity) offers most of them under its own name and directory. This file explains each concept, gives the mapping per harness, and defines the fallback when a harness lacks one.

The kit's own layout uses the Claude Code names (`.claude/`, `CLAUDE.md`) as the **reference layout**. When the kit says `.claude/<x>`, read it as `<harness-dir>/<x>` for the harness you are installing into. Nothing in the kit is Claude Code-only by design; where a harness differs, adapt the file, never the workflow.

## Mapping table

| Concept | Claude Code | Codex CLI | Cursor | OpenCode | Antigravity |
| --- | --- | --- | --- | --- | --- |
| Harness directory (`<harness-dir>`) | `.claude/` | `.codex/` (agents, hooks, config) and `.agents/` (skills) | `.cursor/` | `.opencode/` | `.agents/` |
| Project instruction file | `AGENTS.md` (read natively when no `CLAUDE.md` exists, v2.1.277+), or `CLAUDE.md` importing it with `@AGENTS.md` | `AGENTS.md` (root → cwd, one per directory; `AGENTS.override.md` wins) | `AGENTS.md` (root and nested); `.cursor/rules/*.mdc` for scoped rules | `AGENTS.md` (`CLAUDE.md` read as fallback) | `AGENTS.md` (root and nested); `.agents/rules/*.md` for scoped rules |
| Skills directory | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` | `.cursor/skills/` or `.agents/skills/` (also reads `.claude/skills/`, `.codex/skills/`) | `.opencode/skills/` (also reads `.claude/skills/`, `.agents/skills/`) | `.agents/skills/<name>/SKILL.md` |
| Skill frontmatter | `name`, `description` (+ `argument-hint`) | `name`, `description` | `name`, `description` | `name`, `description` | `name`, `description` |
| Skill invocation | `/research-workflow` | `$research-workflow` or `/skills` | `/` then search the name | agent calls the `skill` tool; ask by name | `/research-workflow` |
| Subagents directory | `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` | `.cursor/agents/<name>.md` (also reads `.claude/agents/`) | `.opencode/agents/<name>.md` | `.agents/agents/<name>.md` |
| Subagent format | Markdown, frontmatter `name`, `description`, `tools`, `model` | TOML: `name`, `description`, `developer_instructions` (body goes here), `sandbox_mode`, `model` | Markdown, frontmatter `name`, `description`, `model`, `readonly` | Markdown, frontmatter `description`, `mode: subagent`, `permission`, `model` | Markdown, frontmatter `name`, `description`, `tools`, `model`, `subagent: true` |
| Subagent invocation | `Agent` tool / by name | `spawn_agent` tool / `@name` | `/name` or by name | `@name` / Task tool | `invoke_subagent` tool |
| Hooks config | `.claude/settings.json` `"hooks"` | `.codex/hooks.json` or `[hooks]` in `.codex/config.toml` (same shape as Claude Code) | `.cursor/hooks.json` (`"version": 1`) | `.opencode/plugins/*.js` (JavaScript plugin, no shell hooks) | `.agents/hooks.json` |
| Hook events used by the kit | `PreToolUse`, `PostToolUse` | `PreToolUse`, `PostToolUse` | `preToolUse`, `afterFileEdit` | `tool.execute.before`, `tool.execute.after` | `PreToolUse`, `PostToolUse` |
| Hook stdin: file path | `.tool_input.file_path` | `.tool_input.file_path` | `.file_path` (afterFileEdit) / `.tool_input` (preToolUse) | `output.args.filePath` (plugin API) | `.toolCall.args.TargetFile` |
| Hook block | exit 2 + stderr, or `hookSpecificOutput.permissionDecision: deny` | exit 2 + stderr, or `hookSpecificOutput.permissionDecision: deny` | exit 2, or stdout `{"permission":"deny"}` | `throw new Error(reason)` | stdout `{"decision":"deny","reason":"…"}` |
| Project dir for hooks | `CLAUDE_PROJECT_DIR` | `.cwd` in stdin | `CURSOR_PROJECT_DIR` | `directory` in plugin context | `.workspacePaths[0]` in stdin |
| MCP config | `.mcp.json` | `[mcp_servers.<name>]` in `.codex/config.toml` | `.cursor/mcp.json` | `"mcp"` block in `opencode.json` | `.agents/mcp_config.json` (`mcpServers`) |
| Context inspection / compaction | `/context`, `/compact [focus]` | `/compact` | summarize from the chat UI | `/compact` (alias `/summarize`) | new conversation; no compaction command documented |

Verified against the vendors' documentation on 2026-09-27 (Claude Code `code.claude.com/docs`; Codex `developers.openai.com/codex`; Cursor `cursor.com/docs`; OpenCode `opencode.ai/docs`; Antigravity `antigravity.google/docs`). Harness features move fast: **re-verify the row you are about to use against the installed version before generating configuration**, and record any deviation in `decisions/answers.md`.

## Project instruction file

The instruction file holds stable project facts and rules: commands, the RDD hard rules (one change per experiment, two human gates, frozen artifacts, every run logged), and links to the plan, registry, notebook and project map. All supported harnesses read `AGENTS.md`, so the kit generates **`AGENTS.md` as the single source of truth** from `templates/AGENTS.md.template`.

- **Claude Code** reads `AGENTS.md` directly when the project has no `CLAUDE.md`, but only in recent versions and not in every session type. For reliability, also generate the two-line `CLAUDE.md` from `templates/CLAUDE.md.template`, which imports `AGENTS.md` with `@AGENTS.md`. Claude Code deduplicates the import, so nothing loads twice.
- **Codex, Cursor, OpenCode, Antigravity** read `AGENTS.md` natively; no stub is needed. Never keep per-harness copies of the content.
- Keep it short and project-specific; long procedures go into the skill. Never embed the directory tree; link the project map.

## Skills

A skill is a folder with `SKILL.md` (YAML frontmatter `name` + `description`, then instructions) plus supporting files. The format is shared by every supported harness, so the kit's skills install **unchanged**; only the directory differs.

- Install the core skills (`research-workflow`, `rdd-update`, `bro`, `closing`) under `<harness-dir>/skills/`. The `research-workflow` folder also carries the document templates and the render assets (`templates/render/`) that `scripts/render.sh` looks up there.
- Cursor, OpenCode and Codex also read `.agents/skills/`, so a project used with several of them can install skills once under `.agents/skills/`; Claude Code reads only `.claude/skills/`.
- Invocation differs per harness. The generated `AGENTS.md` names the skill and says "invoke it by name"; installed files never hard-code one harness's syntax.
- **Fallback when a harness has no skill support:** install the folder anyway and add to `AGENTS.md`: "Before any experiment work, read `<harness-dir>/skills/research-workflow/SKILL.md` and follow it."

## Subagents

The kit defines six roles: `research-lead`, `experiment-designer`, `analyst`, `skeptic`, `scribe`, `literature-scout`. Each is a markdown file with `name`/`description`/`tools` frontmatter and an instruction body. The **body is the role**; the frontmatter is packaging.

- **Markdown harnesses** (Claude Code, Cursor, OpenCode, Antigravity): copy the file, keep the body, adapt the frontmatter (see the table). Drop `tools:` where the harness uses another permission model (OpenCode `permission`, Cursor `readonly`). Keep `skeptic` and `literature-scout` read-only in every format (Cursor `readonly: true`; OpenCode `permission` denying edits; `tools` without Write/Edit elsewhere).
- **Codex CLI**: convert to TOML: `name`, `description`, and the whole markdown body as `developer_instructions` (multi-line string). Use `sandbox_mode = "read-only"` for `skeptic`, `literature-scout` and `research-lead`.
- **Fallback when a harness has no subagents:** keep the files under `<harness-dir>/agents/` as role definitions and add to `AGENTS.md`: "When the workflow calls for the `<role>` agent, read `<harness-dir>/agents/<role>.md` and act as that role in the main conversation, one role at a time."
- Whatever the harness, roles never cross an RDD gate: card approval and verdict confirmation stay with the researcher.

## Hooks

Hooks are deterministic checks around tool calls: skills guide, hooks enforce. The kit ships harness-neutral example **scripts** (one adapter block reads every harness's payload, or `RDD_HOOK_*` environment variables) and per-harness **wiring** snippets: `hooks/hooks-policy.md` ("Hook contract") and `hooks/settings-snippets.md`.

- Claude Code and Codex share hook JSON shape, events and exit codes: one snippet serves both.
- Cursor uses lowercase events and its own payloads; `RDD_HOOK_OUTPUT=cursor` selects its deny format (exit 2 also blocks).
- Antigravity expects a stdout `{"decision":"deny"}`: `RDD_HOOK_OUTPUT=antigravity`.
- OpenCode has no shell hooks; a small JavaScript plugin calls the same scripts.
- **Fallback when a harness has no hooks:** nothing is installed; the rules stay in `AGENTS.md` and the skill. Hooks are opt-in anyway, so the workflow is unchanged.

## MCP servers

MCP servers connect the agent to external systems (paper search, trackers, GitHub). Server definitions are the same everywhere; only the configuration file differs (see the table). MCPs stay optional and off by default (`mcps/mcp-criteria.md`); the kit is fully usable with none.

## Local files as memory

Independent of the harness, the research record lives in versioned files:

```text
AGENTS.md
PLAN.md
experiments/registry.json          # experiment state (source of truth)
experiments/<ID>/card.md           # one experiment, all sections
configs/  launchers/  results/
notebook/NOTEBOOK.md               # dated entries + "Resume here" handoff
data/frozen-manifest.json
decisions/
```

This is what makes the kit portable: every harness reads and writes the same artifacts, and a project can be worked on with several harnesses at once without translating state.

## Installing for more than one harness

Choose one **primary harness directory** (`questions.md` §0) and install the full harness there. For each additional harness, install only what it cannot read from the primary location: the skills and agents directories (copies, recorded in the manifest), the hook wiring, and the MCP config file. `AGENTS.md`, `PLAN.md`, `experiments/`, `notebook/`, `decisions/` and `scripts/` are shared and never duplicated. Record every directory in the manifest's `harness` block (`<harness-dir>/rdd-kit-manifest.json`) so the `rdd-update` skill can refresh all copies.
