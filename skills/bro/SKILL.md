---
name: bro
description: Re-explain something concisely in plain language. Use when the researcher says there is too much text, does not understand a message, a card item (H1, C1, G1, Q2, T3, BLK-1), an experiment (E012_slug), a file, a term or a concept, and wants it simply.
argument-hint: "[text, file, card/experiment ID, term or concept — empty = your previous message]"
---

# Bro — say it simply

## Purpose

The researcher got too much text, or text they do not follow. Re-explain it short and plain. This skill only explains: it never decides, runs, launches or edits.

## What to explain

- **No argument:** your previous message in this conversation.
- **Pasted text:** that text.
- **A file path:** that file (or the part the researcher points at).
- **An experiment ID** (`E012_slug`): its `experiments/<ID>/card.md` (Summary, change under test, gate, current status and verdict) and its `experiments/registry.json` record.
- **An item ID** (`H1`, `C1`, `M1`, `G1`, `Q2`, `A1`, `T3`, `R2`, `BLK-1`, `NBK-1`, `REQ-1`, `AT-1`…): find it in `experiments/*/card.md`, `PLAN.md`, `specs/`, `reports/`. Item IDs repeat across cards: if it matches more than one document, ask which experiment, or use the active one and say so. If not found, say so and stop.
- **A term or concept** (ECE, ablation, smoke test, frozen split…): explain it as it applies to this project; read the project map or `AGENTS.md` only if the meaning is project-specific.

## Output contract

Reply in the researcher's language. At most ~150 words in total.

```text
**TL;DR:** <one line>

<Plain-words explanation: short sentences, no jargon — or define each
term the first time. One everyday analogy only if it really helps.>

**What this means for you:** <the practical consequence, 1–2 lines>
**What you need to decide:** <only if there is a pending decision — a card
to approve, a verdict to confirm, a question to answer: the choice, the
options, the recommended one>

Want me to go deeper on any part?
```

Drop "What you need to decide" when nothing is pending. Keep the last line as a single short offer.

## Rules

- Add no new claims: every statement must come from the source. No new facts, numbers, results, risks or recommendations.
- Never present a proposed verdict as confirmed, or a planned result as real.
- If the source is ambiguous or contradicts itself, say so in one line instead of guessing what it meant.
- Do not repeat or quote the original text back; rephrase it.
- Do not change any file, registry state or memory. Read only.
- Do not pad: no preamble, no recap of what was asked, no headings beyond the contract.
- If the researcher asks to go deeper, answer only the part they named, with the same plain style.
