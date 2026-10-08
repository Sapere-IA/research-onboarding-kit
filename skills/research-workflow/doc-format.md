# Document format

<!-- placeholder-check: ignore-file — this doc describes template tokens; the {{...}} below are the subject matter. -->

Every human-facing research document is **one markdown file** with YAML frontmatter. Markdown is the source of truth: agents read and write only the `.md`. The styled page is a **rendered artifact**: generated on demand, never hand-edited, and gitignored unless the project commits rendered pages (`decisions/answers.md`).

| `doc:` | File | Template (this skill's `templates/docs/`) |
| --- | --- | --- |
| `card` | `experiments/<ID>/card.md` — the whole experiment, one file | `card.md.template` |
| `plan` | `PLAN.md` | `PLAN.md.template` |
| `notebook` | `notebook/NOTEBOOK.md` — newest first, `## Resume here` on top | `NOTEBOOK.md.template` |
| `analysis` | `experiments/<ID>/analysis.md` or `reports/<slug>.md` | `analysis.md.template` |
| `infra-spec` | `specs/<module>/spec.md` — mini-SDD contract and tests | `infra-spec.md.template` |
| `doc` | any other note, design or proposal (`docs/<slug>.md`) | `doc.md.template` |

`experiments/registry.json` stays machine state (status source of truth); its dashboard `registry.html` is rendered from it.

To create a document: copy the template, replace every `{{PLACEHOLDER}}`, delete the optional sections that do not apply, and delete guidance comments once a section is filled.

## Rendering

```bash
sh scripts/render.sh experiments/E012_frozen-encoder/card.md   # → card.html next to it
sh scripts/render.sh experiments/                              # registry.html + every doc in the folder
sh scripts/render.sh --all                                     # everything, from the project root
pwsh scripts/render.ps1 <same arguments>                       # Windows
```

Each page opens on an overview — "At a glance" (the `## Summary`), a status stepper for cards, key counts, a ⛔ gate box when a human decision is due, and "Needs your decision" (pending question and assumption cards) — followed by collapsible `##` sections with a section nav. Render before asking for a review and after every change.

## Review on the page → feedback file

Every item with an ID gets review buttons (Accept / Change / Reject / Answer / Comment), and the bottom bar records a page verdict. Its labels follow the decision due:

| Page | Verdict buttons | `gate:` in the file |
| --- | --- | --- |
| card, `status: draft` | Approve card / Request changes | `card_approval` (⛔ gate 1) |
| card, `status: analyzed` | Confirm verdict / Dispute verdict | `verdict_confirmation` (⛔ gate 2) |
| plan, `approval: pending` | Approve plan / Request changes | `plan_approval` |
| anything else | Approve / Request changes | `none` |

The researcher saves `<name>.feedback.md` next to the source (e.g. `experiments/E012_x/card.feedback.md`), downloads it, or copies it into the chat:

```markdown
---
doc: feedback
source: experiments/E012_frozen-encoder/card.md
gate: card_approval
generated: 2026-10-08T10:00:00Z
verdict: approve            # approve | request_changes | none
---

## Items

- G1: change — Use a 15% relative drop, not 20%
- Q1: answer — Recompute from the saved logits
- A1: accept

## General

Free text.
```

Apply it when asked to read the feedback:

1. Find it next to the source; otherwise ask for the downloaded path or the pasted text.
2. Apply each item to the item that owns the ID:
   - `answer` → the question card gets `[!ok Resolved]` and a **Decision:** line; reflect the answer where it matters;
   - `accept` → an assumption gets `[!ok Accepted]`; a skeptic `BLK`/`NBK` concern stands; anything else needs no edit;
   - `reject` → an assumption gets `[!rejected Rejected]` plus its replacement; a skeptic concern is dismissed with the researcher's reason recorded under it;
   - `change` → edit the item as asked; `comment` → address it or turn it into an open question; `## General` → like a comment.
3. Re-render, delete the feedback file, and summarize what changed in ≤ 5 lines.
4. `verdict: approve` with no `change`/`reject` items **is the researcher's decision** for the recorded gate: apply it per `experiment-state-machine.md` (card + registry, notebook entry). If the feedback also changed the document, the approval does not carry over — re-render and ask again. The agent never writes an approving feedback file itself.

## Conciseness

A card reads in about three minutes; any document in about five.

| Item | Budget |
| --- | --- |
| `## Summary` | ≤ 3 sentences |
| ID row, card field, finding, risk | One sentence |
| Any section | One screen: ≤ ~10 lines, or a table |
| Card `## Plan` | ≤ ~8 steps — split the experiment otherwise |

- **Each fact lives once.** Reference by ID (`G1`, `E011_baseline`, `PLAN.md § P2`) instead of restating. Status lives in `registry.json` and the card frontmatter, never in prose or in `PLAN.md`.
- Cut what the reader can infer: restated context, rationale for the obvious, generic advice.
- Tables for enumerable facts; short declarative sentences; no filler narrative.
- Delete optional sections that do not apply. Keep a one-line `None.` / `Pending.` only where absence is information (the renderer folds such sections to one line).
- After approval, a card's design sections (Hypothesis → Setup) are append-only: corrections append a dated line; a new axis is a new card.

## Markdown conventions (what the renderer understands)

Standard markdown — `##`–`####` headings, paragraphs, lists, GFM tables, fenced code, `**bold**`, `*italic*`, `[links](…)`, `> quotes`, `---` — plus the conventions below. A line starting with `<` passes through as raw HTML (inline SVG diagrams). HTML comments are invisible.

### Frontmatter → header

Simple `key: value` lines only. `title` becomes the heading; other keys become the meta row. `status`, `gate_result`, `approval`, `verdict`, `review_status`, `decision` render as colored badges; `experiment_id`, `supersedes`, `smoke_passed`, `created`, `updated` and keys ending in `_id`, `_path`, `_command`, `_date`, `_ref` render as code.

Card frontmatter: `doc: card`, `title`, `experiment_id`, `status` (`draft | approved | launched | analyzed | done | failed | abandoned`), `gate_result` (`pending | pass | fail | inconclusive`), `plan_ref`, `supersedes`, `approver`, `budget`, `smoke_passed`. `status` and `gate_result` must equal the registry record — `validate_registry.py` checks.

### ID rows

A line `ID: text` renders as a row with an ID chip and review buttons. Chips anywhere else link to their definition.

| Prefix | Meaning | Where |
| --- | --- | --- |
| `H1` | Hypothesis | card |
| `C1` | The one change under test (a `C2` means split the card) | card |
| `M1`, `M2` | Metrics | card |
| `G1`, `G2` | Gate criteria, each naming its metric | card |
| `T1` | Plan step (timeline label) | card, infra-spec |
| `Q1`, `A1` | Open question / assumption (card headers) | any |
| `BLK-1`, `NBK-1` | Skeptic or review concern: blocking / note | card, infra-spec |
| `O1`, `P1` | Objective / phase | plan |
| `F1` | Finding (cites its source IDs) | analysis |
| `REQ-1`, `AT-1` | Requirement / acceptance test | infra-spec |

### Status markers

- Inline badge: `[!ok pass]`, `[!warning inconclusive]`, `[!blocking fail]`, `[!pending pending]`, `[!draft Draft]`.
- Table-cell verdict (colors the cell): start the cell with `!ok`, `!warning`, `!blocking` or `!pending` — `| M1 | 93.0% | 93.1% | ≥ 92.5% | !ok pass |`.

### Timelines and checklists

An ordered list whose items all start with a marker renders as a timeline: `[ ]` pending, `[>]` in progress, `[x]` done, `[!]` blocked; optional `T1:` / `P1:` chip; ` — ` separates title from detail.

```markdown
1. [x] T1: Build config and launcher — After approval on 2026-10-08.
2. [>] T2: Smoke test passes locally
```

An unordered list whose items all start with `[ ]`/`[x]` renders as a checklist.

### Containers

Fenced blocks wrap content in styled boxes; close with `:::` on its own line.

```markdown
::: card blocking-yes          <!-- also: risk-high, risk-medium, risk-low -->
#### Q1 — Card title [!blocking Blocking]

- **Question:** one sentence    <!-- "**Key:** value" items render as a field grid -->
- **Default if unanswered:** one sentence
:::

::: note                       <!-- highlighted note -->
::: collapse Section title     <!-- collapsed details -->
::: diagram                    <!-- centered box for an inline SVG -->
```

A leading `####` heading in a card becomes its header: the `Q1 — ` prefix becomes the chip, a trailing badge stays in the header.
