#!/usr/bin/env python3
"""Check that a target project has the expected RDD harness structure.

Run after onboarding (and by the rdd-update skill). Reports missing expected
files/dirs. Harness-aware: the harness directory is <harness-dir> (default
.claude; Codex installs skills under .agents/skills). Cross-platform: standard
library only.

Usage:
    python scripts/validate_structure.py [--root .] [--harness-dir .claude] [--skills-dir DIR]

Environment: RDD_HARNESS_DIR and RDD_SKILLS_DIR override the defaults.

Exit code 0 if the required structure is present, 1 otherwise. Warnings about
recommended pieces do not fail the check.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def required(h: str, sk: str) -> list[tuple[str, bool]]:
    """(path, is_dir) required after a standard onboarding."""
    return [
        ("PLAN.md", False),
        ("experiments", True),
        ("experiments/registry.json", False),
        ("notebook/NOTEBOOK.md", False),
        ("decisions/answers.md", False),
        (f"{sk}/research-workflow/SKILL.md", False),
        (f"{sk}/research-workflow/templates/render/research.js", False),
        (f"{sk}/research-workflow/templates/render/research.css", False),
        (f"{sk}/research-workflow/templates/render/page-shell.html.template", False),
        (f"{sk}/bro/SKILL.md", False),
        (f"{sk}/closing/SKILL.md", False),
        (f"{sk}/rdd-update/SKILL.md", False),
        (f"{h}/agents", True),
        (f"{h}/context/project-map.md", False),
        ("scripts/render.sh", False),
    ]


def recommended(h: str) -> list[tuple[str, bool]]:
    return [
        ("scripts/render.ps1", False),
        (f"{h}/rdd-kit-manifest.json", False),
        ("scripts/validate_registry.py", False),
        ("scripts/check_frozen.py", False),
        ("scripts/capture_environment.py", False),
        ("scripts/check_placeholders.py", False),
    ]


def check(root: Path, items) -> list[str]:
    missing = []
    for rel, is_dir in items:
        p = root / rel
        ok = p.is_dir() if is_dir else p.is_file()
        if not ok:
            missing.append(rel + ("/" if is_dir else ""))
    return missing


def check_instruction_files(root: Path) -> list[str]:
    """AGENTS.md is canonical; a CLAUDE.md next to it must be the @AGENTS.md import stub."""
    agents = root / "AGENTS.md"
    claude = root / "CLAUDE.md"
    if not agents.is_file():
        if claude.is_file():
            return []  # legacy single-file install; rdd-update migrates it
        return ["AGENTS.md (or a legacy CLAUDE.md)"]
    if claude.is_file():
        text = claude.read_text(encoding="utf-8", errors="replace")
        if "@AGENTS.md" not in text:
            return ["CLAUDE.md must be the two-line `@AGENTS.md` import stub when AGENTS.md exists"]
    return []


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=".")
    ap.add_argument("--harness-dir", default=os.environ.get("RDD_HARNESS_DIR", ".claude"))
    ap.add_argument("--skills-dir", default=os.environ.get("RDD_SKILLS_DIR", ""),
                    help="skills directory (default <harness-dir>/skills; Codex: .agents/skills)")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    h = args.harness_dir.rstrip("/\\")
    sk = (args.skills_dir or f"{h}/skills").rstrip("/\\")

    errors = check_instruction_files(root) + check(root, required(h, sk))
    missing_recommended = check(root, recommended(h))

    if missing_recommended:
        print("warnings (recommended, not fatal):")
        for m in missing_recommended:
            print(f"  - missing {m}")
    if (root / "CLAUDE.md").is_file() and not (root / "AGENTS.md").is_file():
        print("warning: legacy CLAUDE.md without AGENTS.md (run the rdd-update skill)")

    if errors:
        print(f"structure validation FAILED (harness dir {h}) -- missing or invalid:")
        for m in errors:
            print(f"  - {m}")
        return 1

    print(f"structure validation OK (harness dir {h}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
