# SPEC-001: Repository foundation (M01)

**Owner:** Project Coordinator / Frontend + DevOps  
**Status:** Ready for Owner verification  
**Business outcome:** Any engineer can clone, install, run and navigate a shell of the booking app.

## Dependencies

- M00 scope approved via Owner start-development instruction

## In scope

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Feature-based folder structure
- Collapsible sidebar app shell with German navigation
- Routes: Calendar, Customers, Employees, Services, Settings
- Salonized-inspired visual direction with original components
- ESLint, TypeScript check, reproducible production build
- GitHub Actions CI
- Vitest + Playwright harness
- README with exact commands
- Synthetic/fictional placeholder content only

## Out of scope

- Real booking persistence or APIs claiming to save appointments
- Online payments, POS, invoices
- Authentication, PostgreSQL schema (M04+), calendar library spike (M03)

## Acceptance

- Given a clean clone, When `npm ci` and `npm run dev` run, Then the app loads with working navigation
- Lint, typecheck, unit tests, production build and Playwright smoke pass locally and in CI configuration
- Placeholder pages clearly indicate synthetic/non-persistent data

## Tests

- Vitest: at least one domain/helper unit test
- Playwright: smoke navigation across primary routes
- CI workflow runs install → lint → typecheck → unit → build → Playwright
