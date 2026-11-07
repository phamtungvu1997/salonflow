# Product charter — Private Salon Calendar

## Business intent
Replace internal Salonized calendar dependency for three internal salon locations and 15–20 staff. Retain treatment scheduling, team rosters, basic customers, shared multi-location scheduling and rapid receptionist workflows. Reduce software fees while retaining reliable operations. Treatwell distribution and live integration are a separate unresolved dependency.

## Personas and authorization
- **Owner:** all locations, all data, settings, audits and releases.
- **Manager:** assigned salons; rosters, services, appointments and allowed customer details.
- **Receptionist:** approved salon calendar, booking actions, customer lookup/create, notes according to policy.
- **Technician:** own assigned schedule and minimal necessary customer/service data; permissions configurable.
- Staff records can exist with no login. Some user accounts may not be technicians.

## Principal user journeys
- UJ-01 Quick booking: choose empty time in a technician column -> identify customer or walk-in -> choose service(s) -> see duration and price -> save -> all staff see booking.
- UJ-02 Move booking: drag -> preview new time/staff -> server validates -> commit or revert with reason.
- UJ-03 Cancel/no-show: change status, record reason and actor, update resource occupation without deleting history.
- UJ-04 Admin roster: configure salon hours, employee hours, breaks/absences -> availability updates.
- UJ-05 Customer view: search by name/normalized phone -> history and note permissions -> rebook.
- UJ-06 Salon switch: view only assigned locations; employee cannot be double-booked at different salons.
- UJ-07 Owner review: appointments today, working staff, waiting list (later), utilization.

## Fixed defaults (owner may amend)
- UI: German, date DD.MM.YYYY, 24-hour clock, EUR; Europe/Berlin per salon initially.
- Main desktop calendar starts at salon opening-hour vicinity; slot interval 15 min (user-selectable 5–30); one sticky technician column per worker; horizontal virtualization/scroll for 20 staff.
- No billing, sales, cash register, VAT, payroll, inventory or payments, including online payments.
- Customer online self-booking is **future optional scope**, not internal-only V1.
- Schedule first with synthetic data. Never interrupt Salonized or Treatwell before signed-off migration.

## MVP success metrics (targets, not measured results)
- Familiar, readable daily calendar for >= 20 technician columns.
- Typical existing-customer single-service booking achievable in <= 15 seconds during usability testing, after a warm start.
- Zero committed conflicting active exclusive allocations in concurrency tests.
- Cancel/reschedule changes are audited, permissions tested, restore performed and end-to-end workflows pass.
- No unreconciled future bookings at cutover; explicit Treatwell handling plan.

## Non-goals
- Salonized brand recreation, duplicate proprietary assets/source, public SaaS, unsupported scraping/integration, accounting, payment terminals.
