#!/usr/bin/env bash
set -euo pipefail

# ADVISORY hook (PreToolUse on file writes/edits). Warns when the target path is
# under a non-retired frozen-manifest entry. Never blocks (block-frozen-writes.sh
# is the blocking variant). Fails open when jq is missing.

# ---- RDD hook adapter (identical in every kit hook; contract: hooks/hooks-policy.md) ----
# Reads the harness payload from stdin (Claude Code, Codex, Cursor and Antigravity shapes) or from
# explicit RDD_HOOK_* variables / a file-path argument, and exposes:
#   rdd_project_dir, rdd_file, rdd_command, rdd_content, rdd_tool, rdd_session, rdd_event
# Output helpers: rdd_block "<reason>" (deny + exit) and rdd_context "<text>" (advisory), formatted
# per RDD_HOOK_OUTPUT: exit (default: Claude Code / Codex / Cursor), cursor, antigravity, plain.
rdd_input=""
if [ ! -t 0 ]; then rdd_input="$(cat)"; fi
rdd_jq() {  # $1 = jq filter; prints the first line of the result, or nothing; never fails
  local out=""
  if [ -n "$rdd_input" ] && command -v jq >/dev/null 2>&1; then
    out="$(printf '%s' "$rdd_input" | jq -r "$1" 2>/dev/null | tr -d '\r' | head -n 1)" || true
  fi
  printf '%s' "$out"
  return 0
}
rdd_jq_multi() {  # like rdd_jq but keeps every line (file contents)
  local out=""
  if [ -n "$rdd_input" ] && command -v jq >/dev/null 2>&1; then
    out="$(printf '%s' "$rdd_input" | jq -r "$1" 2>/dev/null | tr -d '\r')" || true
  fi
  printf '%s' "$out"
  return 0
}
rdd_project_dir="${RDD_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-}}}"
[ -n "$rdd_project_dir" ] || rdd_project_dir="$(rdd_jq '.cwd // .workspacePaths[0]? // empty')"
[ -n "$rdd_project_dir" ] || rdd_project_dir="$(pwd)"
rdd_file="${RDD_HOOK_FILE:-${1:-}}"
[ -n "$rdd_file" ] || rdd_file="$(rdd_jq '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // .file_path // .toolCall.args.TargetFile // empty')"
rdd_command="${RDD_HOOK_COMMAND:-}"
[ -n "$rdd_command" ] || rdd_command="$(rdd_jq '.tool_input.command // .command // .toolCall.args.CommandLine // empty')"
rdd_content="${RDD_HOOK_CONTENT:-}"
[ -n "$rdd_content" ] || rdd_content="$(rdd_jq_multi '.tool_input.content // .tool_input.new_string // .content // .toolCall.args.CodeContent // .toolCall.args.ReplacementContent // (if ((.edits? // null) | type) == "array" and ((.edits | length) > 0) then (.edits | map(.new_string // "") | join("\n")) else empty end)')"
rdd_tool="${RDD_HOOK_TOOL:-}"
[ -n "$rdd_tool" ] || rdd_tool="$(rdd_jq '.tool_name // .toolCall.name // empty')"
rdd_session="${RDD_HOOK_SESSION:-}"
[ -n "$rdd_session" ] || rdd_session="$(rdd_jq '.session_id // .conversationId // .conversation_id // empty')"
rdd_session="${rdd_session:-no-session}"
rdd_event="${RDD_HOOK_EVENT:-}"
[ -n "$rdd_event" ] || rdd_event="$(rdd_jq '.hook_event_name // empty')"
rdd_event="${rdd_event:-PreToolUse}"
# shellcheck disable=SC2329,SC2317  # helper may be unused in a given hook
rdd_block() {  # deny with a reason, then exit
  case "${RDD_HOOK_OUTPUT:-exit}" in
    antigravity) jq -n --arg r "$1" '{decision: "deny", reason: $r}'; exit 0 ;;
    cursor) jq -n --arg r "$1" '{permission: "deny", user_message: $r, agent_message: $r}'; exit 0 ;;
    *) printf '%s\n' "$1" >&2; exit 2 ;;
  esac
}
# shellcheck disable=SC2329,SC2317  # helper may be unused in a given hook
rdd_context() {  # advisory text for the agent; never blocks
  case "${RDD_HOOK_OUTPUT:-exit}" in
    exit) if command -v jq >/dev/null 2>&1; then
            jq -n --arg e "$rdd_event" --arg r "$1" '{hookSpecificOutput: {hookEventName: $e, additionalContext: $r}}'
          else printf '%s\n' "$1"; fi ;;
    cursor) jq -n --arg r "$1" '{permission: "allow", agent_message: $r}' ;;
    *) printf '%s\n' "$1" >&2 ;;
  esac
}
# ---- end RDD hook adapter ----

# Path relative to the project root, so "launchers/x.sh" and "/abs/proj/launchers/x.sh" match alike.
rel="${rdd_file#"$rdd_project_dir"/}"
rel="${rel#./}"

manifest="$rdd_project_dir/data/frozen-manifest.json"
[ -f "$manifest" ] || exit 0
[ -n "$rdd_file" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

while IFS= read -r p; do
  [ -n "$p" ] || continue
  case "$rel" in
    *"$p"*)
      rdd_context "RDD WARNING: '$rel' is under a FROZEN artifact ($p). Frozen artifacts never mutate; a replacement gets a NEW name and a decision entry. Verify integrity with: python scripts/check_frozen.py"
      exit 0
      ;;
  esac
done < <(jq -r '.frozen[]? | select(.retired | not) | .path' "$manifest" 2>/dev/null | tr -d '\r')

exit 0
