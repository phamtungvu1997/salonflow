# Screenshot index

Only sanitized evidence is stored under `docs/discovery/screenshots/`.

| File | Workflow / page | Why safe | Linked docs |
|---|---|---|---|
| `general-settings.png` | SET-002 General settings | Locale/permissions form; no customer rows | `08_SETTINGS.md` |
| `calendar-settings.png` | SET-003 Calendar settings | Configuration form; fictional preview text only | `08_SETTINGS.md`, `02_CALENDAR.md` |
| `online-booking-settings.png` | Online booking admin | Settings accordions; no customer list | `12_ONLINE_BOOKING.md` |
| `data-export.png` | Data export form | Form chrome only; export not run | `15_DATA_EXPORT.md` |
| `appointment-create-schema.svg` | Create appointment layout | Redacted schematic (no live PII) | `03_APPOINTMENTS.md`, `01_CREATE_APPOINTMENT.md` |
| `interaction-motion-tokens.svg` | Motion token board | Durations/easings from CSS + samples; no live UI pixels | `UI_INTERACTION_AND_MOTION_SPEC.md`, `INTERACTION_COVERAGE_MATRIX.md` |
| `customers-directory.schema.svg` | Customer directory | **Reconstruction**, fictional names. Not a photograph of the live list | `04_CUSTOMERS.md` |

## Intentionally not saved

| UI state | Reason |
|---|---|
| Calendar week/day with appointments | Real customer names on blocks |
| Customer list / groups photographs | Names, phones, emails. A fictional reconstruction is `customers-directory.schema.svg` |
| Messages log detail | Customer/contact/message PII |
| Feedback list/detail | Names + review text |
| Appointment detail over calendar | Background PII |
| Waiting list rows | Customer identities |
| Employee detail dumps | Operational roster (optional later with redaction) |
| Day/week calendar hover or drag frames | Customer names on blocks; drag would risk mutation | |
| Create sheet full-bleed screenshots | Calendar underneath shows live PII | |

## Existing reference set (separate)

`docs/references/salonized/` — layout references; PII-bearing files gitignored per folder README. Prefer those for dense calendar/customer layout, not for committing new PII.
