# SalonFlow — Salonized-Informed Functional Behavior & Integration Guideline

**Version 1.0 | Research date: 7 November 2026 | Intended consumer: Cursor project coordinator, product analyst, frontend/backend/QA agents**

> **North star:** Deliver usable, reliable, multi-location SalonFlow software that replaces Salonized for daily internal bookings at Jeannie Nagelstudio, Juliet – Salon de Beauté and future sites. This is an IMPLEMENTATION CONTRACT and source-derived behavior map—not a request to recreate Salonized's code or copyrighted graphics.

## 0. How to use this guide

1. Read `AGENTS.md` and `docs/MASTER_ARCHITECTURE.md` first. This file adds **behavioral and cross-module requirements**; it does not supersede the master architecture. If something conflicts, raise a decision record rather than silently changing architecture.
2. Every requirement is tagged **[D] documented Salonized behavior**, **[S] observed in user-provided Salonized screenshots**, **[SF] explicit proposed SalonFlow behavior**, or **[V] requires verification with a real Salonized workflow/sample export**. **[D] describes Salonized, not proof that SalonFlow has implemented it.**
3. Use reference images only if legitimately supplied and redacted. Do not put customer names, emails, phone numbers, treatment notes, or exposed browser/account identifiers into GitHub or Cursor cloud. Never bulk-download or copy third-party help-site images without checking rights; use original URLs to view illustrated articles, and create original wireframes.
4. Every cross-module rule should become an executable integration or end-to-end test. Do not mark a requirement complete on the basis of a UI screenshot.
5. Prioritize the **daily booking workflow**. MVP = secure staff/salons/services/customers, working hours/absences, appointments, calendar, cross-location resource integrity, and usable editing/cancellation. Advanced online booking, POS, inventory, marketing and payments are not MVP requirements.

## 1. Reference coverage and limitations

Research inspected the Salonized Help Center directory and key individual documentation for calendar, staff/roster, services, customers, multi-location, resources, recurring bookings, dashboard, data exports, settings, and selected messaging/marketing workflows. The Help Center contains further specialist articles that have **not all been read or individually validated**, particularly POS, register, sales/invoicing, inventory, websites, 27 integrations, and niche marketing workflows. This is therefore a **substantial, risk-prioritized functional audit, not a certified exhaustive copy of every Salonized article**. Public help text may not cover hidden UI behavior or account-specific plan features. Re-check links during implementation.

### Main official collections
- Help index: https://help.salonized.com/en
- Calendar (25 help articles): https://help.salonized.com/en/collections/14685-calendar
- Customers (18 articles): https://help.salonized.com/en/collections/14687-customers
- Financial reports: https://help.salonized.com/en/collections/14696-financial-reports

### Source key (official articles)
| ID | Article and URL | Focus |
|---|---|---|
| S01 | [New employee](https://help.salonized.com/en/articles/572314-how-do-i-add-a-new-employee) | employee creation, timetable, service eligibility |
| S02 | [New user account](https://help.salonized.com/en/articles/572149-new-user-account) | employee vs login, activity logs |
| S03 | [Opening and working hours](https://help.salonized.com/en/articles/589568-how-do-i-manage-my-opening-and-working-hours) | inherited hours, overrides, recurring patterns |
| S04 | [Breaks in timetable](https://help.salonized.com/en/articles/2127217-how-do-i-add-a-break-to-my-timetable) | split shifts, unavailable gaps |
| S05 | [Holiday or absence](https://help.salonized.com/en/articles/2127154-how-do-i-add-a-holiday-or-an-absence) | absence target and exclusion |
| S06 | [Several locations, staff](https://help.salonized.com/en/articles/4448922-how-can-i-add-and-manage-team-members-in-several-locations) | shared staff and daily location hours |
| S07 | [Locations in one account](https://help.salonized.com/en/articles/3721799-multiple-locations-in-one-account) | shared/global records and local appointments |
| S08 | [Calendar settings](https://help.salonized.com/en/articles/572381-how-do-i-manage-my-calendar-and-appointment-settings) | grid interval, color, notifications |
| S09 | [Schedule appointments](https://help.salonized.com/en/articles/572355-schedule-appointments) | entry points and creation flow |
| S10 | [Getting started](https://help.salonized.com/en/articles/1337254-how-do-i-get-started-with-salonized) | calendar, edit/move, emails |
| S11 | [Recurring appointments](https://help.salonized.com/en/articles/3180989-recurring-appointments) | series, conflict previews |
| S12 | [Edit recurring series](https://help.salonized.com/en/articles/3395236-how-do-i-change-or-delete-an-appointment-in-a-recurring-series) | single vs future occurrence |
| S13 | [Services and categories](https://help.salonized.com/en/articles/572358-how-do-i-manage-categories-and-services-on-salonized) | service category, duration, processing, resources |
| S14 | [Buffer time](https://help.salonized.com/en/articles/4030902-how-can-i-use-buffer-time-to-create-gaps-between-my-appointments) | buffer occupancy, historical snapshot |
| S15 | [Room/tool](https://help.salonized.com/en/articles/2888436-how-do-i-add-a-room-or-tool) | resource scheduling |
| S16 | [Customers](https://help.salonized.com/en/articles/572660-customers) | manual/booking customer creation |
| S17 | [Merge customers](https://help.salonized.com/en/articles/572919-merge-customers) | duplicates and retained history |
| S18 | [Customer labels](https://help.salonized.com/en/articles/9630298-customer-labels) | tags/segments |
| S19 | [Extra customer information in calendar](https://help.salonized.com/en/articles/5930179-additional-customer-information-in-the-calendar) | new/returning, previous visit |
| S20 | [Service suggestions](https://help.salonized.com/en/articles/5454332-service-suggestions) | popularity, previous service, combinations |
| S21 | [Chores](https://help.salonized.com/en/articles/2064809-adding-chores) | booked time vs work time |
| S22 | [Appointment labels](https://help.salonized.com/en/articles/3238450-appointment-labels) | appointment markers |
| S23 | [Waitlist](https://help.salonized.com/en/articles/6596405-how-can-i-use-the-waiting-list-to-manage-my-calendar) | waitlist and converting to booking |
| S24 | [Widget settings](https://help.salonized.com/en/articles/572457-how-can-i-manage-the-booking-widget-settings) | eventual public booking |
| S25 | [Dashboard explained](https://help.salonized.com/en/articles/1278943-the-dashboard-explained) | today's staff, utilization, notes |
| S26 | [Data export](https://help.salonized.com/en/articles/573326-how-do-i-export-data-for-my-accounting) | monthly/lifetime exports and locations |
| S27 | [General account settings](https://help.salonized.com/en/articles/572124-general-account-settings) | language/currency/time zone |
| S28 | [Treatment reports](https://help.salonized.com/en/articles/572902-how-do-i-manage-treatment-reports-for-my-appointments) | appointment/customer notes and images |
| S29 | [Google Calendar absence sync](https://help.salonized.com/en/articles/9235463-google-calendar-events-as-absences-in-salonized) | optional future integration |
| S30 | [Google Calendar appointments](https://help.salonized.com/en/articles/573376-how-can-i-integrate-my-google-calendar-with-salonized) | optional sync, not MVP |
| S31 | [Multiple location options](https://help.salonized.com/en/articles/3239387-can-salonized-be-used-for-multiple-locations) | shared-account vs connected accounts |

**Image reference rule:** these articles include some embedded help-site illustrations and screenshots; open the respective pages as a **visual reference**. Link to them; do not paste copies of website images into the repository. User-provided Salonized screenshots, after redaction, are the primary actual-screen references at `docs/references/salonized/`.

## 2. Priority scope and ownership

| Domain | MVP | Later | Excluded initially |
|---|---|---|---|
| Calendar | day view with staff columns, individual week, create/edit/move/cancel, blocked time, search/filter | recurring series, advanced colors/labels | none |
| Staff | create/edit/deactivate, employee calendar columns, eligible services, salon assignments, rosters | advanced analytics | employee payroll |
| Customer | profile, search, appointment history, notes, duplicate flags | merge workflow, custom fields, labels, reports | campaign automation |
| Services | categories, price/duration snapshots, multiple services, qualifications | processing phases, buffers/resource variations | inventory |
| Settings | German locale, week starts Monday, Europe/Berlin, salon access | optional language variants | subscription/billing |
| Messaging | no external sends in first vertical slice | confirmations, reminders, delivery logs | marketing bulk campaigns MVP |
| Multi-location | shared staff identity, salon-specific calendar, explicit access control | location comparison analytics | external franchise platform |
| Exports/imports | protected sample export, preview and mapping | production reconciliation with real data | unsupported Treatwell live sync |
| Reporting | appointments, no-show, staff utilization from booking data | waitlist, broader reporting | POS revenue/VAT reports |
| Customer online booking | backend architecture must allow it | pay-at-salon widget | payment gateways |

## 3. The core dependency principle

**The app is a graph of linked state, not independent pages.** Every mutation must specify: (a) authoritative data write, (b) validation, (c) affected read models and calendar views, (d) permission scope, (e) notification/audit, (f) failure/rollback, and (g) test.

### Cross-module dependency catalog (implementation contract)

| Rule | User action / command | Required system consequence | Tests | Source |
|---|---|---|---|---|
| SF-001 | Admin creates a **bookable employee** | Persist employee, optional salon assignment, create stable calendar resource identity; employee appears in appropriate staff selector/calendar column without needing a login | E2E create employee → calendar column visible | [D S01,S02]; [SF] visibility invariant |
| SF-002 | Admin creates a **login user** only | Can authenticate if authorized; does **not** automatically become technician/calendar column | login-only account not bookable | [D S02] |
| SF-003 | Employee's name/color changes | Calendar header/cards update without modifying historical appointment identity | new color/name in all relevant views | [D S01]; [SF] immediate update |
| SF-004 | Employee activated/deactivated | New bookings disabled for inactive employee; history preserved; existing future bookings highlighted for reassignment before deactivation | no new eligible slots; future appointments warning | [SF] safety rule; confirm source deletion behavior [V] |
| SF-005 | Employee assigned to salon | Employee appears in salon staff selector and calendars according to active assignment; authorized locations only | staff appears in A not B; cross-salon permissions | [D S06,S07]; [SF] |
| SF-006 | Employee removed from salon | Prevent new bookings there; enumerate affected future appointments; no silent deletion | removal requires handling future appointments | [SF] |
| SF-007 | Inherited employee hours | Available hours follow designated salon's opening hours | salon hours change updates derived availability | [D S01,S03,S06] |
| SF-008 | Manual staff hours set | These replace inherited hours as configured; calendar nonworking regions and available slots update | shift outside hours rejected | [D S03] |
| SF-009 | Timetable date exception | Change only selected day or future recurring pattern; no past silent rewrite | one-day vs all-future distinction | [D S03,S04] |
| SF-010 | Split working day (break) | Gap unavailable and not working time; cannot book into it | 12:00-13:00 gap excluded | [D S04] |
| SF-011 | Employee absence created | Employee shows blocked calendar region, new booking slots removed; preexisting conflicts surfaced | one employee blocked; others free | [D S05] / [SF] conflict handling |
| SF-012 | Company/room/tool absence | Only appropriate scope/resource loses availability | company blocks all; tool blocks service use | [D S05,S15] |
| SF-013 | Employee works in multiple salons | One employee identity with assignments; no overlapping occupancy at sites; calendar filter reflects location | simultaneous A/B booking → one success | [D S06]; stricter [SF] exclusivity |
| SF-014 | Salon created | New calendar context, settings, rosters, permissions available; no fabricated staff or appointments | new empty branch displays | [D S07]; [SF] |
| SF-015 | Category/service created | Eligible service appears in admin catalog and booking search; staff qualification rules apply | selection from appointment form | [D S13] |
| SF-016 | Service duration/price edited | New bookings use new values; existing appointment item snapshot preserved | historical price and duration unchanged | [D S14] buffer future-only; [SF] general snapshots |
| SF-017 | Employee service eligibility changes | Booking form and candidate availability filter eligibility immediately | nonqualified staff cannot be booked automatically | [D S01,S13] |
| SF-018 | Booking from empty slot | Salon, staff, date/time prefilled; new/customer search; selected services determine duration | save then render in intended column | [D S09]; [S screenshot] |
| SF-019 | Booking from customer profile | Customer preselected and user navigated to schedule workflow | profile → booking → customer retained | [D S09] |
| SF-020 | New customer created inside booking | Customer saved, added to search, linked to appointment once transaction succeeds | profile accessible and linked | [D S09,S16] |
| SF-021 | Multi-service booking | Ordered service items, each duration, eligible staff and frozen snapshots; sum computes visit duration plus eligible buffers | 2 services correct sequencing | [D S09,S13,S14]; [SF] data shape |
| SF-022 | Save appointment | Backend validates auth/location/hours/absence/eligibility/resources; inserts appointment, allocations, audit atomically | success persisted; conflict 409 rolls all back | [SF] stricter-than-source engineering |
| SF-023 | Two users book same employee/time | Exactly one booking commits; other sees current availability and retains form | parallel database concurrency test | [SF] |
| SF-024 | Reschedule via drag or details | Re-run booking engine, update occupation atomically, revert UI on rejection, notify authorized viewers | conflicting drag returns 409 | [D S10] move options; [SF] rollback |
| SF-025 | Cancel booking | Status/audit retained, exclusive future slot freed, dashboard counts refreshed | slot reusable, audit retained | [SF], cancellation concept [D S10] |
| SF-026 | Change appointment status | Persist status and display label; only authorized users; status transitions defined in app | invalid transitions rejected | [SF] |
| SF-027 | Mark no-show | Store no-show history and applicable customer indicator | future CRM counts accurate | [D calendar collection]; [SF] |
| SF-028 | Add chore | Technician blocked, counts as work for utilization/worked-hours analytics; distinct calendar pattern | chore != absence metrics | [D S21] |
| SF-029 | Add note | Note displayed in intended date/context; no technician allocation unless explicitly marked blocking | note does not block booking | [D S25] / [SF] |
| SF-030 | Edit calendar slot interval | Changes grid representation only, not booked appointment timestamps | change 15→5 min without mutation | [D S08] |
| SF-031 | Change appointment card color basis | Recolors view by employee or service category; does not change appointment semantics | same record, alternate appearance | [D S08] |
| SF-032 | Recurring series creation | Generate bounded occurrences, preview collisions, save coherently; no infinite upfront DB inserts | repeat and conflict tests | [D S11]; [SF] safe bounded implementation |
| SF-033 | Edit recurring occurrence | Offer only-this vs future-series, and preserve detached exceptions | detached item unaffected by later series edit | [D S12] |
| SF-034 | Room/tool requirement added to service | Future bookings must allocate both staff and required exclusive resource | same room cannot double-book | [D S13,S15]; later |
| SF-035 | Customer selected in booking form | Show relevant past services and customer alerts, if permission allows | customer history recommendations | [D S19,S20]; later enhancements |
| SF-036 | Duplicate customer merge | Consolidate linked booking/history references, preserve audit, run controlled merge | appointments preserved | [D S17]; later |
| SF-037 | Waiting-list entry booked | Convert waitlist candidate to real appointment only through booking engine; archive/remove entry after success | failure does not remove waitlist entry | [D S23]; later |
| SF-038 | Booking created/changed | All authorized open calendars refresh promptly, unauthorised users see nothing | multi-client test with permission | [SF] |
| SF-039 | Reporting date/location changed | Counts query appointments at correct local time boundaries; do not label service value as collected revenue | correct DST/date-boundary stats | [D S25]; [SF] |
| SF-040 | Salonized import re-run | Preserve source IDs, idempotence, preview counts, no duplication | import same export twice | [D S26] export support; [SF] import architecture |
| SF-041 | Language/timezone changed | Display uses configured time zone and German locale; persist UTC instants; no underlying booking shift | Europe/Berlin DST tests | [D S27]; [SF] |
| SF-042 | Archived employee/service/customer | Historical appointments still render readable immutable snapshots | historical calendar stable | [SF] |
| SF-043 | Customer communication enabled | Send transactional confirmation/reminder through explicit outbox after booking commit; retries idempotent | one send per event; no send on rollback | [D S10]; [SF] later |
| SF-044 | User permissions changed | API, exports and real-time feeds enforce new salon scope; no cross-location leakage | role-restriction tests | [D S02] separate roles; [SF] |
| SF-045 | Dashboard opens | Today list, staff currently scheduled, utilization derived from same source of truth | booking update reflects metrics | [D S25] |
| SF-046 | Staff absent with existing appointments | Surface conflict resolution list to manager and retain appointments until explicitly rescheduled | no hidden loss | [SF] |
| SF-047 | Application network fails after Save | Retry safely using idempotency key; no duplicate appointment or uncertain silent state | retry same request creates once | [SF] |
| SF-048 | Two users edit same appointment | Version condition rejects stale update, returns 409 with refresh option | stale version rejection | [SF] |

**Clarification:** Not all [SF] rules are exact Salonized behavior; they are decisions for **a safer, more reliable SalonFlow implementation**. For instance, we propose a warning before deactivating a staff member with future bookings. Do not misattribute this to Salonized.

## 4. Domain flows (human-readable contract)

### FLOW-01 — Create employee → calendar
**Preconditions:** owner/manager authorized for salon. **Trigger:** `Settings → Employees → New Employee`.
1. Enter name (required), optional color/contact, assigned salons, working-hours mode, service eligibility.
2. Save employee and location assignments transactionally; create stable staff resource ID. Employee ≠ login account.
3. Employee list updates. Calendar staff headers, booking staff dropdown, and timetable rows derive from active staff assignments.
4. If inherited hours: derive from salon opening hours; otherwise use manual shifts. Empty working hours do not authorize any appointments.
5. Never create fake appointments. If no working hours or no eligible services, show employee in manager's staff view with clear unavailability rather than silently omitting the employee.
**Failure:** validation/authorization errors do not partially create assignments. **Acceptance:** staff can be seen in correct location's calendar immediately; another salon cannot book them without assignment. **Sources:** S01,S02,S03,S06.

### FLOW-02 — Add/change service → appointment options
1. Create category, then service with name, base duration, price and optional eligibility/variation.
2. If active at salon and staff qualified, expose it in booking search/suggestions.
3. Booking service selection may include multiple ordered lines; snapshot price, duration, and name upon booking.
4. Edits affect future selections; existing appointments keep their booked snapshots unless explicitly edited. **Sources:** S13,S14,S20.

### FLOW-03 — Calendar → new appointment → persistence
1. Select salon and date; click an empty technician/time slot OR top `Create appointment` button.
2. Open modal/drawer matching screenshot semantics: `Appointment`, `Absence`, `Chore`, `Note` are separate event types.
3. Search or create customer; choose one or more services and eligible technician(s); see calculated duration/time. Optional note.
4. Preview availability in UI; server revalidates during save, guaranteeing no simultaneous conflicts.
5. Save in transaction, commit audit, publish only permitted refresh signal. Appointment appears in correct salon, day, employee column; dashboard counts update.
6. On conflict, preserve unfinished form and suggest next available slots. **Sources:** S09,S10,S21,S25; user's actual booking-dialog screenshot for layout only.

### FLOW-04 — Move/edit/cancel
1. Click appointment → details, change service/time/employee or drag card.
2. Require current version, check permissions and all new allocations; commit atomically or reject and restore card.
3. Cancellation preserves history and releases occupied future allocations; all authorized viewers update.
4. Historical service snapshots remain readable if catalog names later change. **Sources:** S10; exact conflict and audit guarantees [SF].

### FLOW-05 — Working schedule / absence / chore
1. Salon sets opening hours; employee inherits those hours or uses explicit timetable blocks.
2. Breaks = gaps between shifts; absence creates separately scoped unavailability; chore blocks bookings but counts as work.
3. Changing any of these must invalidate availability and surface conflicts with existing future bookings.
4. Multiple locations share staff resource identity, preventing cross-salon double use. **Sources:** S03,S04,S05,S06,S21.

### FLOW-06 — Customer/customer history
1. Create customer from Customers page, calendar form or later public widget; required name per chosen SalonFlow rules.
2. New profile searchable immediately; appointments link to it; show new/returning and last-visit indicator where permitted.
3. Merge duplicate records later using preview, audited consolidation and no deleted history. **Sources:** S16,S17,S19.

### FLOW-07 — Dashboard
1. Show today's appointment list, working technicians, notes, cancellations and utilization.
2. All values are read-only derived projections from authoritative booking/roster records.
3. No POS or actual-revenue figures absent a separately integrated cash-register system. **Sources:** S25; no-POS choice [SF].

## 5. Architecture rules that make the dependencies work

### Recommended modules (modular monolith)
`auth-permissions`, `salons`, `staff`, `rosters`, `services`, `customers`, `booking`, `calendar-read-model`, `time-blocks`, `audit`, `imports`, `reporting`, later `notifications`, `waiting-list`, `public-booking`.

### Command ownership
Only `booking` can create, reschedule, cancel or allocate appointment resources. `staff`, `rosters`, `services`, `salons` provide validated facts; calendar displays read models. Multiple screens may invoke booking commands but must not duplicate scheduling rules.

### Authoritative database (concept)
`salons`, `staff`, `staff_salon_assignments`, `users`, `user_salon_roles`, `staff_user_links`, `service_categories`, `services`, `salon_services`, `staff_service_eligibility`, `weekly_shifts`, `shift_overrides`, `absences`, `time_blocks`, `customers`, `appointments`, `appointment_service_items`, `resources`, `resource_allocations`, `appointment_audit`, `import_batches`, `external_id_map`, `outbox`.

### Exclusivity invariant
Use PostgreSQL `tstzrange` half-open ranges and `EXCLUDE USING gist (resource_id WITH =, period WITH &&)` for **active** allocations, with `btree_gist`; non-null resource identity shared across location views. Insert all allocations inside the appointment transaction. Validate shifts and absences within the same serialized/locked scheduling context. A database exclusion constraint alone does not enforce shift and leave rules; concurrency correctness must cover those checks too. Support idempotency keys and `version` checks. HTTP 409 for conflicts. Do not use UI drag collision as final authority.

### Time/data
Persist UTC instants with IANA zone `Europe/Berlin` for display and recurrence/local-day logic. Preserve mutable service snapshot fields in `appointment_service_items`. Maintain audit history and archived/deactivated states rather than cascade-deleting historical data.

### Cross-module events/outbox
On successful commands emit scoped invalidation/events such as `EmployeeCreated`, `EmployeeAssignmentChanged`, `RosterChanged`, `ServiceChanged`, `AppointmentCreated`, `AppointmentRescheduled`, `AppointmentCancelled`, `AbsenceChanged`, `CustomerCreated`. These are internal typed events/read-model invalidations, **not** a microservices requirement. Do not publish real-time data beyond permission scopes. For email use a transactionally persisted outbox with idempotent delivery attempts.

### Example state cascade: new employee
```
Admin form → staff.create(command)
  → validate permission/name/assignment/service eligibility
  → transaction: insert staff, staff_salon_assignments, default roster mode, audit
  → commit
  → refresh staff list, timetable, calendar staff columns, booking staff picker
  → if no shift availability: show blocked/not bookable with explanation
  → QA: assert all four locations update correctly and no cross-salon leak
```

## 6. UI/UX reference guide

User-supplied real screenshots are the design benchmark for **workflow and information density**, not a license to redistribute Salonized graphics. Recommended screens:
- **Navigation:** dark compact vertical rail; Calendar, Customers, Team, Services, Dashboard, Reports, Settings. Exclude Register/Products/Payments initially.
- **Calendar:** full-width resource day grid, 15-minute slot rows (configurable 5–30), horizontally scrollable staff columns, frozen time ruler/staff headers, pastel service blocks, hatched/unavailable blocks, employee/date filters, today button, create appointment.
- **Create appointment:** large modal or side-sheet; service/length/technician, customer pane, date/time/availability, notes, final summary and primary Save; distinct tabs or entry modes for Absence, Chore, Note.
- **Customers:** searchable table, detail profile, upcoming/history; avoid all unnecessary billing columns.
- **Timetable:** salon opening hours, rows per technician, inherited/manual hours, recurring and single-day changes.
- **Dashboard:** daily appointments, on-shift employees, notes, booking utilization, no payment promo banners.
- **Settings:** general/locations/employees/resources/services/timetable/calendar/account/security/data export.
- **Mobile:** compact day/list view, employee filter, tap-first interactions; drag gesture optional fallback via reschedule dialog.

**Official illustrated articles for viewing (do not republish screenshots):** [New employee](https://help.salonized.com/en/articles/572314-how-do-i-add-a-new-employee), [Working hours](https://help.salonized.com/en/articles/589568-how-do-i-manage-my-opening-and-working-hours), [Multiple-location staff](https://help.salonized.com/en/articles/4448922-how-can-i-add-and-manage-team-members-in-several-locations), [Service setup](https://help.salonized.com/en/articles/572358-how-do-i-manage-categories-and-services-on-salonized), [Waiting list](https://help.salonized.com/en/articles/6596405-how-can-i-use-the-waiting-list-to-manage-my-calendar), [Booking widget](https://help.salonized.com/en/articles/572457-how-can-i-manage-the-booking-widget-settings).

## 7. QA contract — integration over isolated page mocks

For every new feature ticket require:
- Trigger and roles; affected entities; command and transaction; dependent screens/read models; error/retry states; audit and privacy; executable tests.
- Unit tests for domain rules; database integration tests for SQL constraints and transaction effects; Playwright for cross-page workflows; authorization tests; representative 20-person/250-booking calendar test; test in actual iPad browser before release.

**Mandatory cross-module E2E scenarios:**
1. Create employee from Settings → appears in employee selector, relevant calendar column and timetable without login.
2. New employee with no working hours → visible to admin, unavailable to book.
3. Assign employee to salon B → shows in B; book in B while already occupied in A → reject.
4. Create service → appears in booking dropdown only if active and employee eligible.
5. Modify service duration → historical appointments unchanged, new duration applied to new bookings.
6. Split roster into 10:00-12:00 and 13:00-18:00 → 12:30 booking rejected.
7. Create absence on booked day → affected appointments flagged, not erased.
8. Create customer within appointment modal → both profile and appointment persist.
9. Parallel create same employee/time → exactly one success, one 409.
10. Drag onto occupied time → rollback with understandable message.
11. Cancel booking → removed from active calendar occupancy, retained in history/audit.
12. Two editors patch same booking version → stale edit fails.
13. Week/daily dashboard counts reflect the same booking data.
14. Repeated import of same source file → zero duplicate imported records.
15. Test restore recovers customer/appointment relationships; disallowed roles cannot read another salon's data.
16. DST boundary conversion round-trips local date and UTC instants correctly.

**Definition of Done:** no empty-click UX, fake persistence, unauthorized data leakage, or silent booking-conflict overwrite. CI green, demonstrable browser workflow, recorded QA evidence, and owner acceptance.

## 8. Migration and operational risk

Salonized officially documents CSV/XLS monthly and lifetime export mechanisms and multi-location selection (S26). **Actual export schemas must be inspected before writing mappings.** Use dry run, preview, duplicate detection, source ID map, audit and reconciliation of all future appointments. User should keep Salonized authoritative during the pilot. Treatwell integration is not assumed accessible in a custom app; determine the practical Treatwell booking flow before cutover. Keep true customer data off unapproved cloud-agent workspaces.

## 9. Development order (optimizes for a usable system)

| Gate | Output | Evidence before proceeding |
|---|---|---|
| G00 | Master architecture + this behavioral guide + redacted screenshot references | no contradictory contracts; owner approves main workflows |
| G01 | Runnable app shell, login scaffold, CI and demo data | local build + CI + navigation |
| G02 | Calendar UI prototype with staff columns and create dialog | 20-staff performance and iPad walkthrough |
| G03 | Staff/services/customers/rosters persistent models | database and cross-module create-employee/service E2E |
| G04 | Transactional booking engine and appointment CRUD | overlapping resources, no double-booking, 409 retries |
| G05 | Connect all calendar actions to backend + live invalidations | real create/move/edit/cancel, multiple browsers |
| G06 | Roles, backups, import rehearsals, tablet tests, rollout plan | restore verified, full future-booking reconciliation, Treatwell path resolved |
| G07 | Salon pilot then controlled launch | receptionists complete tasks; explicit human go-live approval |

## 10. Cursor operating instruction (paste into project coordinator)

> Read `AGENTS.md`, `docs/MASTER_ARCHITECTURE.md`, and this guideline. Use S01–S31 to understand Salonized reference behavior and SF-001–SF-048 as the dependency and acceptance catalog. Do not build isolated screens. For each approved ticket create a traceable mapping from user action → command/transaction → affected screens → tests. Assign specialist agents, keep work in reviewable branches, require CI and independent review, and never deploy/merge automatically. Build the smallest real end-to-end booking slice first. Mark gaps [V], documented Salonized behaviors [D], and intentional SalonFlow decisions [SF]. Consult the supplied redacted screenshots for visual workflow reference; links to Salonized illustrations are references only. The goal is operational replacement of Salonized daily booking functionality—not more documents or a demo-only calendar.

## 11. Unverified behavior / decisions log

- [V] Whether an employee without a shift should appear immediately as a calendar column under every filter vs only after being shown/selected. **SalonFlow decision:** show in assigned-location admin view and employee picker, indicate unavailable.
- [V] Exact field-level validation/permission difference between editing appointment and drag-rescheduling in Salonized. **SalonFlow:** same authoritative booking rules.
- [V] Exact data export column schemas, encoding, and historical identifiers for this user's salon account.
- [V] Safe supported custom sync path with Treatwell, if any; no promise of live sync.
- [V] Whether Salonized's third-party embedded help illustrations can be reused outside its documentation; assume no redistribution rights until confirmed.
- [V] Current salon device model/browser and staff usability of drag/touch behavior.
- [V] Exact salon-specific employee availability, overlap exceptions, combined-service resource needs and cutover date.

**End of reference guideline.** Maintain versioned updates; do not casually modify agreed invariants without architectural approval.
