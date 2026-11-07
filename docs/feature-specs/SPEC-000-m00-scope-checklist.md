# SPEC-000 / NS-001 — M00 scope checklist

**Status:** Ready for Owner confirmation (engineering reconciliation complete)  
**Canonical source:** `docs/MASTER_ARCHITECTURE.md` V2  
**Supporting:** `docs/01`–`03`, `docs/07`, `docs/DOC_CONFLICTS.md`

## V1 in scope (confirmed against V2)

| ID | Capability | Evidence docs |
|---|---|---|
| BR-01 | Multi-employee day calendar + selected-employee week | V2 §3, UI_SPEC CAL |
| BR-02 | Quick-create from empty slot (customer/walk-in + services) | UJ-01, Flow A |
| BR-03 | Edit / move / resize / cancel / no-show with audit | Flows B–C |
| BR-04 | Staff shifts, absences, salon hours | Flow D, SZ-05 |
| BR-05 | Services categories, duration/price, staff eligibility | SZ-07 |
| BR-06 | Customers search/create/history/rebook (salon-scoped) | Flow E |
| BR-07 | Cross-salon shared staff without double-booking | Flow F, SZ-06 |
| BR-08 | Salon-scoped RBAC; staff ≠ login users | Personas |
| BR-09 | PostgreSQL exclusive allocations (GiST) | Architecture § |
| BR-10 | Live calendar updates (SSE + poll fallback) | ADR-007 proposed |
| BR-11 | Salonized import staging + reconciliation before cutover | M15–M18 |
| BR-12 | German locale defaults | ADR-005 |

## Explicitly out of V1

- POS, payments, invoices, VAT, gift cards, marketing
- Unverified Treatwell two-way API sync (strategy required before go-live)
- Public online booking widget (later; same booking engine)
- Recurring series and waiting list (P1/P2 unless Owner promotes)

## Screenshot-derived screens mapped

| Screen | V1 priority | Notes |
|---|---|---|
| Calendar | P0 | Dense 20-col; original assets |
| Dashboard | P1 | After vertical booking slice unless Owner promotes |
| Settings | P0 admin | Exclude billing/register/loyalty |

## Calendar spike criteria (feeds M03 / ADR-004)

- ≥20 staff columns, ≥250 synthetic appointments
- Day view + employee week view
- Desktop drag/resize; iPad tap + form fallback
- German labels; no mandatory hover
- DayPilot Lite vs React Big Calendar on identical fixtures

## Owner-open decisions (do not block M02–M04 prototypes)

| # | Decision | Default until decided | Blocks |
|---|---|---|---|
| D1 | Same legal entity for Jeannie/Juliet customer sharing? | Salon-scoped customers | M15/M18 privacy |
| D2 | Treatwell model at cutover | No production cutover until safe method tested | M18–M19 |
| D3 | Device inventory (desktop OS, iPad models) | Chrome desktop + Safari iPad QA targets | M17 |
| D4 | Which P1 are launch-critical (waitlist, reminders, dashboard)? | Keep as P1 | Scope creep |
| D5 | Hosting / RPO-RTO / backup retention | ADR-011 pending | M16 |
| D6 | Auth provider + MFA | Decide before M05 coding | M05 |

## Acceptance for closing M00 paperwork

- [x] V1 features have BR IDs above
- [x] Calendar / dashboard / settings mapped
- [x] Six high-risk Owner decisions listed
- [x] Conflicts kit vs V2 recorded in DOC_CONFLICTS
- [ ] Owner explicit written approval of this checklist (required to mark M00 Done)

**Engineering recommendation:** Approve checklist; proceed M02/M03/M04 under defaults above.
