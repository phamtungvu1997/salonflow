# Salonized functionality matrix — verified docs versus proposed scope

The official help center describes functions; screenshots supplied by the owner show actual page structure. A screenshot is NOT proof of the internal implementation of a feature. Verify every behavior by documented workflow and a controlled test in the user's Salonized account when necessary.

| ID | Observable Salonized behavior (official docs) | Our implementation | Release |
|---|---|---|---|
| SZ-01 | Calendar create by time click or Create appointment; customer + one or more services + employee | Quick-book drawer with prefilled staff/time | V1 |
| SZ-02 | Drag or Reschedule to move appointments | Time/staff drag with server validation, rollback | V1 |
| SZ-03 | Calendar intervals 5–30 min, color by staff or service category | Configurable slot increment, two color modes | V1 |
| SZ-04 | Hide unscheduled employees; end buffers | Staff filter and configurable buffer rules | V1/V2 |
| SZ-05 | Staff own manual timetable or follow salon hours | Weekly shifts + overrides + absences | V1 |
| SZ-06 | Employee is tied to multiple locations (Salonized has per-day timetable limitations) | One staff identity and conflict-free assigned shifts; we may allow separately scheduled nonoverlapping shifts across two salons in a day as an intentional enhancement | V1 |
| SZ-07 | Services & category colors and staff qualification | Service categories, salon-specific duration/price, staff-service eligibility | V1 |
| SZ-08 | Dashboard today's schedule, staff today, notes, occupancy | Operational dashboard using booked vs available shift hours | V2 |
| SZ-09 | Customer notes and follow-up dates | Restricted customer notes; dated tasks later | V1/V2 |
| SZ-10 | No-show status exposed in calendar & customer history | Audited no-show status and customer history | V1 |
| SZ-11 | Recurring appointments daily/weekly/monthly, conflict overview | Recurrence series + occurrence overrides | V2 |
| SZ-12 | Waiting list, staff/service preferences and notify/fill gap | Manual waitlist then notifications | V2/V3 |
| SZ-13 | Multi-location data exports, lifetime appointments, customers, deleted appointments, absences | CSV/XLS preview, mapping, idempotent staged import | V1 cutover |
| SZ-14 | Online bookings through widget | Future customer web widget calling same booking API | V3 |
| SZ-15 | Register/POS, invoices, inventory, payments, marketing | Deliberately excluded | Never V1 |

## First three screenshot-derived screens
- Dashboard: navy left sidebar, dense appointment schedule panel, quick actions, who's working, today's customers, utilization. Do not copy promo advertisements or register features.
- Calendar: employee columns, top navigation, time ruler, 15-min horizontal grid, pastel category appointment blocks, diagonally striped absences/unavailable areas, status badges/icons, waiting list row, floating booking action.
- Settings: 2-column settings category navigation; General, Company, Employees, Resources, Timetable, Calendar, Services, Customers. Exclude POS/billing/marketing.

## Direct sources (reviewed 2026-11-04)
- Schedule appointments: https://help.salonized.com/en/articles/572355-schedule-appointments
- Getting started / rescheduling: https://help.salonized.com/en/articles/1337254-how-do-i-get-started-with-salonized
- Calendar settings: https://help.salonized.com/en/articles/572381-how-do-i-manage-my-calendar-and-appointment-settings
- Multi-location team: https://help.salonized.com/en/articles/4448922-how-can-i-add-and-manage-team-members-in-several-locations
- Opening/working hours: https://help.salonized.com/en/articles/589568-how-do-i-manage-my-opening-and-working-hours
- Services: https://help.salonized.com/en/articles/572358-how-do-i-manage-categories-and-services-on-salonized
- Dashboard: https://help.salonized.com/en/articles/1278943-the-dashboard-explained
- No-shows: https://help.salonized.com/en/articles/572960-no-shows
- Recurring: https://help.salonized.com/en/articles/3180989-recurring-appointments
- Waiting list: https://help.salonized.com/en/articles/6596405-how-can-i-use-the-waiting-list-to-manage-my-calendar
- Customer notes: https://help.salonized.com/en/articles/572931-add-notes-to-customers
- Data export: https://help.salonized.com/en/articles/573326-how-do-i-export-data-for-my-accounting

## Unverified / unresolved
- Exact Salonized font, spacing, hidden modal flows: screenshot observation only, not official contracts.
- Treatwell 2-way integration with a private custom app: unverified; must not promise parity.
- Full historical import fields/IDs: unknown without actual export samples.
- Specific user roles/privacy defaults in the user's current Salonized configuration: require account walkthrough.
