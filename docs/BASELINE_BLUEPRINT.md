# Private Nail Salon Booking Calendar — Product & Engineering Blueprint

**Version:** 1.0 | **Date:** 31 October 2026 | **Owner:** Internal salon business

## 1. Executive decision

Build a **private, multi-location appointment calendar** for Jeannie Nagelstudio, Juliet – Salon de Beauté, and the planned Heide location. The first usable release replaces **internal appointment and staff scheduling** workflows, not Salonized's POS, CRM marketing suite, inventory, or Treatwell's marketplace distribution. A later public booking widget may be built on the same scheduling engine; payments remain entirely out of scope.

**North-star workflow:** Receptionist chooses a time in a technician's column → searches customer / creates a walk-in → chooses service(s) → sees calculated duration and staff availability → saves → everyone sees the appointment. Target routine booking in 15 seconds when the customer and service are known.

**Non-negotiable:** The server and database, not the calendar UI, decide whether a booking is permitted. The system must be safe under concurrent usage, retain audit history, and support recovery from failures.

## 2. Users, navigation, and scope

| Persona | Must be able to do | Should not automatically see |
|---|---|---|
| Owner | All locations, users, settings, exports, audit, appointments | N/A |
| Manager | Assigned salons, staff rosters, services, appointments, customer info | Unassigned salons |
| Receptionist | Search/create customers, schedule/move/cancel bookings, add walk-ins | Global settings/audit/security |
| Technician | See own roster and assigned appointment information; optionally mark status | Unnecessary sensitive customer fields, other employees' restricted data |

A technician's *employee record* is independent of a *user account*: some employees are bookable without a login.

**In scope for MVP:** secured login/roles, salon switch, day and individual-week calendar, staff columns, appointment create/edit/reschedule/cancel, staff shifts/breaks/leave, customer lookup, services/durations, conflict protection, live refresh, basic search, import preview, audit and backups.

**Phase 2:** recurring series, multi-phase processing/buffers, equipment resources, email confirmations/reminders, richer customer history, CSV import execution and reconciliation, owner reporting, online booking (without payments).

**Explicitly out of scope:** online payment, POS/cash register, invoices, tax receipts, stock/inventory, payroll, marketing automations, third-party multi-tenant SaaS, unsupported Treatwell API synchronization.

## 3. Calendar screen: detailed design

### Desktop layout (primary)

- **Left sidebar (collapsible):** business name / salon selector; Calendar, Customers, Team, Services, Settings; signed-in user.
- **Top bar:** chosen salon, previous/next date, Today, date picker, Day/Week toggle, employee filter, search, **+ Appointment**, **+ Block time**.
- **Day view (default):** time ruler on left; technicians as **sticky horizontal column headers**; time runs vertically; clearly distinguish 15-minute rows; current-time line; out-of-shift grey overlays; breaks/absences hatched; appointment cards colored by service category with a small status marker.
- **Appointment card:** client first name + surname initial or full name according to privacy policy, service name, time range, concise status marker; readable at narrow column widths; tooltip and accessible label provide fuller information.
- **Quick-create side sheet:** chosen salon/employee/time prefilled; customer search by name/phone; + New customer / Walk-in; service search + recent/favorites; duration/end computed; notes; Save. Keep keyboard focus and shortcuts intuitive.
- **Appointment details sheet:** edit, reschedule, cancel, status, customer history, source tag, audit activity. Show explicit conflict reasons and affected resources.
- **Week view:** seven columns for selected technician, with staff switcher. Avoid compressing 20 employees × seven days into an unreadable grid.
- **Large team:** filter staff, horizontal scroll with sticky headers, optional grouping, stable 60 fps interactions where reasonable.
- **Tablet/mobile:** staff selector and day-first compact layout, tap-to-create, touch drag after hold; no essential capability dependent on hovering.

**Color system:** neutral surface, 5–7 restrained service-category tints, status communicated through icon/left stripe (never color alone), dark text and WCAG-conscious contrast. Date: DD.MM.YYYY, time: 24-hour, currency: EUR, UI: German default with English/Vietnamese possible.

### Core interaction states

1. Empty slot click → add appointment or block time.
2. Click booking → details / edit.
3. Drag booking to new time or employee → preview → submit to server → if invalid, revert and show precise reason.
4. Resize booking → duration-change confirmation; do not silently change catalog service length.
5. Cancel booking → confirmation + reason; retain historical record; release exclusive resources.
6. Two simultaneous receptionists → receive updates quickly; never overwrite or double-book.
7. Unsaved edits → clear warning on closing / changing view.
8. On service or employee deletion → archive/disable rather than break historical appointments.

## 4. Scheduling/business rules

- **Locations:** each appointment belongs to one salon; employee identities may span locations. An employee cannot be occupied at both sites simultaneously.
- **Shifts:** weekly templates plus date overrides, holidays, breaks and absences. A manager can explicitly override outside-hours scheduling only with permission and an auditable reason; no override of true exclusive conflicts.
- **Treatments:** selectable services with salon-specific price, duration, eligible staff and optional buffers. Appointment service lines retain snapshots of title, duration and price at booking time.
- **Multiple services:** one customer visit can contain ordered service lines, with individual assigned technicians if needed. Initially execute sequentially; model the future possibility of processing time that frees staff but not rooms/tools.
- **Resources:** technicians are exclusive; future equipment/rooms can also be exclusive. Track occupation by allocated intervals, not by one coarse appointment start/end.
- **Statuses:** booked, confirmed, arrived, in progress, completed, cancelled, no-show. Cancelled bookings do not occupy resources; completed/no-show historically occupied the original time unless a deliberate audited correction occurs.
- **Recurrences:** phase 2; series with per-occurrence exceptions and 'this / future / entire series' editing. Reject or enumerate conflicts without partially creating a series.
- **Sources:** internal, walk-in, Salonized-import, Treatwell-import, own-web (future). Never imply an imported Treatwell item is live-synced.
- **TZ:** save instants in UTC; display Europe/Berlin. Use timezone-aware local date calculations, including DST gaps/duplicates. Never blindly add 24 hours to represent the next calendar day.

## 5. Technical architecture

**Recommended default:** Next.js + React + TypeScript + Tailwind + official shadcn/ui components; PostgreSQL; Drizzle or Prisma for routine data access; a deliberate SQL migration for overlap constraints; session-based login/MFA option; Zod validation; transactional API/server actions; SSE or WebSocket for live calendar invalidation; Vitest/Jest and Playwright for tests; Dockerized EU-region deployment with scheduled encrypted backups.

**Calendar library proof-of-concept BEFORE commitment:** Compare DayPilot Lite (Apache 2.0) and React Big Calendar (MIT) with a real 20-technician day view, cross-employee drag-and-drop, touch behavior, accessibility, rapid navigation, event resize, long-day performance and CSS theming. Include license/feature review. FullCalendar Standard is MIT but **resource columns are Premium**; do not select it on the assumption that resource views are free.

```
Browser / iPad (German UI)
   | login + role + salon context
   v
Next.js app: UI + validated API
   |-- customer & services module
   |-- staff roster / absence module
   |-- SCHEDULING ENGINE (single source of truth)
   |-- notification adapter (later)
   |-- import/export adapter
   v
PostgreSQL (transactions, overlap constraints, audit)
   |-- encrypted backups + restore test
   +-- change events -> live calendar refresh
```

No microservices, Kubernetes, vendor-specific proprietary scheduling APIs, online payment, or public customer frontend for v1.

## 6. Initial data model

| Table | Essential fields / purpose |
|---|---|
| `salons` | id, display name, time zone, contact details, hours/settings |
| `staff` | id, name, active, color; independent of account |
| `staff_salon_assignments` | staff_id, salon_id, active range/availability rules |
| `users` | id, hashed credentials / external auth ID, active, MFA config |
| `user_permissions` | user_id, salon_id nullable for global, role |
| `staff_user_links` | optional staff_id, user_id |
| `weekly_shifts` | staff_id, salon_id, day-of-week, start/end local times, effective dates |
| `shift_overrides` | staff_id, salon_id, local date, override type/time/reason |
| `time_blocks` | staff/resource, time range, kind: break/absence/chores |
| `customers` | id, normalized phone/email, name, notes, consent and retention metadata |
| `services` | id, category_id, name, active, base duration |
| `salon_services` | service_id, salon_id, duration/price, active |
| `staff_services` | staff_id, service_id, overrides if allowed |
| `appointments` | id, salon_id, customer_id nullable walk-in, status, source, start/end, version, notes, series_id nullable |
| `appointment_services` | appointment_id, service_id, sequence, staff_id, immutable name/duration/price snapshot |
| `resources` | staff-equivalent exclusive resource ID and optional room/equipment identity |
| `resource_allocations` | appointment/time_block reference, resource_id, tstzrange interval, active constraint flag |
| `appointment_audit` | entity, actor, action, before/after summary, timestamp, reason |
| `import_batches` / `external_id_map` | source, file hash, created records, mapping and reconciliation |
| `notification_outbox` | optional phase 2 queued emails, result and retries |

Indexes: `appointments(salon_id,start_at)`, `appointments(customer_id,start_at)`, `resource_allocations(resource_id,period)`, customer normalized name/phone, unique `(source,external_id)` where defined.

**Overlap enforcement:** PostgreSQL `tstzrange(start_at,end_at,'[)')` with exclusion constraint using `btree_gist`: prevent overlapping **active allocations for the same resource**. Multiple resources for one booking are inserted within **one transaction**. Reject any overlap with a clear application error and roll back the entire action. Serialize conflicting edits/allocations in deterministic order, and validate shift and leave rules in the same transaction. Never rely only on browser drag/drop checks or a preflight availability query. Constraint naming and exact ORM migration are deliverables, not assumptions.

## 7. API surface and validation

- `GET /api/calendar?salonId&from&to&staffIds` — scoped view
- `POST /api/appointments` — create after server-side staff/service/location validation
- `PATCH /api/appointments/:id` — status/details update with `version` check
- `POST /api/appointments/:id/reschedule` — transactional resource reallocation
- `POST /api/appointments/:id/cancel` — reversible business record; release allocations
- `GET/POST /api/customers`, `GET/POST /api/services`, `GET/POST /api/shifts`
- `GET /api/availability` — candidate slots for UI, **not** final validation
- `POST /api/imports/preview` — controlled, redacted source file preview

Check role/permission on every action, do not accept arbitrary trusted salon IDs, rate-limit auth/search/export, log sensitive admin actions, distinguish conflict errors (HTTP 409) from validation (400/422).

## 8. Salonized & Treatwell transition

Salonized's official Data Export area supports lifetime customers, appointments, deleted appointments, absences and treatment reports. Obtain a **sample CSV/XLS** from each salon first. Inspect headers, encoding, time format, identifiers and linked services; do not hardcode mappings before actual inspection.

1. Set up private environment with fictitious customer data.
2. Export and protect actual backups; compare counts and future booking windows.
3. Import in preview/dry-run; normalize phones/dates; identify potential duplicates; reconcile source IDs.
4. Run actual import only after approval; keep batch/reversal logs.
5. Have staff use new calendar with *test/fake appointments* while Salonized remains authoritative.
6. Select an operational cutover; temporarily freeze entry or coordinate manual reconciliation; repeat incremental exports and reconcile all upcoming appointments.
7. Confirm daily availability, staff rosters, appointment counts and contact records; test rollback.
8. Cancel Salonized only after controlled operational acceptance and confirmation of any Treatwell consequences.

**Major risk:** The Salonized–Treatwell integration is documented as live synchronization inside Salonized. A custom app has no verified supported equivalent here. Never promise Treatwell live sync, auto-import or elimination of marketplace commissions. Choose an explicitly documented Treatwell-supported partner workflow, operational manual reconciliation, or gradual migration away from that channel before going live.

## 9. Privacy, access, and reliability

- German GDPR compliance review: lawful bases, privacy notices, contracts with hosting/email processors, retention/deletion, DSAR/export, purpose restrictions; review shared customer access among separate legal entities if applicable.
- EU deployment/backup region, TLS, encrypted backups, least-privilege data access, secure secret handling, CSRF protection as appropriate, audited changes, no PII in unnecessary logs.
- `staff` ≠ `user`, and 'calendar reader' ≠ 'full customer file reader'.
- Nightly backups with retention policy and periodic verified restore; health monitoring and error tracking.
- Secure administrative break-glass recovery procedure and manual fallback plan for temporary internet outage.

## 10. Delivery stages / gates

**Gate 0 — Understand & prototype:** review Salonized screenshots and workflow, choose legal free calendar library after a working technical spike. Approval: convincing interactive mock and tech feasibility evidence.

**Gate 1 — Reliable scheduling core:** auth, salon switch, employee shifts, services, basic customers, calendar, create/move/cancel, database constraints. Approval: working end-to-end booking without overlaps even under concurrency.

**Gate 2 — Production operations:** role permissions, absences, exceptions, import preview and migration, audits, live changes, mobile usability, backups/restore and security. Approval: receptionist can complete real tasks in parallel tests.

**Gate 3 — Controlled go-live:** imported production data, comparison to Salonized, staff pilot, measured performance and rollback. Approval: zero unreconciled future appointments and an explicit Treatwell handling plan.

**Gate 4 — Extensions:** recurrence, phase-based processing time, rooms/equipment, reminders, analytics and own-site booking.

### Acceptance test checklist

- Two receptionists simultaneously book the same employee/time → **exactly one booking succeeds**.
- Move a booking to another technician while that person is occupied → **reject, revert card, show reason**.
- Book a person at two salons at the same instant → **reject**.
- Place a booking during a break/absence or outside roster → **block or require permitted audited override**, as defined.
- Create two services with sequential staff assignments → **correct occupation intervals and total duration**.
- Import the same export twice → **no duplicate records**.
- Cancel appointment → **booking history preserved, active allocation released**.
- DST transition → **correct local display and unambiguous storage**.
- Technician login → **cannot access owner/admin data**.
- Restore backup to test database → **full appointment and customer recovery verified**.
- Responsiveness → **calendar remains usable with 20 employees and realistic appointment volume**.

## 11. Free UI references and asset rules

**Workflow/real-product inspiration:** Salonized Help Calendar; Mangomint Calendar Basics. Never replicate a copyrighted screenshot as a UI asset.

**Free design discovery:** Figma Community (`salon booking dashboard`, `appointment scheduling dashboard`, `resource calendar UI`), Dribbble, Behance; inspect every designer's licensing and availability before reuse.

**Free implementations:** official shadcn/ui Blocks (MIT), DayPilot Lite (Apache 2.0), React Big Calendar (MIT). Contrast FullCalendar: Standard free; vertical resource view is Premium. Do not confuse shadcn's simple *date picker* component with an employee scheduler.

Recommended visual direction: **calm contemporary admin app, neutral backgrounds, pastel appointment categories, staff sticky headers, dense-but-readable calendar, one-click action surfaces**. Functionality over ornamental dashboards.

## 12. Source documentation (checked 31 October 2026)

- Salonized calendar collection: https://help.salonized.com/en/collections/14685-calendar
- Scheduling appointments: https://help.salonized.com/en/articles/572355-schedule-appointments
- Calendar settings: https://help.salonized.com/en/articles/572381-how-do-i-manage-my-calendar-and-appointment-settings
- Services/buffers: https://help.salonized.com/en/articles/572358-how-do-i-manage-categories-and-services-on-salonized
- Multi-location team: https://help.salonized.com/en/articles/4448922-how-can-i-add-and-manage-team-members-in-several-locations
- Treatwell integration: https://help.salonized.com/en/articles/6417703-how-does-the-treatwell-integration-work-in-salonized
- Data exports: https://help.salonized.com/en/articles/573326-how-do-i-export-data-for-my-accounting
- DayPilot Lite: https://www.daypilot.org/open-source/
- React Big Calendar: https://github.com/bigcalendar/react-big-calendar
- FullCalendar license/pricing: https://fullcalendar.io/pricing
- Official shadcn/ui blocks: https://ui.shadcn.com/blocks
- Figma Community: https://www.figma.com/community

---

**Engineering principle:** Bookings, staff availability, time-blocking, permissions and auditability form the product. Everything else is an enhancement.
