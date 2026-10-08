# `experiments/` — layout and registry schema

This README documents the installed `experiments/` tree. It is copied into the
target project (adapted) so a future session knows the conventions. The
`{{PLACEHOLDER}}` tokens elsewhere in the templates are instantiated per
experiment, not during onboarding.

## Folder layout

```
experiments/
├── registry.json                # MACHINE STATE — status source of truth
├── registry.html                # dashboard, rendered from registry.json (generated)
└── E<seq>_<slug>/               # one folder per experiment
    ├── card.md                  # the experiment card — one markdown doc, all sections
    ├── card.html                # rendered review page (generated)
    ├── card.feedback.md         # the researcher's review, deleted once applied (gitignored)
    └── analysis.md              # optional analysis report
```

Sibling top-level dirs carry the same experiment IDs:
`configs/E<seq>_<slug>.yaml`, `launchers/E<seq>_<slug>.sh`,
`results/E<seq>_<slug>/`.

Render with `sh scripts/render.sh experiments/` (registry + docs in the folder)
or `sh scripts/render.sh experiments/<ID>/card.md`. Never edit the `.html`.

## Naming

Default ID convention: `E<seq>_<slug>` (e.g. `E001_baseline-repro`,
`E012_frozen-encoder`). The same ID appears on the card, the config, the
launcher, the results dir, and the registry record. A re-run varying the same
axis gets a **new** ID, e.g. `E012_frozen-encoder__v2`, with `supersedes` set to
the original.

## `registry.json` record schema

`registry.json` is the single machine-readable source of truth.
`scripts/validate_registry.py` checks it against the card files and the
`results/` directories. Each entry in `experiments[]`:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `E<seq>_<slug>`; unique |
| `title` | string | short human title |
| `status` | enum | `draft` \| `approved` \| `launched` \| `analyzed` \| `done` \| `failed` \| `abandoned` |
| `plan_ref` | string | `PLAN.md §…` phase/row this card serves |
| `supersedes` | string\|null | ID this card replaces, or `null` |
| `card_path` | string | path to `card.md` |
| `config` | string\|null | path to the run config |
| `launcher` | string\|null | path to the launcher |
| `results_dir` | string\|null | path to `results/<id>/` |
| `code_version` | string\|null | git SHA the run used |
| `gate_result` | enum | `pending` \| `pass` \| `fail` \| `inconclusive` |
| `smoke_passed` | string\|null | date the smoke test passed, or `null` |
| `frozen_inputs` | string[] | frozen-manifest IDs this run consumed |
| `budget` | string\|null | declared compute budget |
| `actual_cost` | string\|null | measured cost after the run |
| `created` | string | ISO date |
| `updated` | string | ISO date |

### Consistency rules (enforced by `validate_registry.py`)

- Every `card_path` exists; every folder with a `card.md` has a registry record.
- Card frontmatter `status` / `gate_result` equal the record's.
- `status` ∈ the enum above; `gate_result` ∈ its enum.
- A `launched`/`analyzed`/`done` record has a non-null `config` and `results_dir`.
- A `done` record has `gate_result` ≠ `pending` and a non-empty `results_dir` on disk.
- A record claiming `done`/`analyzed` whose `results/<id>/` is empty is flagged
  (artifacts win — reconcile per `reference/session-recovery.md`).
- `smoke_passed` is non-null before `status` reaches `launched`
  (`reference/compute-budget-policy.md`).
- `supersedes`, if set, names an existing record.

The card's frontmatter mirrors `status` and `gate_result`; `validate_registry.py`
errors when they disagree. `registry.json` is authoritative — update both together.
