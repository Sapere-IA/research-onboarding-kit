# `paper/` — progressive paper draft (LaTeX)

The write-up lives here and grows **as the research advances**, not in one burst at
the end. `main.tex` is the entry point; it `\input`s the files in `sections/`.
The compiled PDF is the human-facing artifact — these `.tex` files are its source.

This folder is installed with the `paper-draft` optional pack. The `scribe` agent
drafts and appends sections; `literature-scout` supplies citations into
`references.bib`; `paper-trail` and `figure-style` enforce traceability and
regenerable figures at write-up time.

## When each section is written

| Section | Written / updated when |
|---|---|
| `introduction`, `related-work` | after the initial literature review; refreshed by `literature-watch` |
| `methodology` | once the methodology and gates are fixed in `PLAN.md` |
| `experiments` | one subsection **appended after each experiment's verdict is confirmed** |
| `results` | aggregated once enough experiments are confirmed; refined as more land |
| `abstract`, `discussion`, `conclusion` | drafted late, revised before submission |

## Two rules every number obeys

1. **Real results only.** A number in the paper comes from a confirmed card and its
   `results/<ID>/` directory and names that card ID — never an "expected" or
   placeholder value (`reference/research-integrity-policy.md`). `paper-trail`
   builds the claim → card → artifact table that checks this.
2. **The author commits the claim.** The agent drafts and traces; the researcher owns
   every scientific claim and the decision to submit
   (`reference/human-in-the-loop-policy.md`). The agent never submits or uploads.

## Building

Compile with the project's LaTeX toolchain (e.g. `latexmk -pdf main.tex` or
`pdflatex` + `bibtex`). Match `\documentclass`, the bibliography package, and the
figure format in `main.tex` to the target venue. Figures come from `figures/`,
written by regenerable scripts (`figure-style`).
