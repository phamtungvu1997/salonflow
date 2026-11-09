# 02 — Calendar

## Identification

| Field | Value |
|---|---|
| Workflow IDs | CAL-001 view · CAL-002 filter · CAL-003 open event |
| Module | Calendar |
| Entry | Sidebar Calendar → `/calendar` |
| Role | Staff with calendar access (**OBSERVED** Full access / Calendar view roles exist in User accounts) |

## Interaction (**OBSERVED**)

1. Open calendar (week view default in this session).
2. Toolbar: **Today**, view selector (**Week**), date range (`2 - 8 Nov 2026`), prev/next, **Employees**, **Show all**, search icon, **Create appointment**.
3. Grid: FullCalendar time grid; Monday-first; **15-minute** slots (matches Calendar settings).
4. All-day / header row: **Waiting list N** chips per day.
5. Appointment blocks: time, customer, service; color by category setting.
6. Hatched regions for non-working time; Sunday largely unavailable in this account.
7. Click appointment → popover summary (Walk-in example: service, employee, duration) with Edit / Checkout / More.
8. Detail route `/calendar/appointment/{id}` with actions list (see `03_APPOINTMENTS.md`).

## Functional logic

| Rule | Evidence |
|---|---|
| Slot interval configurable (15 mins set) | **OBSERVED** `/admin/calendar` |
| Appointment color per category | **OBSERVED** setting |
| Hide unscheduled employees option | **OBSERVED** setting text |
| End buffer option | **OBSERVED** setting |
| Waiting list counts on calendar | **OBSERVED** |
| Day view dense staff columns | **DOCUMENTED** / prior `UI_REFERENCE.md` + reference screenshot (PII gitignored) |
| Drag move semantics | **UNVERIFIED** live (forbidden to move) · **DOCUMENTED** S10 |

## Engineering requirements (**PROPOSED**)

- Frontend: dense day grid primary; week secondary; German chrome; no POS checkout on cards for V1.
- Backend: calendar read-model from bookings + absences + hours; UI never authorizes conflicts.
- Real-time: poll/reconnect after M12.
- Tests: 20-staff density (M03); timezone Europe/Berlin (SF-041).
- Milestone: M03/M09/M10.

## Evidence

- Live week calendar 2026-11-08.
- Calendar screenshots **not** saved (customer names on blocks). Layout covered by schematics + `docs/UI_REFERENCE.md`.
