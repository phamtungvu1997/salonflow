# AGENTS.md — Nail Salon Booking Platform (SalonFlow)

Governing rules for every human and AI contributor.

## Mission

Deliver functioning, reliable, production-ready **internal** booking software for Jeannie, Juliet and a future Heide salon. Plans, mocks and agent output volume are supporting work—not the deliverable.

## Source of truth (read in this order)

1. [`docs/MASTER_ARCHITECTURE.md`](docs/MASTER_ARCHITECTURE.md) — product scope, architecture, milestones `M00–M19`, test program
2. [`docs/DOC_CONFLICTS.md`](docs/DOC_CONFLICTS.md) — overrides when other docs disagree (**V2 wins**)
3. [`docs/SALONIZED_FUNCTIONAL_GUIDELINE.md`](docs/SALONIZED_FUNCTIONAL_GUIDELINE.md) — behavioral rules SF-001–SF-048 (does not override architecture)
4. [`docs/DECISIONS.md`](docs/DECISIONS.md) — Architecture Decision Records
5. [`docs/feature-specs/`](docs/feature-specs/) — approved SPEC-* tickets
6. Supporting kit specs: [`docs/01_PRODUCT_CHARTER.md`](docs/01_PRODUCT_CHARTER.md) … [`docs/10_TRACEABILITY.md`](docs/10_TRACEABILITY.md)
7. Backlog: [`tasks/INITIAL_ISSUES.md`](tasks/INITIAL_ISSUES.md) and [`tasks/CROSS_MODULE_CONTRACT.md`](tasks/CROSS_MODULE_CONTRACT.md)
8. This file — coordination and hard constraints

Do **not** invent parallel conflicting rule systems. Historical baselines (`BASELINE_BLUEPRINT`, `PHASE_A_REFERENCE`, `MASTER_PROMPT_REFERENCE`, `KIT_*`) are reference only.

## Hard constraints

- **No POS, online payments, invoices, inventory or payroll** in V1.
- **No fake booking persistence** presented as working. Synthetic fixtures must be labeled as placeholders.
- **Booking writes** go only through the server-side scheduling domain and PostgreSQL constraints. UI never authorizes availability.
- **German UI** initially (`de-DE`), `Europe/Berlin`, Monday-first weeks, `DD.MM.YYYY`, 24-hour time, EUR.
- **Fictional placeholder data only** — never real customer identities or unredacted Salonized screenshots in git/agent context.
- **No production deploy, merge to `main`, or secret handling** without Owner approval.
- Agents must not auto-merge their own PRs.

## Specialist agents

Role prompts live in [`.cursor/agents/`](.cursor/agents/). Coordinator assigns one `agent-ready` ticket per branch.

| Role | File | Owns |
|---|---|---|
| product-analyst | `.cursor/agents/product-analyst.md` | Requirements, SZ map, traceability |
| ui-ux-designer | `.cursor/agents/ui-ux-designer.md` | Tokens, dense calendar UX, German flows |
| frontend-engineer | `.cursor/agents/frontend-engineer.md` | App shell, CalendarAdapter, Playwright UI |
| backend-engineer | `.cursor/agents/backend-engineer.md` | Schema, booking engine, GiST, APIs |
| qa-engineer | `.cursor/agents/qa-engineer.md` | T-matrix evidence, concurrency, devices |
| security-reviewer | `.cursor/agents/security-reviewer.md` | Sessions, salon scope, PII |
| devops-engineer | `.cursor/agents/devops-engineer.md` | CI, staging, backups/restore |
| independent-reviewer | `.cursor/agents/independent-reviewer.md` | PR coherence vs contracts |

## Milestone focus

Canonical IDs: **M00–M19** from Master Architecture. Work only on assigned milestones until Owner verifies. Do not start a later milestone’s coding until its dependencies and Owner gates are met.

## Repository layout (start simple)

One Next.js App Router application at the repository root. Feature modules under `src/features/*`. Shared UI under `src/components`. Domain contracts under `src/domain`. Expand to `apps/` / `packages/` only when justified.

## Delivery loop

1. Read architecture + DOC_CONFLICTS + relevant SPEC/NS ticket
2. Isolated feature branch
3. Smallest working slice
4. Lint → typecheck → unit tests → build → Playwright (and DB tests when applicable)
5. Draft PR with evidence (commands, results, screenshots)
6. Independent review + Owner acceptance before merge

## Language and naming

- User-facing strings: German
- Code identifiers: English
- Commits: concise, imperative English focusing on why
