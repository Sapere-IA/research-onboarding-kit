# `<harness-dir>/rdd-kit-manifest.json` — install manifest schema

Written by onboarding as the **last** generation step, and rewritten by the `rdd-update` skill after every update. It lives in the primary harness directory (`.claude/` for Claude Code, `.cursor/`, `.opencode/`, `.agents/`, or `.codex/` for Codex). It records which kit version the harness came from, which harness(es) it was installed for, and, per installed file, enough to detect both kit-side changes and local edits.

```json
{
  "kit": "research-onboarding-kit",
  "kit_version": "2.0.0",
  "kit_source": "<git URL or local path the kit was installed from>",
  "installed_at": "YYYY-MM-DD",
  "updated_at": "YYYY-MM-DD",
  "commit_rendered_pages": false,
  "harness": {
    "primary": "claude-code",
    "dir": ".claude",
    "instruction_files": ["AGENTS.md", "CLAUDE.md"],
    "additional": [
      { "name": "codex", "dirs": [".codex", ".agents"] }
    ]
  },
  "files": [
    {
      "installed_path": ".claude/skills/research-workflow/templates/render/research.css",
      "kit_path": "templates/render/research.css",
      "kit_sha256": "<sha256 of the kit source file at install time>",
      "installed_sha256": "<sha256 of the installed copy as written>",
      "adapted": false
    },
    {
      "installed_path": "AGENTS.md",
      "kit_path": "templates/AGENTS.md.template",
      "kit_sha256": "…",
      "installed_sha256": "…",
      "adapted": true
    },
    {
      "installed_path": ".codex/agents/skeptic.toml",
      "kit_path": "agents/skeptic.md",
      "kit_sha256": "…",
      "installed_sha256": "…",
      "adapted": true
    }
  ]
}
```

Field rules:

- `harness.primary` — one of `claude-code`, `codex`, `cursor`, `opencode`, `antigravity`, or a free-form name for another harness; `harness.dir` is `<harness-dir>`; `harness.instruction_files` lists the generated instruction files (`AGENTS.md`, plus `CLAUDE.md` when Claude Code is used); `harness.additional` lists every other harness installed for, with its directories. The `rdd-update` skill uses this block to find every copy to refresh. A manifest without the block means `claude-code` / `.claude`.
- `commit_rendered_pages` — the onboarding answer on whether rendered `.html` pages are committed (`true`) or gitignored (`false`, default). `rdd-update` uses it when a migration touches `.gitignore` or rendered pages.
- `adapted: false` — the file was copied byte-for-byte from the kit (`kit_sha256 == installed_sha256`). The `rdd-update` skill may refresh it mechanically **iff** its current hash still equals `installed_sha256`; otherwise the researcher edited it locally and must be asked.
- `adapted: true` — the file was generated or adapted for the project (placeholders filled, content merged, project-specific recipe such as `cluster-ops`, or converted to the harness's agent format such as Codex TOML). The `rdd-update` skill never overwrites it mechanically; changes are merged with researcher approval, guided by the changelog.
- Hashes are lowercase hex SHA-256 of file bytes (`git hash-object` is NOT used; use `sha256sum` / `shasum -a 256` / `Get-FileHash -Algorithm SHA256`).
- Every file the onboarding created or modified for the harness gets a record — including `AGENTS.md` (and the `CLAUDE.md` stub), agents, skills, document templates, render assets, `scripts/render.sh` / `render.ps1`, validation scripts, vendored `<harness-dir>/reference/*` policies, hook scripts and wiring files, in every harness directory.
- Research records are **never** listed: cards, `registry.json`, `NOTEBOOK.md`, `PLAN.md` content, configs, launchers, `results/`, data and frozen artifacts belong to the project, not the harness, and `rdd-update` never refreshes them (it only migrates their format when a changelog entry says so).
- `files[].kit_path` uses the kit's repo-relative path at `kit_version`. When a file has no kit source (e.g. a generated `decisions/answers.md`), set `kit_path: null` and `kit_sha256: null` with `adapted: true`.
