# MASTER AI CODING PROMPT — PRIVATE NAIL SALON BOOKING CALENDAR

You are my **principal product engineer, senior full-stack architect, designer and QA lead**. Build a **production-grade, internal-only, multi-location nail salon booking calendar**, inspired by Salonized's efficiency but with original UI, independently owned code, and no online payment system. Read the attached `nail_salon_booking_blueprint.md` as the governing specification; if unavailable, ask me to provide it before writing code. Your goal is reliable production software, not a toy demo or disconnected mockup.

## Business context

My company operates Jeannie Nagelstudio and Juliet – Salon de Beauté in Hamburg and is developing a third salon in Heide. We currently use Salonized and Treatwell, have approximately 15–20 employees across locations, and want to reduce recurring fees and become less dependent on these platforms.

The **initial app is staff-only**: owner, manager, receptionist and technician. A public pay-at-salon booking widget may be added later. No online payments, Stripe, PayPal, POS, invoices, inventory, payroll or marketing suite in the initial scope. Never assume Treatwell supports a public API or two-way sync with our custom application.

## Required research and references

Read the following official Salonized documentation and extract observable workflows, assumptions and edge cases. Do not copy branded assets or proprietary code:

- https://help.salonized.com/en/collections/14685-calendar
- https://help.salonized.com/en/articles/572355-schedule-appointments
- https://help.salonized.com/en/articles/572381-how-do-i-manage-my-calendar-and-appointment-settings
- https://help.salonized.com/en/articles/572358-how-do-i-manage-categories-and-services-on-salonized
- https://help.salonized.com/en/articles/4448922-how-can-i-add-and-manage-team-members-in-several-locations
- https://help.salonized.com/en/articles/6417703-how-does-the-treatwell-integration-work-in-salonized
- https://help.salonized.com/en/articles/573326-how-do-i-export-data-for-my-accounting

If any page cannot be accessed, identify the gap explicitly and do not invent undocumented functionality.

## Hard product requirements

1. **Calendar-first UX:** day view with technician columns, vertical time axis, sticky headers, now line, service-color cards, status indicators, break/absence shading, search/filter, salon switch, date navigation; week view for one technician; responsive tablet and mobile design.
2. **Very fast booking:** clicking an empty slot preselects time and technician; search/create customer or record a walk-in; choose one/multiple treatments; compute durations; save. Aim for a routine booking flow under 15 seconds.
3. **Full editing:** create, edit, cancel, status change, drag to reschedule to another time/staff, resize with explicit duration confirmation, undo/revert visually after rejected moves.
4. **Authoritative availability:** salon hours; staff weekly rosters and date overrides; breaks, holidays and absences; service eligibility; exclusivity across all salons; service buffers; equipment/room resource extension. Employee cannot have conflicting appointments even across two locations.
5. **Customers:** basic contacts, normalized phone search, visit history, notes with permissions, duplicate detection. A `staff` row must not require a login account.
6. **Services:** categories, salon-specific price and duration, technician eligibility, multi-service appointments with immutable snapshots of service data.
7. **Multi-location:** initial 3 salons, shared identity for one technician working in more than one location, salon-specific data access, a single owner overview.
8. **Roles:** owner, manager, receptionist, technician. Each endpoint must enforce authorization; never rely on hidden navigation for security.
9. **Audit, privacy, operations:** secure sessions, GDPR-conscious data model, EU-region hosting/backup, change history, idempotent importer, monitoring, backup restores and manual downtime process.
10. **No fictitious integrations:** Salonized historical data import comes from authorized exports. Treatwell integration must be treated as unverified until a supported method is established.

## Recommended stack and evaluation gate

Prefer **Next.js + React + TypeScript + Tailwind + official shadcn/ui**, PostgreSQL, Prisma or Drizzle, robust session authentication, Zod, tests with Vitest/Jest plus Playwright, Docker deployment in the EU, and SSE/WebSocket invalidation for multi-user calendar updates.

Before selecting the scheduling UI component, prototype the same 20-technician day-view interaction with **DayPilot Lite (Apache 2.0)** and **React Big Calendar (MIT)**. Verify feature availability, licensing, appointment drag/resize across columns, touch, localization, responsiveness, accessibility, and styling. Explain which implementation you choose and why. Avoid FullCalendar Premium unless explicitly approved: its resource views are paid. Do not confuse a basic date picker with a resource scheduler.

## Required technical integrity

Model appointments separately from staff/resource **occupation intervals**. Validate every booking and reallocation on the server. Enforce a PostgreSQL `tstzrange`-based exclusion constraint for active, exclusive allocations to a given resource, with transactionally consistent insertion of every resource occupied by a booking. The browser is never the source of truth for conflicts. Use optimistic concurrency `version` or equivalent for competing edits; the loser must receive a useful HTTP 409 error and an updated calendar. Preserve history after cancellation. Do not use local naive date arithmetic: persist UTC instants and correctly handle Europe/Berlin local calendar days and daylight-saving transitions.

Data model must cover salons, employees, user accounts, user-salon roles, staff-location mapping, rosters, overrides, absences, customers, service categories/services, salon prices/durations, qualified staff, appointments, appointment service snapshots, resource allocations, audit, import batches and external ID mappings. Phase 2 can extend to booking series, phase-based processing time, shared equipment and email notifications.

## UX details to implement

- Left sidebar: Calendar, Customers, Team, Services, Settings.
- Top calendar bar: salon switch, date controls, Today, Day/Week, employee filter, search, + Appointment and + Block Time.
- Calendar: neutral background; 5–7 low-saturation category colors; 15-minute grid default (configurable 5–30); sticky employee headers; grey out nonworking hours and absences; high legibility at narrow widths.
- Appointment form: chosen slot, searchable customer field, service list, total duration, qualified technician, notes, Save; errors inline without losing draft.
- Appointment details drawer: status, notes, source, reschedule, cancel and history.
- German initial UI, Europe/Berlin, 24-hour time, DD.MM.YYYY, EUR. Structure localization for later English/Vietnamese.
- Avoid huge generic admin dashboards, pointless charts, paid calendar components and redundant clicks.

## Mandatory acceptance tests

- Two simultaneous API booking requests for the exact same staff and time result in **one success only**; no overlap in database.
- Staff already booked in Hamburg cannot be simultaneously booked in Heide.
- Dragging a booking into a conflicting slot triggers a rollback and clear error message.
- An appointment with multiple services allocates the right intervals and displays the correct total duration.
- Staff absent, on break or unqualified for a treatment cannot be automatically booked.
- Cancelled appointment retains audit history and releases active allocations.
- Two clients editing the same record cannot silently overwrite one another.
- German DST nonexistent/ambiguous times do not create incorrect UTC allocations.
- Technician account cannot read protected admin settings or arbitrary customer histories.
- Repeat import of same Salonized file is idempotent and does not duplicate records.
- Backup recovery is demonstrated in a test environment.
- Day view is usable with 20 employees and realistic appointment volume on desktop and tablet.

## Development sequence — do not skip gates

**Phase A — Blueprint and decisions (START HERE; NO CODE YET):** Deliver a concise PRD, feature prioritization, workflow diagrams, booking lifecycle/state transitions, visual wireframe, screen map, evaluation of calendar libraries/licensing, ERD/database design, resource-conflict algorithm, API contract, security plan, import-and-cutover plan and test matrix. Explicitly list critical open business choices; use sensible defaults for non-critical uncertainty. Explain costs and operational maintenance without pretending to know our current bills.

**Phase B — Design spike:** Implement the calendar library proof-of-concept with realistic **synthetic** appointments for 20 technicians, different shift hours and multiple salons. Show exactly what works and any limitations before settling on the library.

**Phase C — Vertical slice:** Deploy local dev stack, migrations and auth; implement a usable end-to-end Create Appointment flow: salon and technician selection → customer/service → server-side conflict-safe save → persistent calendar display. Add the concurrency test before extending features.

**Phase D — Complete MVP:** Drag/drop, reschedule, cancellation, roles, week view, rosters, absence blocks, multi-location employee collision rules, customer search, keyboard/touch adjustments, live refresh and audit.

**Phase E — Production readiness:** Salonized data export preview, validated import, authorization tests, edge cases, error tracking, backups and restore tests, staff training guide, controlled pilot, Treatwell transition strategy, cutover checklist and rollback procedure.

**Phase F — Optional roadmap:** recurrence, complex processing/buffers, rooms/equipment, email reminders, customer history analytics, pay-at-salon customer booking widget.

## Coding and communication contract

- Never pretend a mock interface is backed by real data or claim tests passed if they did not run.
- Build actual, deployable features incrementally with small files, reusable modules, typed contracts and documented environment variables.
- Maintain database migrations, seed data, API schemas, tests, and a short README.
- Do not store personal customer data in Git, public logs, screenshots or development seed fixtures.
- After each implementation stage, show changed files, exact run commands, real test results, known limitations and the next recommended task.
- Favor operational reliability over visual complexity. If a library lacks a critical feature, state it and adjust before building around it.

## RESPONSE TO THIS PROMPT

**Do not write code in your first response.** First produce the Product & Technical Blueprint (Phase A), a convincing wireframe/screen spec for the main calendar and a decision matrix for DayPilot Lite versus React Big Calendar. Explain precisely how staff, salons, shifts and appointment allocations are represented and how overlap constraints work. Then present the first smallest coding task and acceptance tests. Wait for my instruction to start implementation.
