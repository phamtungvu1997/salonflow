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

## ADR-004 — Calendar library (Pending — spike harness shipped)

**Context:** DayPilot Lite vs React Big Calendar (or native fallback) must pass a real interaction scorecard including iPad. V2 requires ≥20 staff and ≥250 events.

**Decision:** **Not final.** Harness lives under `/spike/kalender/*` with identical fixtures. Production calendar path must keep `CalendarAdapter`.

### Scorecard (fill during device QA)

| Criterion | DayPilot Lite | React Big Calendar | Native dense |
|---|---|---|---|
| 20 resource columns | TBD | TBD | Pass (CSS grid) |
| ≥250 events render | TBD | TBD | Pass |
| Desktop drag/resize | TBD | TBD | Limited (click only) |
| Cross-staff move | TBD | TBD | TBD |
| iPad tap select | TBD | TBD | Likely pass |
| iPad drag or form fallback | TBD | TBD | Form-friendly |
| German labels | Wired | Wired | Wired |
| License OK for internal use | Verify | MIT | N/A |

**Consequences:** M09 quick-create may bind to adapter behind feature flag after Owner accepts a row above. Do not remove spike routes until ADR accepted.

## ADR-005 — German locale defaults (Accepted)

**Context:** Salons operate in Hamburg/Heide with German staff workflows.

**Decision:** Default UI language `de`, time zone `Europe/Berlin`, Monday-first calendar weeks, `DD.MM.YYYY`, 24-hour clock, EUR formatting.

## ADR-012 — No POS / payments in V1 (Accepted)

**Context:** Scope boundary excludes checkout and payment gateways.

**Decision:** Do not add payment SDKs, invoice modules or POS UI. Appointment price displays are informational snapshots only—not collected revenue.
