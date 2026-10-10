# Human-in-the-loop policy

RDD keeps humans in control at the two places where research goes expensively or
dishonestly wrong: **launching compute** and **making claims**. Everywhere else,
The agent works freely — reading, analyzing, drafting, coding, smoke-testing — so
the gates protect what matters without adding friction to the cheap, reversible
work. This is the research analog of SDD's approval and review gates.

## The approval matrix

### The agent may do autonomously (no approval needed)

- Read code, data schemas, results, logs, and papers.
- Analyze results: compute metrics, make plots, explore data, run statistics.
- Draft experiment cards, analysis reports, decision-log entries (as proposals).
- Write code and tests for infrastructure tasks (which then follow the mini-SDD
  spec-and-test path).
- Run smoke tests and **cheap local jobs within a stated budget**
  (`reference/compute-budget-policy.md`).
- Maintain the registry, notebook, and card hygiene.

These are reversible or cheap, and none of them commits the project to a result
or a cost.

### The agent must ask (human-gated)

- **Launching expensive or long compute** — cluster jobs, multi-GPU/long runs,
  anything beyond the stated cheap-local budget.
- **Anything that spends money** — paid cloud, paid API quotas, paid services.
- **Changing PLAN objectives, priors, or scope** — the plan is the researcher's;
  The agent proposes changes, it does not enact them.
- **Declaring a plan gate passed** — the agent proposes a verdict; the researcher
  (or the designated approver) confirms it.
- **Deleting or regenerating data** — especially frozen artifacts
  (`reference/frozen-artifacts-policy.md`).
- **Publishing or uploading anything external** — pushing to a remote, uploading
  to a tracker/registry, sending to a paper service, posting results.
- **Writing claims into paper text** — paper sentences are author decisions;
  The agent drafts and traces, the author commits the claim.

## The two ⛔ gates of the experiment loop

The loop (`skills/research-workflow/SKILL.md`) has exactly two blocking gates:

1. **Card approval ⛔** — no config, launcher, or run is built or executed before
   the researcher approves the card. Approving the card approves its single
   change under test, its declared gate criteria, and its compute budget.
2. **Verdict confirmation ⛔** — the agent proposes a verdict against the declared
   gate (after the skeptic has tried to refute it); the researcher confirms.
   Only a confirmed verdict updates the gate status in the plan and may propose
   a decision-log entry.

**How the researcher decides.** In chat, or on the rendered card
(`card.html`): the page's verdict bar reads "Approve card" at `draft` and
"Confirm verdict" at `analyzed`, and saves `card.feedback.md`. An approving
feedback file with no change/reject items **is** the gate decision; the agent
records it in the card frontmatter and the registry, citing the file. If the
same feedback also changed the card, the approval does not carry over — the
agent applies the changes, re-renders, and asks again. The agent never writes
an approving feedback file itself.

A blocking hook for the launch side of gate 1 ships in the kit
(`block-unapproved-launch.sh`); it is opt-in, and the gates hold whether or not
a hook enforces them. Gate 2 has no hook substitute.

## Who approves what

The approver is recorded during onboarding (`questions.md` §4) and on each card:

- Solo researcher: the researcher approves their own gates, but the gate still
  exists — it forces the explicit "yes, launch this / yes, this verdict holds"
  moment that catches the rushed mistake.
- Team / supervised: gates may require supervisor sign-off or co-author review;
  the card names the approver, and the verdict is not confirmed until that
  person signs off.

## Proposals, not faits accomplis

The agent's outputs at the gates are **proposals**: a drafted card awaiting
approval, a proposed verdict awaiting confirmation, a proposed decision entry
awaiting acceptance. The agent never:

- declares a gate passed on its own;
- writes a result it did not get from a real run;
- promotes a proposed decision into the log without acceptance;
- moves a card to `done` while its artifacts are missing or its registry row is
  stale.

## Relationship to autonomy

Autonomous workflows (`reference/autonomy-policy.md`) get **no extra
permissions**: a loop or scheduled run may prepare material for a gate
(smoke-test results, analysis, a drafted verdict) but may never cross a gate —
no autonomous launch of expensive compute, no autonomous "gate passed", no
autonomous upload. Autonomy is controlled execution, not delegated authority.
The one recorded exception is the opt-in `goblin-mode` pack, scoped to a single explicitly invoked card (`reference/autonomy-policy.md` § Recorded exception).
