# AGENTS.md — Nail Salon Booking Platform

Governing rules for every human and AI contributor. Canonical product and engineering truth lives in `docs/MASTER_ARCHITECTURE.md`.

## Mission

Deliver functioning, reliable, production-ready **internal** booking software for Jeannie, Juliet and a future Heide salon. Plans, mocks and agent output volume are supporting work—not the deliverable.

## Source of truth

1. `docs/MASTER_ARCHITECTURE.md` — product scope, architecture, milestones, test program
2. `docs/feature-specs/` — approved feature specifications (SPEC-*)
3. `docs/DECISIONS.md` — Architecture Decision Records
4. This file — agent coordination and hard constraints

Do not invent parallel conflicting rule systems.

## Hard constraints

- **No POS, online payments, invoices, inventory or payroll** in V1.
- **No fake booking persistence** presented as working. Synthetic fixtures must be labeled as placeholders.
- **Booking writes** will eventually go only through the server-side scheduling domain and PostgreSQL constraints. Preserve that contract in UI and module boundaries.
- **German UI** initially (`de-DE`), `Europe/Berlin`, Monday-first weeks, `DD.MM.YYYY`, 24-hour time, EUR.
- **Fictional placeholder data only** — never real customer identities.
- **No production deploy, merge to `main`, or secret handling** without Owner approval.
- Agents must not auto-merge their own PRs.

## Milestone focus

Work only on the assigned milestone until the Owner verifies it. Current target for foundation: **M01** (repo, Next.js, lint/TS, CI, test harness, fake fixtures). App shell routes requested with M01 must remain UI-only with placeholder content.

## Repository layout (start simple)

One Next.js App Router application at the repository root. Feature modules live under `src/features/*`. Shared UI under `src/components`. Domain contracts under `src/domain` (pure TypeScript; no DB yet in M01). Expand to `apps/` / `packages/` only when justified.

## Delivery loop

1. Read architecture + relevant SPEC
2. Isolated feature branch
3. Smallest working slice
4. Lint → typecheck → unit tests → build → Playwright smoke
5. Draft PR with evidence (commands, results, screenshots)
6. Independent review + Owner acceptance before merge

## Role boundaries

| Role | May deliver | Must not |
|---|---|---|
| Frontend | UI, routes, adapters, browser tests | Bypass booking rules with client-only “saves” |
| Backend | Schema, APIs, scheduling services | Skip authorization or exclusion constraints |
| QA | Test evidence and defects | Claim unverified features |
| DevOps | CI, staging, runbooks | Production deploy without Owner approval |
| Coordinator | Spec graph, integration, blockers | Expand scope without Owner approval |

## Language and naming

- User-facing strings: German
- Code identifiers: English
- Commits: concise, imperative English focusing on why
