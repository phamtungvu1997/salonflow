# Architecture Decision Records

Numbering follows **Master Architecture V2** (not kit ADR numbers). Kit “ADR-001 calendar library” maps to **ADR-004** here.

## ADR-001 — Modular monolith, single Next.js app (Accepted for M01)

**Context:** The blueprint proposes `apps/` + `packages/` workspaces eventually. Early multi-package monorepos slow M01 feedback.

**Decision:** Start with one Next.js App Router application at the repository root and feature folders under `src/`. Keep domain types in `src/domain` so PostgreSQL/Drizzle modules can be extracted later without rewriting UI contracts.

**Consequences:** Faster CI and onboarding; workspace split remains available when packages have independent versioning needs.

## ADR-002 — Drizzle ORM + explicit SQL migrations (Proposed → Accepted default)

**Context:** Kit left Drizzle vs Prisma open. V2 proposes Drizzle for visibility into PostgreSQL features (GiST exclusion).

**Decision:** Use **Drizzle** for typed CRUD; ship exclusion constraints and advanced indexes via versioned SQL migrations.

**Consequences:** Schema work starts in M04; Prisma is not introduced without a new ADR.

## ADR-004 — Calendar library (Pending M03 spike)

**Context:** DayPilot Lite vs React Big Calendar (or fallback) must pass a real interaction scorecard including iPad.

**Decision:** Deferred until M03 evidence. UI must use a `CalendarAdapter` so the choice is replaceable.

**Consequences:** No library locked in M01/M02 shell work.

## ADR-005 — German locale defaults (Accepted)

**Context:** Salons operate in Hamburg/Heide with German staff workflows.

**Decision:** Default UI language `de`, time zone `Europe/Berlin`, Monday-first calendar weeks, `DD.MM.YYYY`, 24-hour clock, EUR formatting.

## ADR-012 — No POS / payments in V1 (Accepted)

**Context:** Scope boundary excludes checkout and payment gateways.

**Decision:** Do not add payment SDKs, invoice modules or POS UI. Appointment price displays are informational snapshots only—not collected revenue.
