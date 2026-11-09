# Salonized Application Inventory

| Field | Value |
|---|---|
| Session | 2026-11-08 |
| Account context | Jeannie Nagelstudio (authenticated Salonized) |
| Method | Live browser navigation (**OBSERVED**) + Help Center IDs from `docs/SALONIZED_FUNCTIONAL_GUIDELINE.md` (**DOCUMENTED**) |
| Safety | Read-only. No appointments/customers/employees/services/settings were persisted. No exports run. No unredacted customer screenshots committed. |

Discovery checklist legend: **Documented** · **Partially verified** · **Blocked** · **Not started**

## Primary sidebar modules (**OBSERVED**)

| Section | Path pattern | Visible subsections / entry points | Main controls | Entities | Help refs | SalonFlow priority | Status |
|---|---|---|---|---|---|---|---|
| Dashboard | `/dashboard` | Schedule / Activity; Quick start; Who’s working; Today’s guests; Notes; Waiting-list link; utilisation | Create appointment; Appointment/Sale/Customer quick start; Create note | appointments, staff, customers, notes, waiting list | S25 | P0 agenda later / P1 now | Documented |
| Calendar | `/calendar` | Day/Week views; waiting-list row; create-event; appointment detail | Today; view; date nav; Employees; Show all; Create appointment; event click | appointments, absences, chores, notes, staff, services | S08–S12, S21–S23 | **P0** | Documented |
| Customers | `/customers` | Customer list; Customer groups; Create customer | Search; Create customer; table | customers, groups/labels | S16–S19 | **P0/P1** | Partially verified (no profile deep-dive / no search results saved) |
| Register | `/register` | POS / wallets promo | Sale flows | sales, payments | — | **OUT OF SCOPE** | Inventoried only |
| Products | `/products` | Inventory catalog | product admin | products/stock | — | **OUT OF SCOPE** | Inventoried only |
| Messages | `/messages` | Message log; Email templates; SMS | Filters; template editors | messages, templates, credits | S10 reminders | P2 / later | Documented (chrome) |
| Feedback | `/feedback` | Review list + detail; Google review promo | Reaction / publishing filters | feedback, customers | — | P2 / later | Documented (chrome; content not retained) |
| Reports | `/reports` | Totals; Daily; Monthly; Products; Services; Employees; VAT Overview | Period; Print | sales, VAT, appointments counts | financial reports collection | Mostly **OUT OF SCOPE** (booking utilisation may be P1 later) | Documented |
| Marketing | `/marketing` | Insights; Waiting list; Discounts; Email; Filters; Rebook reminder | Campaign metrics | marketing, waitlist, discounts | S23 | Waitlist **P1**; rest OUT/P2 | Documented |
| Online | `/online` | Online presence / bookings hub | status / widget entry | online bookings | S24 | P2 backend later | Partially verified |
| Settings | `/admin` (hub `/admin/dashboard`) | See settings tree below | secondary nav | config | S27 etc. | Mixed | Documented |
| Support | `/support` | Support Hub | help | — | — | n/a | Inventoried |
| Account | `/account` | Personal account | profile | user | — | P1 auth | Inventoried |

## Settings secondary nav (**OBSERVED** on `/admin`)

### GENERAL
| Section | Path | Priority | Status |
|---|---|---|---|
| General settings | `/admin/general` | P0 locale/TZ | Documented |
| Data export | `/admin/export` | P1 import/export later (M15) | Documented (UI only; export not executed) |
| User accounts | `/admin/accounts` | P0 RBAC | Documented |
| Integrations | `/admin/apps` | OUT / later | Inventoried |
| Billing | `/admin/billing` | OUT | Inventoried |

### COMPANY
| Section | Path | Priority | Status |
|---|---|---|---|
| Company information | `/admin/company` | P1 salon profile | Inventoried |
| Absences | `/admin/absences` | P0/P1 | Documented |
| Employees | `/admin/employees` | **P0** | Documented |
| Resources | `/admin/resources` | P1 later (rooms/tools) | Documented |
| Timetable | `/admin/roster` | **P0** | Documented |

### CALENDAR
| Section | Path | Priority | Status |
|---|---|---|---|
| Calendar settings | `/admin/calendar` | **P0** | Documented |
| Services | `/admin/services` | **P0** | Documented |
| Online bookings | `/admin/online-bookings` | P2 public widget | Documented |

### CUSTOMERS
| Section | Path | Priority | Status |
|---|---|---|---|
| Customer settings | `/admin/customers` | P1 | Inventoried |
| Forms | `/admin/forms` | P2 | Inventoried |

### SALES (mostly OUT OF SCOPE V1)
Invoices and receipts · VAT rates · Loyalty points

### PROMOTE (mostly OUT / later)
Micro-site · Feedback widget · Pricing widget · Gift card widget

## Calendar-adjacent routes (**OBSERVED**)

| Route | Purpose | Priority | Status |
|---|---|---|---|
| `/calendar/create-event/appointment` | Create appointment modal | P0 | Documented (see also `01_CREATE_APPOINTMENT.md`) |
| `/calendar/create-event/appointment/{id}` | Edit appointment | P0 | Documented |
| `/calendar/appointment/{id}` | Appointment detail | P0 | Documented |
| `/calendar/requests` | Appointment requests | P1/P2 | Inventoried |
| `/marketing/waiting-list` | Waiting list management | P1 | Documented |
| `/customers/new` | Create customer | P0/P1 | Inventoried (not submitted) |
| `/admin/employees/new` | New employee | P0 | Inventoried (not submitted) |

## Areas requiring further investigation

1. Day-view staff columns vs week aggregation (week observed live; day heavily covered by existing `docs/UI_REFERENCE.md` + references).
2. Drag-reschedule conflict UX (not exercised — would mutate schedule).
3. Customer profile tabs / history / merge UI (PII-sensitive; limited chrome-only pass).
4. Employee detail editor fields (opened list; detail form not fully mapped).
5. Service edit dialog field-level mapping (categories + actions observed).
6. Recurring appointment editor after Repeat toggle.
7. Message template bodies (not opened to avoid PII).
8. Multi-location assignment UI (this account behaves as single location in explored paths — **UNVERIFIED** second salon).
9. Register/Products full POS trees (intentionally OUT OF SCOPE).

## Related discovery docs

| Doc | Module |
|---|---|
| `01_DASHBOARD.md` | Dashboard |
| `02_CALENDAR.md` | Calendar |
| `03_APPOINTMENTS.md` | Create/edit/detail |
| `01_CREATE_APPOINTMENT.md` | Prior deep create pass |
| `04_CUSTOMERS.md` … `15_DATA_EXPORT.md` | Remaining modules |
| `APPLICATION_DEPENDENCY_GRAPH.md` | Ownership + Mermaid graph + lifecycles |
| `CROSS_MODULE_BEHAVIOR_MATRIX.md` | X## → SF/IT traceability (not parallel SoT) |
| `DEPENDENCY_COVERAGE_REPORT.md` | Coverage, gaps, specialist review log |
| `SALONFLOW_IMPLEMENTATION_MAPPING.md` | Build priorities |
| `DISCOVERY_GAPS.md` | Unverified / blocked |
| `SCREENSHOT_INDEX.md` | Safe evidence |
