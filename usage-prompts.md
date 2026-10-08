# Ready-to-use prompts for daily RDD work

Copy-paste prompts for common research tasks once the harness is installed.

## Install the harness

```text
Read `research-onboarding-kit/instructions.md` and configure this repository to
use Research Driven Development with this harness. Ask me all necessary
questions before making project-specific decisions.
```

## Start a new experiment

```text
Use the research-workflow skill: I want to test <one change> against
<baseline>. Draft the card, render it, and stop — no configs or launches until I
approve it on the page.
```

## Classify an ambiguous task

```text
Is this an experiment, infrastructure, or analysis? Classify it per the
research-workflow skill, then propose the right artifact (card / infra-spec /
analysis report).
```

## Read my review

```text
Read the feedback for <ID> (experiments/<ID>/card.feedback.md, or my Downloads),
apply it to the card, re-render, and tell me in 5 lines what changed.
```

## Explain it simply

```text
Use the bro skill on G1 of <ID>.            (or: on your last message)
```

## End of session

```text
Use the closing skill: bring the registry, cards and notebook up to date, write
the Resume-here handoff, and ask me before committing.
```

## After I approve a card

```text
The card for <ID> is approved. Build the config, launcher, and smoke test. Run
the smoke test locally and show me the result. Do not submit the cluster job —
give me the exact command to run.
```

## A run finished

```text
Results for <ID> are in results/<ID>/. Verify them against the card's declared
gate, run the skeptic to try to refute the verdict, fill the card's Results, and
propose a verdict, and render the card for me to confirm. Don't declare the gate
passed.
```

## Reconcile after time away

```text
I've been away. Reconcile experiments/registry.json and the cards against the
results/ directories — tell me which launched runs finished or failed, and fix
any status that disagrees with what's on disk. Artifacts win.
```

## Analysis / writing

```text
Write reports/<slug>.md answering <question> from <card IDs / dataset IDs>.
Every number cites its source artifact; name the script for each figure. Render it.
```

## Before submitting a paper

```text
Run the reproducibility-audit on cards <IDs>: env captured, seeds recorded, data
hashes match (check_frozen.py), figures regenerate. Report what fails.
```

## Check the registry is consistent

```text
Run `python scripts/validate_registry.py` and fix or flag any inconsistency
between the registry, the cards, and the results directories.
```

## Update the harness

```text
Use the rdd-update skill to bring this harness up to the latest
research-onboarding-kit version. Show me each migration step before applying it.
```
