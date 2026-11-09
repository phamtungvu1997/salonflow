# 08 — Settings (general, calendar, permissions)

## SET-001 Settings hub

| Entry | `/admin` → `/admin/dashboard` |
|---|---|
| **OBSERVED** groups | GENERAL · COMPANY · CALENDAR · CUSTOMERS · SALES · PROMOTE |
| Popular cards | Services, Timetable, Online bookings |
| Stats widgets | Total customers / sales / appointments / SMS credits |

## SET-002 General settings (**OBSERVED**)

Path: `/admin/general`

| Field | Observed value |
|---|---|
| Language | English (session) |
| Currency | Euro (€) |
| Time zone | (GMT+01:00) Berlin |
| Week start | Monday (Sunday option available) |
| Time format | 24h `13:15` (12h option available) |
| Treatwell Expert access | checkbox |
| IP restriction | optional textarea |
| Delete account | destructive link (not clicked) |
| Save | present — **not clicked** |

Screenshot: `screenshots/general-settings.png`  
Help: **DOCUMENTED** S27

## SET-003 Calendar settings (**OBSERVED**)

Path: `/admin/calendar`

| Setting | Observed |
|---|---|
| Slot interval | 15 mins |
| Appointment color | Per category |
| Hide unscheduled employees | checkbox |
| End buffer | checkbox + learn more |
| Share calendar externally | section |
| Online cancel allowed | on · lead time 1 hr |
| Online reschedule allowed | on · lead time 1 hr |
| No-show email prompt | checkbox |
| Email reminder | on · 12 hrs before |
| SMS reminder | option (credits) |
| Save | **not clicked** |

Screenshot: `screenshots/calendar-settings.png`  
Help: **DOCUMENTED** S08

## SET-004 User accounts & permissions (**OBSERVED**)

Path: `/admin/accounts`

- **Add user account**
- Roles seen: **Full access**, **Calendar view**
- **Activity logs** with filters; activity types include Appointment created/updated, Customer created, Absence updated, User updated
- Help: **DOCUMENTED** S02

## Engineering requirements (**PROPOSED**)

- SalonFlow V1 settings: locale hard-defaults de-DE / Berlin / Monday / 24h / EUR (AGENTS.md) even if Salonized UI language differs.
- RBAC salon-scoped (M05); activity/audit (M08/M16).
- Do not implement Treatwell access, billing, SMS credits, or Delete-account clones.

## Evidence

- Live settings pages 2026-11-08; no Save.
