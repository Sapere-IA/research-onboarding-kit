---
name: goblin-mode
description: Run one experiment card (or infra-spec) end to end with no human checkpoints — the invocation is the researcher's decision at both RDD gates — until it is approved, built, smoke-tested, launched within budget, analyzed, its verdict recorded, the notebook and registry current, everything committed and pushed on a feature branch with a pull request, and the repo closed so a fresh session can pick up the next card. Use when the researcher says "goblin mode", "just run E012", or wants an experiment taken as far as it can go unattended.
argument-hint: "[experiment ID or infra module — empty = next eligible card]"
---

# Goblin mode — one card, as far as it goes, unattended

## Purpose

The researcher wants to walk away. Take one experiment card through the RDD
loop (`research-workflow` skill) without stopping at the two ⛔ gates, for
compute within the card's budget, or for git permission, then leave the
research record resumable (`closing` skill). The deliverable is a pushed
feature branch with a pull request and a clean handoff — never a merge, never
a confirmed claim in paper text.

This skill is a **recorded autonomy exception** (`reference/autonomy-policy.md`
§ "Recorded exception: goblin-mode"). It applies only when the researcher
invokes it explicitly, only to the one card named, and only for the session in
which it was invoked. Everything it relaxes is listed here; everything else in
the RDD loop, the human-in-the-loop, compute-budget, frozen-artifacts and
integrity policies still holds.

## What the invocation means

Invoking this skill on a card is the researcher's explicit, in-advance decision
at **both** gates for that card, and the pre-authorization of the git actions in
§ Git. Record it, never assume it. In the card frontmatter and the registry
record:

```yaml
approved_by: <researcher name from git config user.name, or the card's approver>
approved_at: <ISO timestamp of the invocation>
approval_note: "Gate 1 passed in advance by goblin-mode invocation; the card was not human-reviewed before launch."
verdict_confirmed_by: goblin-mode   # set at gate 2
verdict_note: "Verdict proposed by the agent and recorded by goblin-mode invocation; not human-confirmed. Reopen to dispute."
```

Both notes are mandatory. A reader of the card, the registry or the notebook
must be able to tell a goblin-mode card from a normally approved one, and a
goblin-mode verdict from a researcher-confirmed one. A goblin-mode verdict
**never** moves a `PLAN.md` gate or writes paper text; it leaves a proposal.

## Goal condition

The run ends successfully in one of two end states. Write the applicable one
in the first message of the run and, if the harness has a goal or persistence
feature (§ Per-harness persistence), hand it that exact text.

**End state A — completed** (results came back inside the session):

1. The card is `done` or `failed` in `registry.json` and its frontmatter, with
   `gate_result`, `actual_cost`, `code_version` filled and the goblin-mode notes
   present; `python scripts/validate_registry.py` is green.
2. Every Plan item in the card is `[x]`; no `[>]` or `[!]` remains; every run
   has a Runs row; the Skeptic section has its `BLK-n` / `NBK-n` lines resolved.
3. `NOTEBOOK.md` has a dated entry per state change and a `## Resume here`
   naming the next candidate card; the card and registry are re-rendered.
4. The working tree is clean; every commit is on the card's feature branch and
   pushed; the PR exists (or its text is in the final report when PR tooling is
   unavailable); the `closing` checklist is all ✓.

**End state B — launched and waiting** (the run is on a cluster, or longer than
the session): items 3 and 4 above, with the card `launched`, `smoke_passed`
set, the Runs row holding the exact command / job ID, and the handoff saying
what to paste back. Re-invoking goblin-mode on the same ID when `results/<ID>/`
has outputs continues from § 6.

## Bounds

- **Fix attempts:** at most 3 consecutive fix-and-retry cycles per failure
  (failing smoke test, crashed cheap-local run, blocking skeptic concern,
  failing validator). The 4th failure of the same kind stops the run.
- **Compute:** the card's declared budget, and the per-month / per-project
  budget in `decisions/answers.md`. Never exceeded, never re-estimated upward
  by the skill.
- **Polling:** for a cheap-local run started in the session, wait for it. For
  a cluster or long run, do not poll beyond the declared wall-clock; end in
  state B.
- **Immediate stops** (no retry): a hook denies an action; a permission prompt
  is denied or cannot be answered; a question the skill may not decide alone
  (§ Deciding alone); the card turns out to touch a never-autonomous area
  (§ Refuse to start) that the draft did not reveal.
- **No time or turn cap** beyond what the harness enforces. The researcher
  accepted this at install time; record it in `decisions/answers.md`.

## Refuse to start

Check before touching anything, and stop with a one-line reason if any holds:

- The argument names a card that does not exist, or is `done`, `failed` or
  `abandoned` (a re-run is a new `__v2` card — draft it instead if asked).
- The card does not fit `PLAN.md` (`plan_ref` missing or the plan phase is not
  open): that is a plan-change proposal and plans are the researcher's.
- The launch needs paid cloud, a paid API quota, or exceeds the card's or the
  project's budget, and no recorded decision in `decisions/` pre-authorizes it.
  Build config, launcher and smoke test anyway, then end in state B with the
  exact hand-over command.
- `git status` shows uncommitted researcher changes (git-discipline rule 2:
  never overwrite them). Untracked, gitignored artifacts and `results/` do not
  count.
- The card's change or setup touches frozen artifacts, deletes or regenerates
  data, uploads anything external, or edits protected files from `AGENTS.md`.
  Run the normal loop instead and stop at gate 1 for a human.
- The project's git policy in `AGENTS.md` forbids the agent from pushing or
  opening PRs and no recorded decision allows goblin-mode to. The run may still
  execute everything up to the local commits; say so up front and end with the
  branch unpushed.

## Procedure

Announce once, then stop asking: card ID and title, branch name, which end
state applies and its goal condition, the budget it will respect, the bounds.
After that message no question goes to the researcher until the final report.

### 1. Select the card

`$ARGUMENTS` is one experiment ID or infra module. If empty, pick the next
eligible card exactly as `research-workflow` § Standard execution step 1 does,
and name it in the announcement. Classify first (`classification-policy.md`):

- **Infrastructure:** the loop is `infra-spec` → approval-by-invocation →
  code and tests → tests pass → `done`. Steps 3–4 and 6–7 below apply with the
  spec in place of the card; there is no launch and no verdict.
- **Analysis:** not gated; goblin-mode adds nothing — run the normal procedure.
- **Experiment:** continue.

### 2. Branch

Follow the branch convention from the git policy in `AGENTS.md`. If none is
recorded, use `rdd/<id-lowercase>` from the project's default branch.

### 3. Card

- No card yet, or `draft`: write or finish it per `research-workflow`
  (`card.md.template`, `doc-format.md`). The `experiment-designer` rules hold:
  exactly one `C1`, declared `M*`/`G*`, a baseline, a budget, a `plan_ref`.
- A pending `card.feedback.md`: apply it first (`doc-format.md` § Feedback).
- Resolve open questions and assumptions per § Deciding alone.
- Add or update the registry record, render, then set `approved` on the card
  and in the registry with the gate-1 fields from § What the invocation means,
  and write the notebook entry. Commit: `card: <ID> approved via goblin-mode`.

### 4. Build and smoke-test

`research-workflow` workflow § 4, unchanged: `configs/<ID>.yaml`,
`launchers/<ID>.sh`, smoke test **passing locally**, `smoke_passed` set in card
and registry, a Runs row. A failing smoke test counts as one fix attempt. Commit.

### 5. Launch

- Cheap and local within the card's budget: run it, log the Runs row, set
  `launched`, wait for it, continue to § 6.
- Cluster, paid or long, **pre-authorized** by a recorded decision and within
  budget: submit with the `cluster-ops` recipe if installed, log the job ID in
  the Runs row, set `launched`, then go to § 8 in end state B.
- Otherwise: write the exact hand-over (command, output location, what to
  paste back) into the card and the handoff, set `launched` only if the
  researcher's launch is the next step, and go to § 8 in end state B.

Never write expected numbers anywhere.

### 6. Collect and analyze

When `results/<ID>/` has outputs (`research-workflow` workflow § 6): check them
against the declared `M*`/`G*` with sanity, calibration and seed-variance
checks; run the skeptic (`skeptic-checklist.md`, as a subagent where the
harness supports one, inline otherwise). Blocking concerns (`BLK-n`) go back to
analysis and count as fix attempts; after the 3rd unresolved round, stop and
leave the card `analyzed` with the concerns listed. Fill Results from real
outputs only, write the proposed verdict, set `analyzed`, render, commit.

A crashed or diverged run is a Runs row and an honest `failed` outcome, not a
retry of the design.

### 7. Record the verdict

Set `done` (gate met or an honest negative) or `failed` with `gate_result`,
`actual_cost`, `code_version` and the gate-2 fields from § What the invocation
means, in the card and the registry. Notebook entry, re-render card and
registry, `python scripts/validate_registry.py`.

Still propose-only even here: do **not** move a `PLAN.md` gate, write
`decisions/*.md`, append to `paper/sections/experiments.tex`, or write any
memory file. Put the proposed plan-gate move, decision entries and paper
subsection text in the card under "Proposed follow-ups" and in the PR
description; the researcher accepts or drops them later.

### 8. Close the session

Run the `closing` skill procedure with these substitutions: memory and
decision-log proposals are listed, not asked about; the commit question is
already answered. The `## Resume here` block must name the **next candidate
card**, list every auto-decided question (§ Deciding alone) as a line the
researcher should glance at, and — in end state B — the job ID / command and
what to paste back.

### 9. Push and open the PR

1. Push the branch to the remote.
2. Build the PR description with the `git-discipline` conventions: summary of
   the change under test, the card path, status reached, checks run (smoke
   test, validators), a **Goblin mode** section (both gates passed by
   invocation, auto-decided questions and assumptions, fix attempts used,
   budgeted vs actual cost), and the proposed follow-ups from § 7.
3. Open the PR against the project's default branch with the available tooling
   (a permission-gated CLI call or a configured MCP). If none is available or
   allowed, put the full PR text in the final report instead — not a failure.
4. Commit `chore: link PR for <ID>` with the PR URL in the card's Runs or
   notes, push again. The tree must be clean after this.

### 10. Report

```text
Goblin mode — <ID> <title> · end state A|B
✓/✗ card <status> (gate_result: <value>, validate_registry: green)
✓/✗ plan items [x] · runs logged · skeptic resolved
✓/✗ budget: <actual> / <budgeted>
✓/✗ notebook entries · re-rendered
✓/✗ branch <name> pushed · PR <url or "text below">
✓/✗ closing checklist · Resume here → next: <ID>
Auto-decided: Q2 (chose the smaller eval split — conservative), A3 confirmed by config
Fix attempts used: <n>/3
Proposed follow-ups (plan gate, decisions, paper text): <count, in the card>
```

Every ✗ gets one line of explanation. In end state B the first line names
what the researcher must paste back.

## Deciding alone

Open questions (`Qn`) and unconfirmed assumptions (`An`) have no human to
answer them. Decide them yourself when the question is about **how** to run
the declared change within the card's scope and budget: pick the option the
card already recommends, otherwise the most conservative one (smaller run,
fewer seeds only if the card's gate tolerates it, no new data, reversible).
Record each in the card's Assumptions section:

```markdown
- **A7 (auto-decided by goblin-mode, YYYY-MM-DD):** <decision>. Resolves Q2.
  Reason: <one line>. Reversible: <yes / how>.
```

Mark the question answered pointing at the assumption. List all of them in
the handoff, the PR description and the final report.

Never decide alone — stop the run instead — when the question concerns: the
hypothesis, the change under test or the gate criteria (frozen at approval);
the budget; frozen or protected artifacts; deleting or regenerating data;
anything that spends money; `PLAN.md` objectives or scope; claims in paper
text; or anything the researcher flagged "ask me" in `AGENTS.md` or
`decisions/answers.md`.

## When the run stops early

Leave the record better than a crash would:

1. Commit work in progress on the feature branch (`wip: <ID> <what>`), never
   on the default branch. Mark the current Plan item `[!]` with a one-line
   reason; every run started has its Runs row.
2. Set the status honestly in card and registry: `draft`, `approved`,
   `launched` or `analyzed` as reached — never `done`; `failed` only for a
   real run outcome.
3. Run the `closing` procedure; the `## Resume here` block states the exact
   blocker and the next action.
4. Push the branch if pushing is allowed, so nothing is lost.
5. Report with the checklist above; the first line names what stopped it.

## Git

Pre-authorized by the invocation, within the project's git policy: create the
feature branch, commit on it, push it, open one PR. Reference the card ID in
every commit message; check diffs for secrets and for large result files
(`results/` stays out of git unless the project tracks it) before each commit.

Still forbidden: committing or pushing to the default or any protected
branch, merging the PR, force-pushing, rewriting shared history, skipping or
disabling hooks, deleting branches, touching stashes or other branches,
uploading results to a tracker or paper service.

## Per-harness persistence

The procedure above is harness-neutral. Use the harness feature that keeps an
agent working until a condition is met, with the § Goal condition and § Bounds
as its stop condition; without such a feature, run the procedure in one pass
and resume from the `## Resume here` block if the session ends.

| Harness | How to keep going |
|---|---|
| Claude Code | Start a `/goal` with the goal condition verbatim; bounds in the same text |
| Codex CLI | Single pass; a background run may be used with turn and budget caps |
| Cursor | Single pass in the agent chat |
| OpenCode | Single pass; the harness's loop/continue feature if configured |
| Antigravity | Single pass; background agent with a stop condition if available |

Autonomy posture is unchanged by the mechanism: same permissions and the same
compute budget as an interactive session, never with permissions fully
bypassed outside a disposable sandbox, and no hook disabled to let the run
proceed.

## When not to use

- Cards whose launch is paid, over budget or not pre-authorized: use the
  normal loop and hand over the command.
- A card the researcher wants to read before anything is built, or a verdict
  that will move a plan gate or enter the paper — confirm those by hand.
- Several cards at once: run goblin-mode once per card, each on its own branch.
- Projects whose git policy forbids agent pushes without a recorded decision.

## Installation notes

- Installing this pack is the recorded decision that relaxes the autonomy and
  human-in-the-loop policies' gate items **for this skill only**. Record in
  `decisions/answers.md` (and `decisions/workflow-decisions.md` if the
  `decision-log` pack is installed): the pack is installed, invocation counts
  as both gate decisions, cheap-local launches within the card budget are
  allowed, feature branch + PR only, 3 fix attempts, no time cap. If cluster
  launches within budget are also pre-authorized, say so there explicitly.
- Fill the branch convention, default branch and PR tooling in the project's
  git policy so § 2 and § 9 need no guessing.
- The kit's gate hooks keep working: `block-unapproved-launch` reads the
  `approved` status written in § 3, so no hook is bypassed.
