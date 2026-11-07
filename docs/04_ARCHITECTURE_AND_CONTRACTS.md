# Architecture, contracts and data correctness

## Default stack
- Web application: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui.
- Scheduling UI: `CalendarAdapter`; compare DayPilot Lite and React Big Calendar before commit. Library choice must not alter database invariants.
- Backend: modular-monolith application services; typed HTTP boundary and Zod schemas.
- DB: PostgreSQL; Drizzle or Prisma once selected; raw versioned SQL for exclusion constraints if ORM does not fully support them.
- Auth: battle-tested session auth, MFA for owner/manager, server-side per-salon RBAC.
- Testing: Vitest/unit, PostgreSQL integration/concurrency, Playwright E2E, axe accessibility; CI on PR.
- Hosting: EU, non-root deployment, TLS, encrypted offsite backups, monitoring; no external SMS until approved.

## Bounded modules and ownership
- `auth-access`: users, sessions, permissions, scopes.
- `salons`: salon details, opening hours, configuration.
- `staff`: staff identities, shift patterns, qualifications, absences.
- `catalog`: service categories, salon pricing, durations, staff-service permissions.
- `customers`: identities, contact methods, notes, preferences and data export/deletion.
- `booking`: appointments, ordered service items, allocations, statuses, auditing. **Only this module writes booking allocations.**
- `calendar-read`: read models and rendering adapter, no mutation authority.
- `imports`: dry-run, mappings, external IDs, reconciliation, audit.
- `notifications`: later; transactional outbox design reserved.
- `dashboard`: read-only business metrics, derived from canonical tables.

## Basic entities
`salons(id,name,tz,active)`; `staff(id,name,active)`; `users(id,auth_id,status)`; `user_salon_roles(user_id,salon_id,role)`; `staff_user_links`;
`staff_salon_assignments(staff_id,salon_id,effective_range)`; `weekly_shifts`, `shift_overrides`, `time_blocks`;
`customers`, `customer_notes`; `service_categories`, `services`, `salon_services`, `staff_services`;
`appointments(id,salon_id,customer_id,start_at,end_at,status,source,version)`;
`appointment_services(appointment_id,sequence,staff_id,title_snapshot,duration_snapshot,price_snapshot)`;
`resources(id,resource_type,staff_id,location_id nullable)`;
`resource_allocations(resource_id,period,active,appointment_id nullable,time_block_id nullable)`;
`appointment_audit`; `import_batches`, `external_ids`.

## The invariant that cannot be bypassed
All active allocations on the same exclusive resource must not overlap. PostgreSQL provides GiST exclusion constraints over `tstzrange(start_utc,end_utc,'[)')` + resource identity, with `btree_gist` for equality. Allocate all service-staff and future equipment intervals atomically in one transaction. Assigning shifts alone is not a guarantee against overlaps; check availability/business rules transactionally. Ensure locking/version strategy covers concurrent shift/absence edits as well as booking edits.

## Booking API behavior
- GET `/api/calendar?salonId&from&to&staffIds`: read only permitted salons/fields.
- GET `/api/availability?...`: a preview, never final authorization.
- POST `/api/appointments`: authorize salon, validate service/staff/location, calculate allocations server-side, commit transaction + audit, return ID/version.
- PATCH `/api/appointments/:id`: require version; reject stale edits with HTTP 409.
- POST `/api/appointments/:id/reschedule`: atomic reallocate; if collision reject with 409 and no partial changes.
- POST `/api/appointments/:id/cancel`: audited status transition; release active allocations; preserve record.
- GET/POST `/api/customers`, `/api/services`, `/api/shifts` with scoped access and validation.
- POST `/api/imports/preview`: admin only, size limits, safe parsing, no permanent write in dry-run.

## Domain event flow
UI action → API authorization + Zod → booking application service → transaction (business rules + allocations + appointment snapshots + audit) → commit → change event/outbox → other calendars invalidate/refetch. Failure → rollback and contextual error; no UI-specific business logic.

## Status policy
Booked, Confirmed, Arrived, In Progress, Completed, Cancelled, No-show. Historical no-show and completed remain in record; cancellation releases future allocation while retaining history. Define any exceptions to past-event allocation preservation in explicit ADR.

## Concurrency testing
Use two truly concurrent transaction requests to same resource/period: exactly one succeeds and the other gets 409. Repeat across two salons sharing staff. Move/reschedule to occupied time: no partial database mutation. Service pair: correct distinct allocated intervals. Confirm an absence cannot be added silently over booked intervals without an explicit conflict workflow.

## Independent extensibility
Public self-booking will call the same domain service after separate customer authentication/anti-abuse safeguards; no second scheduling ruleset. Calendar provider replaceable. Add notification adapters and waitlist later without changes to allocation invariant.
