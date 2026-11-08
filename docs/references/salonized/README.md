# Salonized UI reference screenshots

Local visual references for SalonFlow UI/UX. **Original Salonized branding/assets must not be copied into product code** — use these only for workflow/layout parity.

Source (Windows, unchanged originals remain there):  
`C:\Users\vupham\Desktop\Salonized Sample pictures`

Copied into this folder on 2026-11-07. Files were not resized or edited.

## Inventory

| File | Opens | UI reference purpose | PII |
|---|---|---|---|
| `salonized-calendar-day.png` | Yes (3826×2020) | **Day calendar**: employee columns, 15-min grid, appointment cards, waiting-list row, blocked time. *(Source filename was `salonized-dashboard.png`; content is the calendar.)* | **YES — real customer names** |
| `salonized-customer.png` | Yes (3832×2004) | Customers list: search, table columns, create action, sidebar active state | **YES — names, phones, emails** |
| `salonized-messages.png` | Yes (3835×2020) | Messages / message log: tabs, status pills, table density | **YES — names, emails** |
| `salonized-feedback.png` | Yes (3819×2007) | Feedback list + detail pane (V2+; low V1 priority) | **YES — customer names / review text** |
| `salonized-settings.png` | Yes (3831×2008) | Settings hub: secondary nav groups, popular cards, stats widgets | Aggregate stats only |
| `salonized-general-settings.png` | Yes (3831×1909) | General settings form: locale, currency, timezone, week start, time format | No individual customer PII |
| `salonized-settings-data-export.png` | Yes (3825×2028) | Data export form (appointments / month / XLS|CSV) | No individual customer PII |
| `salonized-reports.png` | Yes (3832×2005) | Reports totals (mostly POS/sales — **out of V1 product scope**) | Aggregate only |
| `salonized-marketing.png` | Yes (3829×2020) | Marketing insights (mostly **out of V1**) | Aggregate only |

## PII policy

Images marked **YES** are gitignored via [`.gitignore`](.gitignore) in this folder. They remain on disk for Owner/UI review but **must not be committed or pushed** until redacted versions replace them.

**Owner action requested:** provide redacted versions of:

1. `salonized-calendar-day.png`
2. `salonized-customer.png`
3. `salonized-messages.png`
4. `salonized-feedback.png`

## Missing from this batch (still needed for calendar UX)

- True **Dashboard** home (agenda / who’s working) — not present; `salonized-dashboard.png` was a calendar capture
- Booking / quick-create **dialog or drawer**
- Appointment **detail / edit** modal
- **Week** view
- Employee timetable / absences screens

## Related analysis

Cross-cutting UI notes: [`docs/UI_REFERENCE.md`](../../UI_REFERENCE.md)
