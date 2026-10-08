#!/usr/bin/env python3
"""Validate experiments/registry.json against the cards and results/ dirs.

registry.json is the source of truth for experiment state. This checks that it is
internally consistent and that it agrees with what is on disk: each card.md's
frontmatter (status, gate_result) and results/<ID>/ (artifacts win, per
reference/session-recovery.md). Cross-platform: standard library only.

Usage:
    python scripts/validate_registry.py [--root .] [--registry experiments/registry.json]

Exit code 0 if consistent, 1 if any error is found.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

STATUSES = {"draft", "approved", "launched", "analyzed", "done", "failed", "abandoned"}
GATE_RESULTS = {"pending", "pass", "fail", "inconclusive"}
# Statuses that imply the run has been set up / executed.
RUN_STATUSES = {"launched", "analyzed", "done"}


# Card frontmatter keys that must equal the registry record.
MIRRORED_KEYS = ("status", "gate_result")


def read_frontmatter(path: Path) -> dict[str, str]:
    """Simple `key: value` YAML frontmatter (the kit's convention); {} if none."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return {}
    if not lines or not lines[0].startswith("---"):
        return {}
    meta: dict[str, str] = {}
    for line in lines[1:]:
        if line.startswith("---"):
            return meta
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.split(" #", 1)[0].strip().strip("'\"")
        meta[key.strip()] = value
    return {}  # frontmatter never closed


def load_registry(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def validate(root: Path, registry_path: Path, warnings: list[str] | None = None) -> list[str]:
    errors: list[str] = []
    if warnings is None:
        warnings = []
    if not registry_path.exists():
        return [f"registry not found: {registry_path}"]

    try:
        data = load_registry(registry_path)
    except json.JSONDecodeError as exc:
        return [f"registry is not valid JSON: {exc}"]

    experiments = data.get("experiments")
    if not isinstance(experiments, list):
        return ["registry has no 'experiments' list"]

    ids: set[str] = set()
    for i, rec in enumerate(experiments):
        rid = rec.get("id", f"<record {i}>")
        if not rec.get("id"):
            errors.append(f"record {i}: missing 'id'")
        if rid in ids:
            errors.append(f"{rid}: duplicate id")
        ids.add(rid)

        status = rec.get("status")
        if status not in STATUSES:
            errors.append(f"{rid}: invalid status {status!r} (expected one of {sorted(STATUSES)})")

        gate = rec.get("gate_result", "pending")
        if gate not in GATE_RESULTS:
            errors.append(f"{rid}: invalid gate_result {gate!r}")

        # card_path must exist
        card_path = rec.get("card_path")
        if not card_path:
            errors.append(f"{rid}: missing 'card_path'")
        elif not (root / card_path).exists():
            errors.append(f"{rid}: card_path does not exist: {card_path}")
        elif card_path.endswith(".html"):
            warnings.append(f"{rid}: legacy card.html (v1); convert to card.md with the rdd-update skill")
        else:
            meta = read_frontmatter(root / card_path)
            if not meta:
                errors.append(f"{rid}: {card_path} has no frontmatter")
            for key in MIRRORED_KEYS:
                reg_value = rec.get(key, "pending" if key == "gate_result" else None)
                if meta and meta.get(key) != reg_value:
                    errors.append(f"{rid}: card {key} {meta.get(key)!r} != registry {reg_value!r} "
                                  "(update both together)")

        # smoke test must be recorded before launch
        if status in RUN_STATUSES and not rec.get("smoke_passed"):
            errors.append(f"{rid}: status {status} but smoke_passed is empty "
                          "(smoke test must pass before launch)")

        # run statuses need a config and results dir field
        if status in RUN_STATUSES:
            if not rec.get("config"):
                errors.append(f"{rid}: status {status} but no 'config' recorded")
            if not rec.get("results_dir"):
                errors.append(f"{rid}: status {status} but no 'results_dir' recorded")

        # analyzed/done must have real results on disk
        if status in {"analyzed", "done"}:
            rdir = rec.get("results_dir")
            if rdir:
                rpath = root / rdir
                empty = (not rpath.exists()) or not any(rpath.iterdir())
                if empty:
                    errors.append(f"{rid}: status {status} but results_dir is missing or empty "
                                  f"on disk: {rdir} (artifacts win -- reconcile)")

        # done must have a real verdict
        if status == "done" and gate == "pending":
            errors.append(f"{rid}: status done but gate_result still 'pending'")

        # supersedes must name an existing record
        sup = rec.get("supersedes")
        if sup and sup not in ids and sup not in {e.get("id") for e in experiments}:
            errors.append(f"{rid}: supersedes unknown id {sup!r}")

    # Every experiment folder on disk should have a registry record.
    exp_dir = root / "experiments"
    if exp_dir.exists():
        for child in sorted(exp_dir.iterdir()):
            has_card = (child / "card.md").exists() or (child / "card.html").exists()
            if child.is_dir() and has_card and child.name not in ids:
                errors.append(f"experiments/{child.name}/ has a card but no registry record")

    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=".", help="project root (default: cwd)")
    ap.add_argument("--registry", default="experiments/registry.json",
                    help="path to registry.json relative to root")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    warnings: list[str] = []
    errors = validate(root, root / args.registry, warnings)

    for w in warnings:
        print(f"warning: {w}")
    if errors:
        print("registry validation FAILED:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("registry validation OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
