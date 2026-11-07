# Initial small, issue-ready development tickets

**Canonical milestones:** Master Architecture **M00–M19** (see [`docs/DOC_CONFLICTS.md`](../docs/DOC_CONFLICTS.md) for NS→V2 map).  
**Cross-module behavior:** [`docs/SALONIZED_FUNCTIONAL_GUIDELINE.md`](../docs/SALONIZED_FUNCTIONAL_GUIDELINE.md) rules SF-001–SF-048 are mapped to owners, side effects, and tests in [`CROSS_MODULE_CONTRACT.md`](CROSS_MODULE_CONTRACT.md). **Next coding ticket after Owner approval: NS-017.**  
**Status notes:** NS-002/M01 engineering complete (merge pending Owner). NS-004/M02 shell+tokens on `feat/m02-m03-m04-slices`. NS-003/M03 spike harness shipped (ADR-004 not final). NS-005 schema portion (M04) Drizzle+SQL shipped. Remaining tickets PROPOSED.  
`SZ-*` source map in docs/02, `T-*` tests in docs/08. Calendar spike fixtures: **≥250** events (V2), not 200.

| Ticket | Task | Lead | Depends on | Evidence / exit |
|---|---|---|---|---|
| NS-001 | Audit requirements, UI screenshots and conflicts; final PRD + risk decisions | product-analyst + architect | — | Owner approves V1 scope, ADR list and 3-screen spec |
| NS-002 | Set up Next.js/TS repo, scripts, GitHub Actions and fake fixture plumbing | devops + frontend | NS-001 | Fresh clone + reproducible lint/typecheck/test/build |
| NS-003 | Calendar component A/B spike with 20 staff, 200 fake events | UI/UX + frontend + QA | NS-001, NS-002 | Desktop+iPad interaction comparison, ADR-001 approved |
| NS-004 | Approve final daily calendar design tokens, responsive screen states | ui-ux-designer | NS-003 | Owner reviews own-app synthetic screenshots and 15s flow |
| NS-005 | Catalog, staff, salons and auth model migrations with RBAC | backend | NS-001, NS-002 | Schema migrations, role and eligibility tests |
| NS-006 | Weekly schedules, overrides, breaks and absence domain | backend | NS-005 | T-006, T-007 pass; shift edits conflict safely |
| NS-007 | Exclusive resource allocations + server booking API | backend + QA | NS-005, NS-006 | T-002, T-003, T-005, T-009, T-012, T-013 pass |
| NS-008 | Booking quick drawer + create end-to-end | frontend + backend | NS-004, NS-007 | T-001, T-019 pass, booking under 15s user pilot |
| NS-009 | Move/resize/cancel/status/no-show with audit | frontend + backend + QA | NS-008 | T-004, T-010, T-011 pass, no DB partial writes |
| NS-010 | Customer history, lookup, staff access restrictions | backend + frontend | NS-005, NS-008 | T-014 pass, customer rebook works |
| NS-011 | Salonized import preview and idempotent staging importer | backend + security + QA | NS-010 | T-015 pass; dry-run counts/reconcile; real format only after approved sample |
| NS-012 | Encrypted backups, restore, monitoring and staging | devops + security | NS-007 | T-016 and incident runbook pass |
| NS-013 | Dashboard schedule, who works, utilization | ui-ux + frontend | NS-009, NS-010 | T-020 pass; synthetic dashboard reviewed |
| NS-014 | Real multi-user refresh / reconnect behavior | backend + frontend | NS-008 | T-019 pass under simultaneous editing |
| NS-015 | Staff acceptance, Treatwell resolution and cutover rehearsal | coordinator + QA | NS-009 through NS-014 | Zero unexplained future appointment mismatches, explicit signoff |
| NS-016 | Optional recurring + waitlist planning only | product-analyst + architect | NS-015 | Owner decision, no premature coding |

## Detailed first issue — NS-001
**Goal:** convert user screenshot observations + official help center behaviors into signed-off V1 requirements; identify unknowns, select the scope and first technical proof-of-concept. **No application code.**

**Definition of Ready:** screenshot observations documented without retaining PII; official article links cited; exact MVP/exclusions identified.

**Acceptance tests:** (1) every V1 feature has a requirement ID and one test; (2) calendar, dashboard, settings controls are mapped; (3) six unresolved high-risk decisions are documented; (4) owner's explicit approval recorded; (5) no real customer data committed.

**Deliverables:** reviewed PRD, revised docs/02 + docs/03 + docs/07 + docs/10, `NS-003` comparison criteria, issue backlog. Must not mark the ticket done without owner acceptance.

## Detailed calendar spike — NS-003
**Goal:** code two isolated scheduling UI prototypes with the **same synthetic dataset**, test resource columns and touch rather than claiming library features.

**Acceptance:** 20 employees, >=200 appointment fixtures, dense day view, selectable slots, modal, move across technicians, resize, week selected employee view, responsive tablet fallback, German time labels, no inaccessible mandatory hover; benchmark render time on target devices; record licensing and APIs; ADR-001 selects/defers with evidence. These prototypes do not use real backend data and cannot be represented as a functioning booking engine.
