# Architecture Decision Records

## ADR-001 — Modular monolith, single Next.js app (Accepted for M01)

**Context:** The blueprint proposes `apps/` + `packages/` workspaces eventually. Early multi-package monorepos slow M01 feedback.

**Decision:** Start with one Next.js App Router application at the repository root and feature folders under `src/`. Keep domain types in `src/domain` so PostgreSQL/Drizzle modules can be extracted later without rewriting UI contracts.

**Consequences:** Faster CI and onboarding; workspace split remains available when packages have independent versioning needs.

## ADR-005 — German locale defaults (Accepted)

**Context:** Salons operate in Hamburg/Heide with German staff workflows.

**Decision:** Default UI language `de`, time zone `Europe/Berlin`, Monday-first calendar weeks, `DD.MM.YYYY`, 24-hour clock, EUR formatting.

## ADR-012 — No POS / payments in V1 (Accepted)

**Context:** Scope boundary excludes checkout and payment gateways.

**Decision:** Do not add payment SDKs, invoice modules or POS UI. Appointment price displays are informational snapshots only—not collected revenue.
