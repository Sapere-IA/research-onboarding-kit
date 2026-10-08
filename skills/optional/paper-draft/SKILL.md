---
name: paper-draft
description: Draft the paper progressively in LaTeX as the research advances — introduction/related-work after the literature review, methodology after planning, an experiment subsection after each confirmed verdict. Use when a project targets a publication.
---

# Paper draft

## Purpose

Keep a living LaTeX write-up in `paper/` that grows with the work instead of being
assembled in a rush at the end. After the literature review there is an
introduction and related-work draft with the main references; after the
methodology is fixed there is a methodology section; after each confirmed
experiment there is a new experiment subsection. Pairs with `paper-trail` (every
number traces to a card), `figure-style` (regenerable figures), and
`literature-watch` (citation upkeep).

## When to use

- The project has a publication target (journal / conference / thesis).
- A workflow milestone produces material the paper should record: a literature
  review, a fixed methodology, or a **confirmed** experiment verdict.

## When not to use

- Before a result is confirmed — never draft a number from an unconfirmed or
  unrun experiment (`reference/research-integrity-policy.md`).
- To write the scientific narrative on the author's behalf — the agent drafts and
  traces; the author commits every claim (`reference/human-in-the-loop-policy.md`).
- Pure-infrastructure projects with no paper target.

## Folder layout (installed from `templates/paper/`)

```text
paper/
├── main.tex          # entry point; \input{}s the sections; preamble matches the venue
├── references.bib    # literature-scout adds entries; paper-trail verifies them
├── README.md         # the progressive-write protocol (this pack, condensed)
└── sections/
    ├── abstract.tex      introduction.tex   related-work.tex
    ├── methodology.tex   experiments.tex     results.tex
    └── discussion.tex    conclusion.tex
```

## Procedure

1. **After the literature review** — draft `introduction.tex` (problem, gap,
   contributions) and `related-work.tex` from the `literature-scout` findings;
   add the cited works to `references.bib`. Contributions are claims to be backed
   by cards later.
2. **After the methodology is fixed** (`PLAN.md` phases & gates) — draft
   `methodology.tex`: data, approach, metrics, and gate criteria, mirroring
   `PLAN.md` and the cards so they stay consistent.
3. **After each confirmed verdict** (`workflow.md` step 7) — **append** a
   subsection to `experiments.tex`: the single change under test, and the result
   taken only from `results/<ID>/`, citing the card `ID`. Log negative and
   inconclusive results too. This is part of the `scribe` step-8 update.
4. **As results accumulate** — draft/refine `results.tex` (aggregate tables and
   figures, each cell tracing to a card) and, late, `abstract.tex`,
   `discussion.tex`, `conclusion.tex`.
5. **Before submission** — run `paper-trail` (claim → card → artifact table) and
   `reproducibility-audit` on the cited cards; resolve any untraceable number.

## Output artifact

An up-to-date LaTeX source tree under `paper/` whose every reported number cites a
confirmed card, ready to compile to the submission PDF.

## Safety constraints

- Never write a number the project cannot trace to a real, confirmed card and its
  `results/` directory; never write "expected" results.
- Append, don't rewrite, confirmed experiment subsections — corrections append,
  matching the card discipline.
- The agent drafts; the author confirms claims and submits. Do not upload, post, or
  submit anything, and keep embargoed/sensitive detail out of the draft per
  `reference/memory-policy.md`.
