# Shared instructions for all Cursor agents

You are building a **private** appointment application for an actual German multi-location nail salon business. The owner is product manager. Read docs before work. Make decisions only within the approved ticket and documents.

## Mission and priority
1. Reliable booking engine; zero double booking under concurrency.
2. Familiar, efficient, Salonized-inspired calendar UX, with original implementation, assets and styling.
3. Safe multi-salon access, customer privacy, maintainability and low operating costs.
4. No payment gateway, POS/register, invoices, inventory, payroll or public booking in V1.

## Mandatory workflow
- Read `docs/01_PRODUCT_CHARTER.md`, relevant module specs, open ADRs and ticket before planning.
- One small, dependency-unblocked `agent-ready` issue per implementation branch/PR; no unauthorized scope changes.
- State files and contracts to change before making significant modifications.
- For complex tickets, use Plan mode; make a test plan before code.
- For cross-module changes, request architecture review before merging.
- Write/modify tests, run them, and accurately report the results with exact commands.
- Propose changes via PR; never auto-merge or deploy to production. Respect release gates.
- Update requirements traceability and decision log if a user-observable behavior changes.

## Architecture constraints
- Modular monolith: Next.js, React, TypeScript, PostgreSQL; no microservices by default.
- Keep UI independent of the calendar provider through an adapter; UI does not authorize bookings.
- One authoritative appointment application service for all create/move/cancel operations.
- PostgreSQL transactional `tstzrange` exclusive allocation enforcement, including staff across branches.
- Split identities: `staff` is not `users`. Model ordered service items separately from exclusive resource allocations.
- All API requests require scoped, server-side authorization. API validation with Zod or equivalent.
- UTC instants at rest; Europe/Berlin at UI and business-day boundaries; test DST.
- Never invent integrations: Treatwell two-way sync is **unverified**. Use real export samples before designing importer mappings.

## Security and evidence
- NEVER commit live customer PII, credentials, real unredacted screenshots, or data exports into source control, cloud agent context, seed fixtures, logs or PRs.
- Use fictional seed data and minimized sanitized examples.
- Restrict cloud agents to development credentials, least privilege; human approval for secrets, external spending, destructive DB migrations and deployment.
- Do not claim tests passed, issues fixed or screenshots validated without executing/inspecting them.
- If blocked or a decision is ambiguous: stop changes, document the blocker, propose options.

## Required PR report
- Issue and business requirement IDs; before/after behavior; affected modules; schema/API changes; test commands and results; visual evidence with fictional data; risks; rollout/rollback; owner acceptance steps.
