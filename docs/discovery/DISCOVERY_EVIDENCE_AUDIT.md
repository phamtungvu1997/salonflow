# Discovery evidence audit

| Field | Value |
|---|---|
| Date | 2026-11-08 |
| Auditor | Independent review of files already on disk |
| Method | File inventory, Git status, and visual inspection of every Salonized raster and schematic in the repo |
| Not done | No live Salonized session, no redesign, no backend change, no commit of screenshots |

Counts below are from files and table rows. The older “approx.” counts inside `INTERACTION_COVERAGE_MATRIX.md` are not used.

## 1. Totals

| Item | Count | Counting rule |
|---|---:|---|
| Salonized raster screenshots | **13** | 9 files in `docs/references/salonized/` + 4 PNG files in `docs/discovery/screenshots/` |
| Redacted raster screenshots | **0** | No blurred or name-removed photograph of the calendar, customers, messages, or feedback exists |
| Redacted schematics (SVG, not photographs) | **3** | Two copies of the create-appointment wireframe plus one motion-token board |
| Screenshots with personal customer data | **4** | Visually confirmed. Gitignored. Names, phones, emails, and review text are not copied here |
| Screenshots with aggregate business figures only | **3** | Settings hub, reports, marketing insights |
| Screenshots with settings chrome and no customer rows | **6** | General settings (2 copies), calendar settings, data export (2 copies), online-booking accordions |
| Browser recordings (webm, mp4, har) in the repo or this project’s Cursor folder | **0** | Desktop search also found no Salonized recording. An unrelated website video elsewhere on the Desktop was ignored |
| Workflow markdown files | **16** | `01_DASHBOARD.md` through `15_DATA_EXPORT.md`, plus `01_CREATE_APPOINTMENT.md` |
| Explicit workflow IDs | **21** | Listed in section 3 |
| Module narratives with no workflow ID | **6** | Messages, reports, waiting list, online booking, feedback, marketing |
| Distinct documented workflows | **27** | 21 IDs + 6 untitled narratives. `01_CREATE_APPOINTMENT.md` restates APT-001 and is not counted twice |
| Interaction rows in the motion matrix | **21** | IX-* rows |
| Interactions marked OBSERVED from a live browser pass | **9** | No screenshot sequence and no recording supports any of the 9 |
| Interaction rows that are partial, CSS-only, or unverified | **12** | 2 partial + 5 CSS-only + 5 unverified |
| Cross-module dependency records | **40** | X01–X40 in `CROSS_MODULE_BEHAVIOR_MATRIX.md` |
| Dependency records whose evidence cell contains “OBSERVED” | **27** | UI signal only. Not proof the full business rule was executed |
| Dependency records with no OBSERVED label | **13** | X15, X19, X20, X21, X22, X27, X28, X33, X34, X35, X36, X39, X40 |
| Explicit unverified dependency IDs | **15** | U1–U15 in `DEPENDENCY_COVERAGE_REPORT.md` |

Cursor agent transcripts for this project exist. They were not treated as visual evidence. They do not contain the screenshot files.

Originals of the reference batch also sit in `C:\Users\vupham\Desktop\Salonized Sample pictures` (9 files). `salonized-dashboard.png` there is the same byte size as `salonized-calendar-day.png` (1,111,200). The README already says that source file is a calendar, not a dashboard.

## 2. Screenshot inventory

Visually inspected means this audit opened the file. Sensitive means personal customer data is visible. None of that data is repeated here.

| File | Path | Module | What is shown | Inspected | Sensitive | Related doc | Git |
|---|---|---|---|---|---|---|---|
| `salonized-calendar-day.png` | `docs/references/salonized/` | Calendar | Populated grid, employee columns, appointment cards, waiting-list chips, one date in the toolbar. README calls it day view | Yes | **Yes — customer names on cards** | `02_CALENDAR.md`, `docs/UI_REFERENCE.md` | **Ignored** by `docs/references/salonized/.gitignore` |
| `salonized-customer.png` | same | Customers | Customer list, search, create button, table columns | Yes | **Yes — names, phones, emails** | `04_CUSTOMERS.md` | **Ignored** |
| `salonized-messages.png` | same | Messages | Message log tabs and status pills | Yes | **Yes — names, emails, message text** | `09_MESSAGES.md` | **Ignored** |
| `salonized-feedback.png` | same | Feedback | List plus detail pane | Yes | **Yes — names and review text** | `13_FEEDBACK.md` | **Ignored** |
| `salonized-settings.png` | same | Settings hub | Secondary nav, popular cards, aggregate counters | Yes | No customer rows. Aggregate counts only | `08_SETTINGS.md` | Untracked |
| `salonized-general-settings.png` | same | General settings | Language, currency, Berlin, week start, time format. Browser chrome included | Yes | No | `08_SETTINGS.md` | Untracked |
| `salonized-settings-data-export.png` | same | Data export | Monthly export form. Browser chrome included | Yes | No | `15_DATA_EXPORT.md` | Untracked |
| `salonized-reports.png` | same | Reports | Totals tab, period, print, payment and VAT blocks | Yes | No customer rows. Aggregate figures | `10_REPORTS.md` | Untracked |
| `salonized-marketing.png` | same | Marketing | Insights tab and KPI cards. Other marketing tabs not open | Yes | No customer rows. Aggregate figures | `14_MARKETING.md` | Untracked |
| `general-settings.png` | `docs/discovery/screenshots/` | General settings | Same form as the reference, without browser chrome | Yes | No | `08_SETTINGS.md`, `SCREENSHOT_INDEX.md` | Untracked |
| `calendar-settings.png` | same | Calendar settings | 15-minute slot interval, colour by category, preview card, online cancel/reschedule, no-show option | Yes | No personal customer row. Preview uses a sample walk-in label | `08_SETTINGS.md`, `02_CALENDAR.md` | Untracked |
| `online-booking-settings.png` | same | Online booking | Five collapsed accordions and a save bar | Yes | No | `12_ONLINE_BOOKING.md` | Untracked |
| `data-export.png` | same | Data export | Same form as the reference, without browser chrome | Yes | No | `15_DATA_EXPORT.md` | Untracked |
| `appointment-create-schema.svg` | same | Create appointment | Drawn wireframe, not a photograph | Yes | No | `03_APPOINTMENTS.md`, `01_CREATE_APPOINTMENT.md` | Untracked |
| `assets/01_create_appointment_form.schema.svg` | `docs/discovery/assets/` | Create appointment | Second copy of the same wireframe (4,501 bytes, same as the file above) | Yes | No | `01_CREATE_APPOINTMENT.md` | Untracked |
| `interaction-motion-tokens.svg` | `docs/discovery/screenshots/` | Motion | CSS duration cards. Not a screen recording | Yes | No | `UI_INTERACTION_AND_MOTION_SPEC.md` | Untracked |

`SCREENSHOT_INDEX.md` says calendar, customer, message, feedback, appointment-detail, and waiting-list captures were intentionally not saved because they contain personal data. That statement matches the files: those states are either gitignored photographs or missing entirely.

These SalonFlow images were found and are **not** Salonized discovery evidence: `docs/branding/screenshots/` (4) and `docs/evidence/m01/` (3). Logo files under `public/branding/` are brand assets, not discovery.

## 3. Workflow IDs found in documents

| IDs | File |
|---|---|
| DASH-001 | `01_DASHBOARD.md` |
| CAL-001, CAL-002, CAL-003 | `02_CALENDAR.md` |
| APT-001, APT-002, APT-003 | `03_APPOINTMENTS.md` |
| CUS-001, CUS-002, CUS-003 | `04_CUSTOMERS.md` |
| EMP-001, EMP-002 | `05_EMPLOYEES.md` |
| TIM-001, TIM-002 | `06_TIMETABLE.md` |
| SVC-001, SVC-002 | `07_SERVICES.md` |
| SET-001, SET-002, SET-003, SET-004 | `08_SETTINGS.md` |
| EXP-001 | `15_DATA_EXPORT.md` |

Narratives with no ID: `09_MESSAGES.md`, `10_REPORTS.md`, `11_WAITING_LIST.md`, `12_ONLINE_BOOKING.md`, `13_FEEDBACK.md`, `14_MARKETING.md`.

## 4. Module coverage

“Inspected in browser” is **Yes** only when a discovery document records a live visit. This audit did not reopen Salonized. A document claim is not a screenshot.

| Module | Browser | Main screen captured | Dialogs captured | Dropdowns captured | Safe flow | Hover | Transition | Dependencies | Evidence | Missing |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Yes, per `01_DASHBOARD.md` | No | No | No | Partial | No | No | Partial (X29) | Doc only | No image. Activity tab not deeply opened |
| Calendar day | Reference file only. `02_CALENDAR.md` says the 2026-11-08 live pass opened **week** view and treated day density as prior reference | Yes, sensitive | No | No | Partial | No | No | Partial | `salonized-calendar-day.png` | Redacted day frame; hover; drag |
| Calendar week | Yes, per `02_CALENDAR.md` | No | No | View control described, not captured | Partial | No | Date-next claimed in motion spec, no frames | Partial | Doc only | No week screenshot at all |
| Appointment creation | Yes, per `01_CREATE_APPOINTMENT.md` and `03_APPOINTMENTS.md` | Schematic only | Schematic only | No open list photograph | Partial. Submit not clicked | No | Class sample claimed, no frames | Partial (X08, X37) | SVG wireframe | Live modal, service list, customer results, save, error |
| Appointment details | Yes, per APT-002 | No | No | No | Partial. Actions seen, not used | No | No | Partial (X09–X11, X38) | Doc only | Detail screenshot |
| Appointment editing | Yes, per APT-003 | No | No | No | Partial. Escape used. Save not clicked | No | No | Partial | Doc only | Edit screenshot |
| Rescheduling | Move action seen. Drag and save not run | No | No | No | No | No | CSS only | Partial (X09) | Motion spec marks live drag UNVERIFIED | Snap, invalid drop, conflict text |
| Cancellation | Delete action seen. Not clicked | No | No | No | No | No | No | Recorded as proposed (X10) | Doc only | Confirm dialog, occupancy result |
| Waiting list | Yes, per `11_WAITING_LIST.md` | No | No | Filters described, not captured | Partial. Convert not clicked | No | No | Partial (X12) | Doc only | Table screenshot, convert flow |
| Customers | List documented. Reference photo exists | Yes, sensitive | No | No | Partial. Search results and create not saved | No | No | Partial (X07, X26) | `salonized-customer.png` | Profile, groups admin, merge |
| Employees | List and new form documented. New form not submitted | No | No | No | Partial | No | No | Partial (X01) | `05_EMPLOYEES.md` | Detail editor, colour, qualifications |
| Working hours | Timetable week documented. Cells not edited | No | No | No | Partial | No | No | Partial (X03, X22) | `06_TIMETABLE.md` | Cell editor, breaks |
| Absences | List and holiday table documented. Create not submitted | No | No | No | Partial | No | No | Partial (X04) | `06_TIMETABLE.md` | Create form, conflict gate |
| Services | Admin and booking categories documented | No | No | No open dropdown image | Partial | No | Service list motion claimed, no frames | Partial (X05, X06) | `07_SERVICES.md` | Edit dialog, packages |
| Settings hub | Yes | Yes | No | No | Partial. Save not clicked | No | No | Partial | `salonized-settings.png` | Account-protection card is not a workflow |
| General settings | Yes | Yes (two copies) | No | Closed selects visible | Partial | No | No | X31 observed as form, not saved | Both general-settings PNGs | Saved result |
| Calendar settings | Yes | Yes | No | Closed selects visible | Partial | No | No | X14 form observed | `calendar-settings.png` | Saved result |
| User accounts | Yes, per SET-004 | No | No | No | Partial | No | No | X02, X30 | Doc only | Accounts screenshot |
| Messages | Log chrome documented | Yes, sensitive | No | Filter closed | Partial. Send not run | No | No | X17 | `salonized-messages.png` | Templates body |
| Reports | Totals documented | Yes | No | No | Read-only partial | No | No | X29 | `salonized-reports.png` | Other report tabs |
| Online booking | Page opened | Accordion shell only | **No** | **No** | Partial | No | No | X13 | `online-booking-settings.png` | The PNG does **not** show the field list written in `12_ONLINE_BOOKING.md`. Those labels are document-only |
| Marketing | Insights documented | Insights only | No | No | Partial | No | No | Waiting list linked | `salonized-marketing.png` | Discounts, email, filters, rebook tabs |
| Feedback | Chrome documented | Yes, sensitive | Detail pane is in the PII file | Filters visible, not a captured open menu | Partial | No | No | Not a booking dependency | `salonized-feedback.png` | Redacted version |
| Data export | Form documented | Yes (two copies) | No | Closed selects | Partial. Export not run | No | No | X18, X32 | Both data-export PNGs | Output file, import path |
| Register, products, billing, integrations, support | Named in `00_APPLICATION_INVENTORY.md` | No | No | No | No | No | No | Out of V1 or inventoried only | Inventory table | No screenshots |

## 5. Interaction and motion

Source: the 21 rows in `INTERACTION_COVERAGE_MATRIX.md` and `UI_INTERACTION_AND_MOTION_SPEC.md`. There is no recording and no before/after screenshot sequence.

### Direct observation claimed, with no image sequence

| ID | Claim |
|---|---|
| IX-CAL-01 | Create appointment click opens a sheet. URL changes. Focus is not trapped |
| IX-CAL-02 | Escape closes the sheet |
| IX-CAL-03 | Escape while service search is focused closes the whole sheet |
| IX-SVC-01 | Service select opens a list and focuses search |
| IX-SVC-02 | Typing a catalog term filters options |
| IX-CAL-04 | Week to day shows employee columns |
| IX-CAL-05 | Today control becomes active |
| IX-CAL-06 | Next day swaps with no preloader |
| IX-NAV-01 | Sidebar calendar link is the current page |

The motion spec also says a create-overlay class was present about 92 ms after click, and date navigation mutated the DOM in about 30 ms. Those are written as samples. They are not backed by a recording.

### Not direct observation

| ID | What the file actually says |
|---|---|
| IX-EMP-01 | Partial. Same control as services. Staff filter not redone |
| IX-MOD-01 | Partial. Find availabilities not reopened in the motion pass |
| IX-CAL-07 | Empty-slot hover is CSS only. Live paint unverified |
| IX-CAL-08 | Appointment hover is CSS only. Live paint unverified |
| IX-DND-01 | Drag opacity is CSS only. Live drag not performed |
| IX-NAV-02 | Button hover and press are CSS only |
| IX-RM-01 | Reduced-motion media query is CSS only |
| IX-CUS-01 | Customer search results not opened |
| IX-NAV-03 | Synthetic mouseenter showed no sidebar tooltip |
| IX-SAL-01 | Salon switcher motion not re-timed |
| IX-FB-01 | Save toast not seen because save was forbidden |
| IX-FB-02 | Conflict or validation copy not seen |

`DISCOVERY_GAPS.md` repeats the same holes: empty-slot create, drag, hover paint, customer search, save toast, and full keyboard order.

## 6. Dependencies against SF-001–SF-048

X01–X40 are SalonFlow implementation records. They cite SF and IT identifiers. They are not a transcript of Salonized’s server.

Checked against the evidence cells and `DEPENDENCY_COVERAGE_REPORT.md`:

- Prerequisites, affected modules, and SF links are filled in for all 40 records.
- Live confirmation of the **write** is missing wherever the evidence cell says submit, save, drag, or export was not executed. That includes create, move, cancel, no-show, hours commit, absence create, service edit, customer create, and export.
- Concurrency, idempotency, cross-location exclusivity, and realtime refresh are marked unverified (U1, U6, U10, U15, X15, X28, X40).
- X11 says the no-show occupancy rule is **proposed from Master Architecture**, not observed in Salonized.
- X10 says Salonized shows Delete, while SalonFlow’s rule is a soft cancel. That difference is explicit, not observed Salonized backend behaviour.
- X20 says the proposed deactivate rule may be stricter than Salonized. Salonized’s exact behaviour is unverified.
- `12_ONLINE_BOOKING.md` lists many widget fields. The only saved image shows collapsed accordions. Those field-level claims are not photographically verified.
- `02_CALENDAR.md` records Sunday as largely unavailable and hatching for non-working time. That part of discovery is real and matches the later hatch investigation. It does not specify the fictional seed that the SalonFlow demo database was missing.
- SF-001–SF-048 themselves were not re-derived from Salonized in this audit. The matrix maps onto them. Where a cell says PROPOSED, the SF text is a SalonFlow rule, not a captured Salonized response.

## 7. Why the running UI did not look like Salonized

| Cause | What the files show |
|---|---|
| The screen that was running was the engineering harness | `src/features/calendar/calendar-board.tsx` on the branding baseline was a date field plus an inline form. `e2e/booking.spec.ts` creates staff named `Eva ${Date.now()}` with a Monday-only shift. `docs/discovery/IMPLEMENTATION_HANDOFF.md` and the NS-017 review already said the harness is not the product UI |
| The dense calendar reference could not be handed to frontend as a safe image | The only populated calendar file is gitignored and full of customer names. `SCREENSHOT_INDEX.md` forbids saving it. Frontend had a written description and `docs/UI_REFERENCE.md`, not a redacted frame |
| Create-flow requirements were written and then not what shipped first | `01_CREATE_APPOINTMENT.md`, the SVG wireframe, and `NS-008_FRONTEND_IMPLEMENTATION_BRIEF.md` describe the Salonized sheet. The brief is **untracked**. The first running calendar did not use that sheet |
| Most discovery files are still untracked | `git ls-files` tracks only `IMPLEMENTATION_HANDOFF.md`, `SALONFLOW_IMPLEMENTATION_MAPPING.md`, `docs/UI_REFERENCE.md`, and the references README/gitignore. The module docs, matrix, motion spec, and safe screenshots are untracked, so they were not in the committed baseline |
| Discovery was not detailed enough for motion | Hover, drag, customer search, and save feedback have no frames. Implementing them from the matrix would be copying CSS notes or proposals |
| A design-concept branch was explicitly deferred | Owner decision UI-07 kept the UI-concept PR as reference and did not merge it as the product |
| The all-hatched grid was data, and discovery had already described real hatching | Test staff had Monday hours. The preview date was Sunday 8 November 2026. `02_CALENDAR.md` and `06_TIMETABLE.md` already say non-working time is hatched. Removing the hatch would have hidden a real rule |
| The current reception branch is a correction, not evidence that discovery was complete | `feat/ns-008-reception-calendar` adds a day toolbar, columns, and a dialog on top of the same engine. It still is not the documented Salonized sheet: no week view, no drag, no searchable service list, and new-customer save is still two requests |

## 8. Coverage, without a percentage

### Screens

| State | Items |
|---|---|
| Verified by a saved image | Settings hub, general settings, calendar settings, data export form, reports totals, marketing insights, online-booking accordion shell, customer list (sensitive), message log (sensitive), feedback list (sensitive), populated calendar grid (sensitive) |
| Only a schematic | Create appointment layout, motion tokens |
| Documented live, no image | Dashboard, week calendar, appointment detail, edit sheet, employees, timetable, absences, services, user accounts, waiting list |
| Not usefully captured | Open dropdowns, hover, drag, save, error, cancel confirm, employee editor, service editor, absence form |

### Interactions

| State | Items |
|---|---|
| Verified in prose only | 9 OBSERVED rows in section 5 |
| Partial | Employee select, Find availabilities |
| CSS or proposal only | Slot hover, card hover, drag, button press, reduced motion, toasts, customer search, tooltips, salon-switcher motion |

### Dependencies

| State | Items |
|---|---|
| UI signal written as OBSERVED | 27 of 40 records |
| No OBSERVED label | 13 records |
| Explicitly unverified rules | U1–U15 |
| Not claimed as Salonized backend | All booking conflict, idempotency, snapshot, and allocation behaviour marked PROPOSED |

No coverage figure is 100%. Screen coverage of the receptionist day is one sensitive photograph plus prose. Interaction coverage has no recordings.

## 9. Priority to close the gaps

1. Do not commit the four sensitive reference files. Replace them with Owner-approved redacted frames before any frontend agent uses them as visual source.
2. Capture, in a sandbox or with redaction, the missing receptionist frames: week view, empty-slot hover, appointment hover, create sheet, open service list, customer search with fictional people, edit sheet, and a conflict message.
3. Re-open online booking and either screenshot the expanded fields or delete the unverified field list from `12_ONLINE_BOOKING.md`.
4. Keep treating X10, X11, X20, X28, X34, and X40 as SalonFlow rules until a sandbox shows the Salonized behaviour.
5. Track the discovery markdown that is still untracked, without adding the sensitive PNGs, so the next implementation starts from the evidence rather than from the harness.

This audit does not authorise another Salonized exploration or a redesign.
