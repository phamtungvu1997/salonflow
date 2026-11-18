# 04 — Customers

Live read-only pass on 2026-11-08, starting from the authenticated Customers area. No customer was created, imported, exported, archived, blocked, or merged. No unredacted screenshot was saved. Personal names, phone numbers, emails, and review text are not recorded here.

Visual reference: [`screenshots/customers-directory.schema.svg`](screenshots/customers-directory.schema.svg). That file is a **reconstruction** with fictional rows, not a photograph.

| Field | Value |
|---|---|
| Workflow IDs | CUS-001 list · CUS-002 groups · CUS-003 create · CUS-004 profile |
| Entry | Sidebar `/customers` |
| Routes observed | `/customers`, `/customers/new`, `/customers/segments/first-visit-follow-ups`, `/customers/segments/lapsing-regulars`, `/customers/{id}/overview`, `/customers/{id}/appointments`, `/customers/import` |

## CUS-001 Customer list

### Layout (**OBSERVED**)

- Page title **Customers**. Sidebar destinations visible from this area include `/calendar`, `/customers`, `/register`, `/products`, `/messages`, `/feedback`, `/reports`, `/marketing`, `/online`.
- Tabs: **Customer list** (current) and **Customer groups** (`/customers/segments`).
- Search box placeholder **Search…**.
- A control beside search opens **Filter your customers**.
- An icon menu labeled in the accessibility tree **Import Export**. Menu items: **Import** (`/customers/import`) and **Export**. Export was not clicked.
- Primary button **Create customer** goes to `/customers/new`.
- Result line **Results found:** plus a count. The populated list showed a five-digit count. A non-matching query showed **Results found: 0**.
- Columns: **NAME · MOBILE · EMAIL · NEWSLETTER · ADDRESS**.
- Each visible row is a link to `/customers/{id}`.
- **No** checkbox inputs were in the list DOM. Bulk selection was not observed.
- A hidden row menu exists in the DOM with **Call**, **Edit**, and **Archive customer** (`display: none`). A synthetic `mouseenter` did not open it. Live hover paint is **UNVERIFIED**.
- The NAME header uses `cursor: auto`. Clicking it did not change which row was first. Sorting was **not observed**.
- No numbered pager was present. The list first exposed 25 profile links. After the list scroller moved, 50 profile links were in the DOM. Further pages were not counted.
- Empty search copy: **No results found.**
- A separate loading skeleton was not isolated. Search updated to the empty state within about two seconds of the input event. An exact debounce was **not measured**.

### Filter panel (**OBSERVED**)

Categories: Age, Appointments, Birthday wishes, Customers, Gender, Labels, Last appointment, Loyalty points, Money spent, No-shows, Products, Services, Treated by.

Gender opens a second pane: **Filter on: gender**, options **Male**, **Female**, **Non-binary**, **Unknown**, and **Add**. Add was not used. Computed `transition-duration` on that pane was **0s**. Escape did **not** close the filter. Clicking the filter control again did.

### Search (**OBSERVED**)

Typing a nonsense string that matches no one replaced the list with zero results and **No results found.** Clearing the field restored the full result count. This was a live filter, not an Enter-only submit.

## CUS-003 Create customer

Route `/customers/new`. This is a page, not `role="dialog"`. The customer list remained in the DOM beside or behind the form. **Save was clicked only on an empty form.** The URL stayed `/customers/new`, so no record was created. **Cancel** is a link to `/customers`.

### Sections and fields (**OBSERVED**)

| Section | Fields |
|---|---|
| Personal information | **FIRST NAME \***, **LAST NAME \***, GENDER radios (Male, Female, Non-binary, Unknown), DATE OF BIRTH (`dd-mm-yy` date input) |
| Contact information | EMAIL ADDRESS, PHONE NUMBER with a country-code list (country name + dial code, about 200px tall), MOBILE PHONE NUMBER with the same kind of list, POSTAL CODE, HOUSE NUMBER, ADDRESS, CITY |
| Customer labels | Existing label chip **Favourite**, action **Create new label** (not opened) |
| Custom fields | Text: “You can add your own custom fields in settings > customer settings” |
| Additional information | ADDITIONAL CUSTOMER INFORMATION, ADDITIONAL INVOICE INFORMATION, WARNING WHEN SAVING APPOINTMENTS |
| Profile picture | **Attach file** |

HTML `required` was false on the inputs. The visible required markers are the asterisks on first and last name. Empty Save showed **\* This field is required** in two places, under those two fields. Focus remained on an input. Full tab order was **UNVERIFIED**.

Newsletter is a **list column**, not a field on this form. Reminder and newsletter switches were on the profile instead.

## CUS-004 Customer profile

Opened one profile and read structure only. Values that identify a person are not stored.

Route pattern `/customers/{id}/overview`.

Tabs: **Overview · Sales · Appointments · Reports · Forms · History · Loyalty points**.

Overview actions: **Create appointment**, **Create sale**, **Fill in a form**, **Create report**, **Send message**, **Share appointments**, **Back to customers**, **Block customer** (not clicked).

Detail labels: Email, Mobile, Created. A group banner can say the customer is a **Lapsing regular**.

Preference rows: Email appointment reminders, SMS appointment reminders, Newsletters, Rebook reminders.

Summary counters: APPOINTMENTS, SALES, LOYALTY POINTS, CANCELLATIONS.

Also present: Customer labels with **Create new label**, and Notes with **Create note**. Neither was submitted.

History feed event types seen, without copying dates or names: online appointment created, appointment with dynamic price created, customer updated via online booking, appointment modified (duration), appointment moved, appointment removed.

Appointments tab route `/customers/{id}/appointments`. Columns: **DATE AND TIME · STATE · SERVICES · LABEL · EMPLOYEES**. A **PREVIOUS** control was visible. A next control was not found in that view.

Clicking a **Create appointment** control while the profile was open ended on `/calendar` with no sheet. That does **not** prove the profile button prefills the customer. **UNVERIFIED** for SF-019.

## CUS-002 Customer groups

The Customer groups tab opened `/customers/segments/first-visit-follow-ups`, not a blank admin table.

Two built-in segments:

| Segment | Count shown | Description on screen |
|---|---|---|
| First-visit follow-ups | 146 | Customers who recently had their first appointment |
| Lapsing regulars | 492 | Regular customers without a future booking |

Intro line: keeping a customer is more profitable than finding a new one, and these groups are for repeat bookings.

Group table columns: **NAME · EMAIL · LAST MESSAGE**. Action: **Send message** (not clicked). **Learn more** points at a Treatwell support article.

No **create group** dialog was on this screen. Labels (**Favourite**, **Create new label**) are a different feature on the customer form and profile. Membership rules for those labels were **UNVERIFIED**.

## Booking connection (**OBSERVED** this pass)

Calendar **Create appointment** href is `/calendar/create-event/appointment`. The sheet is not `role="dialog"`.

The opened sheet included SERVICE, DURATION, EMPLOYEE, Find availabilities, a Customer section, DATE AND TIME, PRICE, **Send email notifications**, and **Create appointment**.

The Customer section was already showing a selected person and the phrase **Last appointment … ago**. The name is not recorded. The strings **Search customer**, **Add new customer**, and **walk-in** were **not** in the text captured this pass. Earlier discovery reported that chrome. Treat walk-in copy and in-sheet customer search as **not re-proven** here.

The sheet was closed with Escape. Nothing was saved.

## Import (**OBSERVED**, not run)

`/customers/import` shows **Import customers**, a file input with no `accept` attribute, **Learn more**, and **Submit**. Submit was not used. Column mapping after a file is chosen is **UNVERIFIED**.

## Interaction evidence

| Interaction | Result | Timing |
|---|---|---|
| Search input | List filters without Enter | Not measured beyond “result visible on the next read, about 2s later” |
| Empty search | **No results found.** | Same |
| Filter open / gender pane | Second pane appears | `transition-duration: 0s` on the pane that was measured |
| Escape on filter | Pane stayed open | — |
| Filter toggle | Second click closed it | — |
| Escape on create-appointment sheet | Returned to `/calendar` | Not re-timed |
| Empty Save on `/customers/new` | Stayed on the form; required message under first and last name | — |
| Row hover | Menu labels exist hidden; live hover **UNVERIFIED** | — |
| Column sort | Not observed | — |

No screenshot sequence and no recording exist for these interactions. The directory SVG is a reconstruction.

## Dependencies

| Topic | This session | SalonFlow rule | Test |
|---|---|---|---|
| Create customer fields | Form observed; submit not completed | Customer module must not write bookings | IT-10 still the booking-link test |
| New customer inside a booking | Not re-proven this pass | **SF-020** one transaction | IT-10 |
| Book from profile | Button seen; prefill **UNVERIFIED** | **SF-019** | Not covered by a passing UI test |
| Selected customer shows last visit | Relative “last appointment” line **OBSERVED** on the sheet | **SF-035** | Later |
| Warning field on the profile form | Label **OBSERVED**; display inside the calendar **not** re-checked | **SF-035** | Later |
| Merge | No merge control found | **SF-036** **DOCUMENTED** S17 only | — |
| Archive | Menu item **OBSERVED** in hidden DOM; not clicked | **SF-042** must keep history readable | — |
| Block | Profile control **OBSERVED**; not clicked | Do not invent a block rule | — |
| Groups vs labels | System segments and a separate label chip | Do not treat segments as free-form groups | — |
| Import | File screen only | **SF-040** needs a real sample before mapping | IT-14 |
| Export | Menu item only; not run | Do not call export during discovery | — |

Salonized’s server rules for archive, block, merge, and import were not observed. Only the controls were.

## Still unverified

- Live row hover, Call, and Edit destinations.
- Archive and Block confirmation and effect.
- Whether NAME or other columns sort by any gesture.
- A pager beyond the 25-then-50 growth on the directory.
- Profile **Create appointment** prefill.
- In-sheet **Search customer**, **Add new customer**, and walk-in copy (not in this pass’s sheet text).
- Create-new-label and create-note forms.
- Custom-field editor under customer settings.
- Import column mapping.
- Export file shape.
- Merge UI.
- Sales, Reports, Forms, and Loyalty tabs beyond their names.
- Keyboard order through the create form.
- Loading skeleton.

## Evidence

- This live pass, 2026-11-08.
- Reconstruction: `screenshots/customers-directory.schema.svg`.
- Older photograph `docs/references/salonized/salonized-customer.png` remains gitignored and was not used as the source of these field lists.
