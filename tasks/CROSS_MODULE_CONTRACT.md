# Cross-module contract (SF-001–SF-048)

**Authority:** [`docs/MASTER_ARCHITECTURE.md`](../docs/MASTER_ARCHITECTURE.md) governs structure.  
**Behavior:** [`docs/SALONIZED_FUNCTIONAL_GUIDELINE.md`](../docs/SALONIZED_FUNCTIONAL_GUIDELINE.md).  
Only the **booking** module writes exclusive `resource_allocations`. Other modules publish facts; calendars and dashboards are read models.

Schema already started in M04 (`src/db`). Still missing before NS-017 can pass: `weekly_shifts`, `shift_overrides`, `absences`, `time_blocks`, `appointment_audit`, `idempotency_keys`, `outbox`. Table `staff_services` is the eligibility store (guideline name `staff_service_eligibility`).

## When data changes, what else must change

| Command | Writes | Must also update | Must not |
|---|---|---|---|
| Create staff (SF-001, SF-005) | `staff`, assignments, staff resource row | Staff list, calendar columns, booking staff picker, timetable row | Create a login or fake appointments |
| Create login only (SF-002) | `users`, `user_salon_roles` | Auth sessions | Insert a calendar column |
| Rename/recolor staff (SF-003) | `staff` display fields | Headers and future card chrome | Rewrite historical appointment snapshots |
| Deactivate staff or remove salon (SF-004, SF-006, SF-042, SF-046) | `active=false` or end assignment | Block new bookings; list future appointments for a manager | Delete history or auto-cancel |
| Change hours, break, absence (SF-007–SF-012, SF-041) | shifts, overrides, absences, time blocks | Availability shading; conflict list for future bookings | Silently move existing appointments |
| Cross-salon staff (SF-013) | one `staff` id, many assignments, **one** staff resource | Both salon calendars show the same occupancy | Two overlapping active allocations |
| Create service / eligibility (SF-015, SF-017) | catalog + `staff_services` | Booking search for qualified staff only | Change past snapshots |
| Edit service price/duration (SF-016) | catalog rows | New bookings only | Mutate `appointment_services` snapshots |
| Create booking (SF-018–SF-023, SF-047) | appointment, ordered items, allocations, audit, idempotency | Calendar cell, customer history, dashboard counts, outbox | Partial rows on 409 |
| Move / version clash (SF-024, SF-048) | new allocations + `version++` | Live views for permitted salons | Keep optimistic UI after 409 |
| Cancel / no-show (SF-025–SF-027) | status + audit; cancel releases active allocations | Slot becomes free; history remains | Treat price snapshots as collected revenue |
| Customer create inside booking (SF-020) | customer then appointment in **one** transaction | Customer search and appointment link | Orphan customer if booking rolls back — same transaction |
| Import rerun (SF-040) | `external_id_map`, batches | Preview counts | Duplicate appointments |
| Permission change (SF-044) | roles | API, exports, SSE filters | Cached cross-salon reads |

Later, same booking command, not a second engine: chores as work-time blocks (SF-028), non-blocking notes (SF-029), recurrence (SF-032–SF-033), rooms/tools (SF-034), merge (SF-036), waitlist conversion (SF-037), email outbox (SF-043).

## Owners

| Milestone | Ticket | Owner | QA proves |
|---|---|---|---|
| M04 remainder + M06 + M07 + M08 | **NS-017** (next) | backend-engineer | qa-engineer: IT-01–IT-08 below |
| M05 | NS-005 auth half | backend-engineer + security-reviewer | SF-002, SF-044, IT-15 role half |
| M03 | NS-003 | frontend-engineer + ui-ux-designer | adapter only; no save |
| M09 | NS-008 | frontend-engineer + backend-engineer | IT-09, IT-10 Playwright |
| M10 | NS-009 | frontend + backend | IT-11, IT-12 |
| M11 | part of NS-009 | backend-engineer | IT-03 |
| M12 | NS-014 | backend + frontend | SF-038 two browsers |
| M13 | NS-010 | backend + frontend | SF-019, SF-020, SF-035 |
| M14 | new NS-018 after NS-017 | frontend + backend | SF-001, SF-007 UI |
| M15 | NS-011 | backend + security + qa | IT-14 |
| M16 | NS-012 | devops + security | IT-15 restore |
| P1 | NS-013 / NS-016 | ui-ux + frontend + product-analyst | SF-028, SF-032, SF-037, SF-045 not in first slice |

## Acceptance tests (implement in NS-017 unless marked UI)

Run against PostgreSQL. Skip the file when `DATABASE_URL` is absent; CI job for NS-017 must set it. Synthetic data only.

| ID | Given / When / Then | Rules |
|---|---|---|
| IT-01 | Staff saved with salon A assignment and no user row. Then calendar-read for A includes the column; B does not; `users` unchanged. | SF-001, SF-005 |
| IT-02 | User row without `staff_user_links`. Then no bookable resource exists for that user. | SF-002 |
| IT-03 | Staff booked 10:00–11:00 in salon A. Concurrent booking 10:30–11:30 in salon B for the same staff resource. Then one commit and one 409; one active allocation. | SF-013, SF-023 |
| IT-04 | Shift 10:00–12:00 and 13:00–18:00. Booking at 12:30. Then rejection and zero allocations. | SF-010 |
| IT-05 | Service duration changes from 45 to 60 after an appointment snapshot of 45. Then the row still stores 45; a new booking stores 60. | SF-016, SF-021 |
| IT-06 | Two parallel creates, same staff/time, same idempotency key retried twice and a second key once. Then one appointment; retry returns the same id; the other request is 409. | SF-022, SF-047 |
| IT-07 | Cancel active appointment. Then allocation `active=false` (or removed from exclusion), appointment row and audit remain, a new booking in that interval can commit. | SF-025 |
| IT-08 | Two updates with the same `expectedVersion`. Then one succeeds and increments version; the other 409 with no allocation change. | SF-048 |
| IT-09 | UI: empty slot → customer → service → save → reload. Then card is in that column. | SF-018 (M09) |
| IT-10 | UI: create customer inside the booking form. Then profile exists and is linked. | SF-020 (M09/M13) |
| IT-11 | UI drag onto an occupied slot. Then card returns to the original time and the database version is unchanged. | SF-024 (M10) |
| IT-12 | Absence overlapping a future appointment. Then the appointment remains and a conflict list is returned. | SF-011, SF-046 (M06+M10) |
| IT-13 | Slot setting changes 15→5. Then `start_at`/`end_at` are unchanged. | SF-030 (M02/M09) |
| IT-14 | Same import file twice. Then external ids match and appointment count is stable. | SF-040 (M15) |
| IT-15 | Receptionist token for salon A reads salon B customer. Then 403 and empty body. Restore drill returns the IT-06 appointment. | SF-044 (M05), SF restore (M16) |
| IT-16 | Local Berlin time 2026-03-29 02:30 and 2026-10-25 02:30. Then spring slot is rejected; autumn slot stores an explicit offset. | SF-041 (M07, existing T-011/T-012) |

NS-017 exit: IT-01 through IT-08 green on PostgreSQL **and CI `npm ci`/pipeline green**. No claim that the receptionist calendar is done.

**2026-11-08 status:** PR #1 implements the Engine + harness UI and claims IT-01–IT-08 locally; GitHub Actions currently fails on lockfile/`npm ci`. Treat NS-017 as **not exit-complete** until CI passes. Discovery X-matrix is traceability only — do not invent parallel SF IDs. No-show must retain occupancy (Architecture Flow C). Hours/absence changes follow Flow D commit gates.
