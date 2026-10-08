# The experiment loop

The operational detail behind `SKILL.md`. ⛔ marks the two human gates. Formats, rendering and feedback: `doc-format.md`.

## 1. Classify

`classification-policy.md`:

- **Infrastructure** (pipelines, loaders, eval code, metrics): write `specs/<module>/spec.md` from `infra-spec.md.template` (contract + acceptance tests) before code; render it and get approval; tests pass before `done`.
- **Analysis / writing**: write `reports/<slug>.md` (or `experiments/<ID>/analysis.md`) from `analysis.md.template`; every number cites a card or dataset ID. Not gated — reading and plotting stay friction-free.
- **Experiment**: continue.

## 2. Draft the card

Copy `card.md.template` to `experiments/<ID>/card.md` and fill it: Summary, H1, **exactly one** C1, baseline, metrics and gates (M*, G*), setup, budget, plan. Keep to the budgets in `doc-format.md`.

- The card references its `PLAN.md` phase (`plan_ref`). A card that does not fit the plan is a plan-change proposal — raise it.
- The `experiment-designer` refuses a card with more than one change, undeclared gates, or no baseline.
- Add the registry record (`status: draft`), then render: `sh scripts/render.sh experiments/<ID>/card.md`.

## 3. ⛔ Researcher approves the card

Point the researcher at `experiments/<ID>/card.html`. They review it there and save `card.feedback.md` (or answer in chat). Apply the feedback; an approving file with no change/reject items is the approval. Set `status: approved` on the card and in the registry, add a notebook entry. The change, gates and budget are now frozen; changing them later needs a dated decision (`reference/research-integrity-policy.md`).

No config, launcher or run before this. The `block-unapproved-launch` hook can enforce it.

## 4. Build run artifacts

- **Config** `configs/<ID>.yaml` — every result-affecting knob; one config per card.
- **Launcher** `launchers/<ID>.sh` — ID, output dir, resume flag, scheduler block.
- **Smoke test** — the smallest run proving the job will not crash; it **must pass locally** first. Record the date in `smoke_passed` (card + registry) and as a Runs row.

No smoke test defined yet → cluster submissions stay blocked until it is (`reference/compute-budget-policy.md`).

## 5. Launch

- Cheap and local within the budget: the agent may run it (`reference/human-in-the-loop-policy.md`).
- Cluster, paid or long: hand over the **exact command**, the output location and what to paste back (job ID or "done") — the `cluster-ops` pack holds the recipe. Add the Runs row, set `launched`, and **wait**. Never write expected numbers.

## 6. Collect and analyze

When `results/<ID>/` has outputs:

- Check them against the declared M*/G*, with sanity, calibration and seed-variance checks.
- Run the **skeptic** (`skeptic-checklist.md`): it tries to refute the result and returns `BLK-n` / `NBK-n` lines for the Skeptic section. Blocking concerns go back to the analyst first.
- Fill Results from real outputs, write the proposed verdict, set `analyzed`, render.

Failures and negative results get the same discipline: a Runs row and an honest verdict.

## 7. ⛔ Verdict confirmed

The researcher reads the card page (gate box: "Confirm verdict / Dispute verdict") and hands back feedback. Only a confirmed verdict sets `done` (or `failed`) with its `gate_result`, moves a plan gate, and may propose a decision-log entry.

## 8. Record

- Newest-first `NOTEBOOK.md` entry (what ran, what happened, what's next; link the card).
- Registry row: status, `gate_result`, `actual_cost`, `code_version`. Run `python scripts/validate_registry.py`.
- Re-render the card and the registry. A card is not `done` while its artifacts are missing or the registry is stale.
- With the `paper-draft` pack: append an experiment subsection to `paper/sections/experiments.tex` — numbers only from `results/<ID>/`, citing the card; negative results too.

## Rules that span the loop

- **Iteration:** a new run varying the same axis is a new card (`E012_slug__v2`, `supersedes: E012_slug`). A completed card's design sections never change; corrections append.
- **Hand-over:** command, output location, what to paste back. `launched` is the synchronization point; on resume, reconcile against `results/` (`reference/session-recovery.md`).
- **End of session:** run the `closing` skill — it updates the artifacts and writes the `## Resume here` handoff in `NOTEBOOK.md`.
