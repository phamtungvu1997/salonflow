# QA policy, review standards and release gates

## Definition of Ready
Business requirement ID; specific user journey; unambiguous acceptance criteria; screenshots or wireframe where UI; endpoint/data contracts where backend; dependencies clear; test strategy; privacy impact reviewed.

## Definition of Done
Changes implemented and reviewed on a feature branch, documented, test fixtures synthetic, lint/typecheck/build pass, relevant unit+integration+E2E pass (or an explicitly approved reason why no relevant test applies), auth/security tests pass for sensitive changes, screenshots where applicable, ADR updated for architecture deviations, PR approved, owner accepts user-visible behavior.

## CI gate (once application exists)
1. Install reproducibly and check lockfile.
2. Typecheck + ESLint + formatting check.
3. Unit tests.
4. PostgreSQL integration tests using ephemeral database and migrations.
5. Key Playwright E2E tests with fictional users.
6. Dependency vulnerability alerts + secret scanning; human investigation of findings.
7. Production build.
8. Migration and SQL constraint checks.
9. Visual screenshot diff for calendar-critical changes (reviewed by human; snapshots alone do not prove usability).

## Release principles
- `main` protected; PR + passing checks + review required. No agents bypass protection or approve their own changes.
- Preview/staging environment uses synthetic data; no real customer exports in cloud development agents.
- Production deployment manual approval. Prefer reversible expand/contract schema migrations; restore drills. Backups encrypted and offsite.
- For authentication, allocation engine or DB migrations, independent senior human review strongly recommended.
- Fatal incident: pause updates, restore service using rollback/backup decision tree, reconcile appointments before reopening bookings.

## Practical daily owner review
Check: Does the demo look and behave as agreed? Can receptionist reproduce in under a minute? Tests truly passed? What failed? Is any feature unexpectedly absent? Did agent change unrelated code? Approve only after evidence.

## Parallelism rule
One implementer owns an integration surface at a time. UI/UX can research and document parallel to backend architecture, but shared API/types must be agreed first. Security reviewer and QA ideally independently inspect proposed implementation, not just its summary.

## Mandatory four-gate release & feature checklist (GATE A–D)

Every user-facing or video-reconstructed feature must pass all four gates before completion:

- **GATE A — Architecture & Code Quality**:
  - Preserves `docs/MASTER_ARCHITECTURE.md` (V2), salon-scoped authorization, and PostgreSQL booking invariants (`src/server/booking.ts`).
  - Modular React/TypeScript implementation separating presentation components, hooks/state, API integration, and validation (no monolithic components or speculative schema expansion).
  - Traceable to `SF-001–SF-048`, `T-matrix` IDs, and observed reference evidence.
- **GATE B — Functional & Regression Tests**:
  - Baseline recorded before edits; zero weakened or deleted tests.
  - Passes `npm run typecheck`, `npm run lint`, `npm test` (unit), `npm run test:integration` (PostgreSQL integration), and `npm run test:e2e` (Playwright E2E including cross-module Customer ↔ Calendar booking flows).
- **GATE C — Visual & Interaction Fidelity**:
  - Verified via Playwright screenshots at matched viewport states against sanitized reference frames/video evidence (layout proportions, table/calendar density, dialogs, hover/selected/focus states, keyboard & Escape behavior).
  - Zero unredacted real customer PII in Git, fixtures, or screenshots.
- **GATE D — Product Owner Approval**:
  - Live running preview demonstrated on `localhost` with branch/commit identification, visual comparisons, test outputs, and honest disclosure of deferred V1 items.
  - Explicit Owner sign-off required before proceeding to subsequent modules, merging, or deploying.

