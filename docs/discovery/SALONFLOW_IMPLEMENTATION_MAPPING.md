# SalonFlow implementation mapping

Governing scope: Master Architecture V2 + AGENTS.md. Discovery expands understanding; it does **not** add POS/payments/payroll.

## Priority legend

- **P0** — essential internal booking
- **P1** — complete daily operations
- **P2** — useful later
- **OUT** — payments, POS, payroll, unnecessary SaaS clones

## Feature map

| Feature | Source workflow | SalonFlow requirement | Module | Repo status (approx.) | Missing | Dependencies | Role | Acceptance | Milestone |
|---|---|---|---|---|---|---|---|---|---|
| App shell German nav | Inventory / UI_REFERENCE | Kalender/Kunden/Mitarbeiter/Leistungen/Einstellungen | shell | **Partial** `nav-items.ts`, app routes | Übersicht dashboard | — | frontend | German nav works | M02 |
| Dense calendar day/week | CAL-* | Staff columns, 15-min grid, filters | calendar | **Partial** adapters + day grid | production booking binding, week parity, waiting-list row | M03/M09 | frontend | iPad density | M03/M09 |
| Create appointment sheet | APT-001 | Service/employee/customer/time; server save | booking | **Engine done (PR#1)**; UI = harness form only | Salonized-like sheet, Find availabilities, SF-020 single txn | M08/M09 | fe+be | FLOW-03 · IT-09/10 | NS-008 |
| Edit / reschedule / cancel | APT-002/003 | Atomic update; audit; no silent fail | booking | **Engine move/cancel in PR#1** | drag revert UX, no-show≠cancel, history panel | M10 | fe+be+qa | SF-024/025/027 · IT-11/12 | NS-009 |
| Availability engine | TIM + Find availabilities | Hours/absences/conflicts | domain | **Shift checks in Engine** | absences CRUD, Flow D, availability DTO | M06/M07 | backend | IT-04/12 | NS-006 remainder |
| Staff admin | EMP-* | Bookable staff + colors + active | staff | **Partial** staff-admin + API | eligibility UI, deactivate warnings | M04 | fe+be | SF-001–006 | M14 |
| Timetable / absences | TIM-* | Opening hours, breaks, leave | roster | **Partial** staff hours API | absence CRUD UI, breaks | M06 | fe+be | SF-007–012 | M06/M14 |
| Services catalog | SVC-* | Categories, duration, price | services | **Partial** service-admin + API | packages, resources link | M04 | fe+be | SF-015–017 | M14 |
| Customers | CUS-* | Search + profile + booking link | customers | **Partial** customer-admin + API | groups, merge, in-sheet create | M13 | fe+be | SF-018–020 | M13 |
| Auth / RBAC | SET-004 | Sessions, salon scope, roles | auth | **Partial** auth routes | Calendar-view role parity | M05 | be+sec | unauthorized rejected | M05 |
| Locale defaults | SET-002 | de-DE, Berlin, Monday, 24h, EUR | locale | **Partial** `domain/locale` | settings admin UI | — | fe | SF-041 | M02/M14 |
| Dashboard agenda | DASH-* | Today list, who’s working | dashboard | Missing / thin | widgets | M09 | frontend | SF-045 | post-M09 |
| Waiting list | WAIT | Counts + convert via booking | waitlist | Missing | entire feature | M09 | fe+be | SF-037 | **P2** (Architecture; Owner may promote per DOC_CONFLICTS) |
| Messages / reminders | MSG | Outbox after commit | notifications | Missing | templates/outbox | M09 | be | SF-043 | P2 |
| Online widget | ONLINE | Future public booking | online | Missing | widget | booking core | fe+be | architecture ready | P2 |
| Reports sales/VAT | REP | — | — | n/a | — | — | — | — | **OUT** |
| Register/Products | POS | — | — | n/a | — | — | — | — | **OUT** |
| Data export/import | EXP | Controlled export + import staging | ops | Missing | redacted sample | M15 | devops+be | safe repeat import | M15 |
| Live multi-user refresh | Calendar | Poll/reconnect | realtime | Missing | websocket/poll | M09–11 | fe+be | two-browser test | M12 |

## Recommended near-term engineering sequence

1. **NS-017 closeout** — CI lockfile + green checks (do not call Engine “done” while CI red).
2. **NS-008** — Salonized-inspired German create sheet on live Engine (IT-09/IT-10).
3. **NS-006 remainder** — absences + Flow D (feeds Find availabilities + IT-12).
4. **NS-009** — move/cancel/no-show with Flow C occupancy.
5. NS-010 customers → NS-014 realtime → NS-013 dashboard.
6. Waitlist/recurrence stay **P2** (NS-016) unless Owner promotes.

See [`IMPLEMENTATION_HANDOFF.md`](IMPLEMENTATION_HANDOFF.md) for Owner UI decisions UI-01…UI-07.

## Roles

| Work | Primary agent |
|---|---|
| Calendar/create UI | frontend-engineer + ui-ux-designer |
| Booking engine/constraints | backend-engineer |
| Evidence/concurrency/device | qa-engineer |
| Auth/PII/export | security-reviewer |
| CI/backups/import drill | devops-engineer |
| Traceability | product-analyst |
| PR challenge | independent-reviewer |
