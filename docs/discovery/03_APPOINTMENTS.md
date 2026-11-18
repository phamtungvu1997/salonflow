# 03 — Appointments (create, detail, edit)

Deep create pass also lives in [`01_CREATE_APPOINTMENT.md`](01_CREATE_APPOINTMENT.md).

## APT-001 Create appointment

| Field | Value |
|---|---|
| Entry | Calendar/Dashboard **Create appointment** → `/calendar/create-event/appointment` |
| Preconditions | Services + employees exist |

### Interaction (**OBSERVED**)

1. Modal tabs: Appointment | Absence | Chore | Note.
2. Services: SERVICE*, DURATION, EMPLOYEE*, popular chips, + Add another service.
3. Service dropdown: searchable categories + priced options (~105).
4. Selecting service updates duration + price summary.
5. Date/time + Find availabilities + Add another date + Repeat toggle.
6. Note textarea.
7. Customer search / + Add new customer (search not executed — PII).
8. Primary **Create appointment** — **not clicked**.

### Availabilities (**OBSERVED**)

- Nested modal with month picker.
- Closed/unavailable day: “There isn’t any time slot available for this date.”
- Open day: Morning/Afternoon slot lists + **Apply** (not applied).

## APT-002 Appointment detail

| Field | Value |
|---|---|
| Entry | Click calendar event → `/calendar/appointment/{id}` |
| Example | Walk-in block (no personal customer profile attached) |

### Observed actions (**OBSERVED**)

- Customer area: Add customer · “Leave empty for walk-ins” · labels
- ACTIONS: Checkout · Write report · Forms · **Edit** · **Move** · **Copy** · **Mark as no show** · **Delete**
- Services list with duration + employee
- History audit: created / moved timestamps

**Not clicked:** Delete, Mark as no show, Move, Copy, Checkout (mutating / POS).

## APT-003 Edit appointment

| Field | Value |
|---|---|
| Entry | Detail → Edit → `/calendar/create-event/appointment/{id}` |

### Interaction (**OBSERVED**)

- Same sheet pattern as create, prefilled service/employee/date/time/price.
- Controls: Find availabilities, Repeat, Note, Customer rail, **Save**.
- Dismissed with Escape — **no Save**.

## Functional logic

| Topic | Evidence |
|---|---|
| Walk-ins allowed without customer | **OBSERVED** copy |
| Edit reuses create-event UI | **OBSERVED** |
| History retained on move | **OBSERVED** history lines |
| Server conflict on save | **UNVERIFIED** live · **PROPOSED** SalonFlow SF-023/SF-024 |
| Recurring series editor | **UNVERIFIED** (toggle only) · **DOCUMENTED** S11/S12 |
| Checkout is POS | **OBSERVED** — OUT OF SCOPE V1 |

## Engineering requirements (**PROPOSED**)

- Frontend: German create/edit sheet; walk-in allowed; no Register checkout.
- Backend: atomic booking create/update/cancel via scheduling domain + GiST; audit log.
- Entities: Appointment, AppointmentService, Customer?, Employee, Service, TimeRange.
- APIs: existing `/api/appointments` routes in repo to be completed against M08–M10.
- Tests: create visible after reload; edit conflict 409; cancel frees slot.
- Acceptance: FLOW-03 / FLOW-04; SF-018–SF-025.

## Evidence

- Create: `screenshots/appointment-create-schema.svg`
- Detail/edit: live 2026-11-08; no PNG (calendar PII background).
