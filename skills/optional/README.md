# Optional skill packs

Source templates for optional, per-project skills. The core RDD skills (`research-workflow`, `rdd-update`, `bro`, `closing`) are always installed; the packs here are installed **only when the researcher selects them** during onboarding (`questions.md`) or asks for them later.

## Installation rule

For each selected pack, copy `skills/optional/<name>/` to `<harness-dir>/skills/<name>/` (the harness's skills directory; `reference/harness-primitives.md`) and adapt placeholders and project-specific details. Record installed and declined packs in `decisions/answers.md`. Do not install packs "just in case", and do not paste skill bodies into `AGENTS.md` — list installed skills there by name with a one-line purpose at most. Skill bodies load only when invoked (`reference/context-economy.md`).

- `cluster-ops` is **generated** project-specific (real scheduler commands), not copied verbatim — unknowns become TODOs, never invented.
- `paper-draft` also installs the `paper/` LaTeX scaffold (copy `templates/paper/` to the project root, instantiating the `.template` files; set title, authors and venue in `main.tex`). Section files stay near-empty until the milestone that fills each.
- `dependency-freshness` is adapted to the strictness chosen at onboarding.

## Available packs

| Skill | Purpose | Recommended when |
|---|---|---|
| `experiment-registry` | Registry maintenance, ID/superseding conventions, `validate_registry` wiring | Every project |
| `reproducibility-audit` | Verify a finished card can be rerun before a paper goes out | Paper target |
| `cluster-ops` | The project's real scheduler recipe + hand-over format | Cluster compute |
| `literature-watch` | Periodic novelty / related-work sweep procedure | Paper target |
| `paper-trail` | Claim→card→artifact table, figure provenance, reproducibility statement | Write-up phase |
| `paper-draft` | Progressive LaTeX write-up in `paper/`, drafted as the research advances | Paper target |
| `figure-style` | Consistent, regenerable plotting conventions for the target venue | Paper figures |
| `data-provenance` | Dataset cards (origin, license, hashes, sensitivity); update procedure | Licensed/sensitive data |
| `dependency-freshness` | Check current docs before framework/library/API changes; record version evidence | Fast-moving ML stack |
| `decision-log` | Record durable methodological/workflow decisions | Team (always) |
| `failure-learning` | Turn real mistakes into reusable lessons (proposed, never auto-written) | Recommended |
| `git-discipline` | Clean branches/commits/PRs without risky git actions | Any git project |
| `project-map` | Refresh the project map when structure changes | Large or evolving repos |
| `context-audit` | Inspect and reduce context-window usage in long sessions | Long analysis sessions |

Every pack documents: purpose, when to use, when not to use, required inputs, output artifact, and safety constraints. All packs are advisory or permission-gated: none mutates external systems, compute, or memory without explicit researcher approval, and none crosses an RDD gate. The one exception is `goblin-mode`, where the researcher gives both gate decisions up front by invoking it; it still never merges, spends beyond the card budget, moves a plan gate, writes paper text or memory, or touches frozen artifacts.

## Themed bundles (for a chooser capped at four options)

Selecting a bundle *proposes* its packs; each is still confirmed individually, never installed silently as a set.

| Bundle | Packs |
|---|---|
| Experiments & compute | `experiment-registry`, `cluster-ops`, `reproducibility-audit`, `dependency-freshness` |
| Paper | `paper-draft`, `paper-trail`, `literature-watch`, `figure-style` |
| Data & decisions | `data-provenance`, `decision-log`, `failure-learning` |
| Repo, session & autonomy | `git-discipline`, `project-map`, `context-audit`, `goblin-mode` |
