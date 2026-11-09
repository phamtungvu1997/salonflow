# 05 — Employees & salon assignment

## Identification

| Field | Value |
|---|---|
| Workflow IDs | EMP-001 list · EMP-002 new (UI only) |
| Entry | Settings → Company → Employees → `/admin/employees` |

## Interaction (**OBSERVED**)

1. Open Employees admin.
2. **New employee** → `/admin/employees/new` (not submitted).
3. **Active employees** list with first-name staff entries and numeric badges (likely service counts / weekly metrics — exact meaning **UNVERIFIED**).
4. Staff names also appear in calendar employee filter, create-appointment employee dropdown, and timetable columns.

## Functional logic

| Topic | Evidence |
|---|---|
| Bookable employees ≠ login users | **DOCUMENTED** S01/S02 · User accounts separate (**OBSERVED**) |
| Employee appears in booking picker | **OBSERVED** |
| Color / calendar column | **DOCUMENTED** S01 · **UNVERIFIED** detail form fields this pass |
| Multi-location assignment | **DOCUMENTED** S06 · **UNVERIFIED** in this single-location exploration |
| Deactivate / remove with future bookings | **PROPOSED** SF-004/SF-006 safer than source |

## Related

- Resources (`/admin/resources`): **New resource**, Active tools — separate from employees (**OBSERVED**).
- User accounts (`/admin/accounts`): roles **Full access** / **Calendar view**; activity log of appointment/customer/absence events (**OBSERVED**).

## Engineering requirements (**PROPOSED**)

- Frontend: Mitarbeiter admin + calendar resource identity.
- Backend: staff, assignments, qualifications, active flag (M04/M06/M11/M14).
- Tests: SF-001 create employee → calendar column; login-only user not bookable (SF-002).
- Priority: **P0**.

## Evidence

- Live `/admin/employees`, `/admin/resources`, `/admin/accounts` 2026-11-08.
- No employee-detail screenshot (avoid committing operational roster dumps).
