# Initial small, issue-ready development tickets

**Canonical milestones:** Master Architecture **M00–M19** (see [`docs/DOC_CONFLICTS.md`](../docs/DOC_CONFLICTS.md) for NS→V2 map).  
**Cross-module behavior:** [`docs/SALONIZED_FUNCTIONAL_GUIDELINE.md`](../docs/SALONIZED_FUNCTIONAL_GUIDELINE.md) rules SF-001–SF-048 are mapped to owners, side effects, and tests in [`CROSS_MODULE_CONTRACT.md`](CROSS_MODULE_CONTRACT.md). Discovery evidence: [`docs/discovery/`](../docs/discovery/) (handoff: [`IMPLEMENTATION_HANDOFF.md`](../docs/discovery/IMPLEMENTATION_HANDOFF.md)).  
**Status notes (2026-11-08):** NS-002/M01 done. M02/M03/M04 on shared branch. **Owner UI approved:** UI-01=B, UI-02=B, UI-03=A, UI-04=A, UI-05=A (+future color modes), UI-06=A, UI-07=defer PR#2. **NS-017** PR #1 — closeout in progress (lockfile sync for CI). Harness ≠ final UI. **Sequence:** NS-017 CI green → Owner review → NS-008 Salonized modal.  
`SZ-*` source map in docs/02, `T-*` tests in docs/08. Calendar spike fixtures: **≥250** events (V2), not 200.

| Ticket | Task | Lead | Depends on | Status / evidence / exit |
|---|---|---|---|---|
| NS-001 | Audit requirements, UI screenshots and conflicts; final PRD + risk decisions | product-analyst + architect | — | Largely superseded by discovery pack + M00 docs; Owner still owns open UI decisions |
| NS-002 | Set up Next.js/TS repo, scripts, GitHub Actions and fake fixture plumbing | devops + frontend | NS-001 | **Done** (engineering) |
| NS-003 | Calendar component A/B spike with 20 staff, ≥250 fake events | UI/UX + frontend + QA | NS-001, NS-002 | Spike harness shipped; ADR calendar library not final |
| NS-004 | Approve final daily calendar design tokens, responsive screen states | ui-ux-designer | NS-003 + Owner UI-01/02 | **Blocked on Owner UI approval** (see handoff §5) |
| NS-005 | Catalog, staff, salons and auth model migrations with RBAC | backend | NS-001, NS-002 | Schema + login/salon scope **partial**; Calendar-view role parity still open |
| NS-006 | Weekly schedules, overrides, breaks and absence domain | backend | NS-005 | Shifts used by Engine; **absence CRUD + Flow D gate incomplete** |
| NS-007 | Exclusive resource allocations + server booking API | backend + QA | NS-005, NS-006 | **Absorbed into NS-017** Engine |
| NS-017 | PostgreSQL booking engine (create/move/cancel + IT-01–IT-08) | backend + QA | M04 schema | **In PR #1** — closeout = CI green + Owner review before calling done |
| NS-008 | Booking quick sheet + create end-to-end (Salonized-inspired, German) | frontend + backend | NS-017 closeout, NS-004 direction | **Next product E2E** — IT-09, IT-10; fix SF-020 single-txn customer+book |
| NS-009 | Move/resize/cancel/status/no-show with audit | frontend + backend + QA | NS-008 | IT-11, IT-12; no-show retains occupancy (Flow C) |
| NS-010 | Customer history, lookup, staff access restrictions | backend + frontend | NS-005, NS-008 | T-014 / SF-019,035 |
| NS-011 | Salonized import preview and idempotent staging importer | backend + security + QA | NS-010 + redacted export sample | IT-14 |
| NS-012 | Encrypted backups, restore, monitoring and staging | devops + security | NS-017 | IT-15 restore / T-016 |
| NS-013 | Dashboard schedule, who works, utilization | ui-ux + frontend | NS-009, NS-010 | SF-045 |
| NS-014 | Real multi-user refresh / reconnect behavior | backend + frontend | NS-008 | SF-038 |
| NS-015 | Staff acceptance, Treatwell resolution and cutover rehearsal | coordinator + QA | NS-009 through NS-014 | Owner signoff |
| NS-016 | Optional recurring + waitlist planning only | product-analyst + architect | NS-015 | **P2** unless Owner promotes; no premature coding |
| NS-018 | Staff/service/timetable admin parity (post Engine) | frontend + backend | NS-017, NS-008 | SF-001, SF-007 UI polish (was “new NS-018 after NS-017”) |

## Detailed first issue — NS-001
**Goal:** convert user screenshot observations + official help center behaviors into signed-off V1 requirements; identify unknowns, select the scope and first technical proof-of-concept. **No application code.**

**Definition of Ready:** screenshot observations documented without retaining PII; official article links cited; exact MVP/exclusions identified.

**Acceptance tests:** (1) every V1 feature has a requirement ID and one test; (2) calendar, dashboard, settings controls are mapped; (3) six unresolved high-risk decisions are documented; (4) owner's explicit approval recorded; (5) no real customer data committed.

**Deliverables:** reviewed PRD, revised docs/02 + docs/03 + docs/07 + docs/10, `NS-003` comparison criteria, issue backlog. Must not mark the ticket done without owner acceptance.

## Detailed calendar spike — NS-003
**Goal:** code two isolated scheduling UI prototypes with the **same synthetic dataset**, test resource columns and touch rather than claiming library features.

**Acceptance:** 20 employees, >=200 appointment fixtures, dense day view, selectable slots, modal, move across technicians, resize, week selected employee view, responsive tablet fallback, German time labels, no inaccessible mandatory hover; benchmark render time on target devices; record licensing and APIs; ADR-001 selects/defers with evidence. These prototypes do not use real backend data and cannot be represented as a functioning booking engine.
