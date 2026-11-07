# SalonFlow UI reference — Salonized layout audit

**Audience:** UI/UX, frontend, product, independent review.  
**Purpose:** Capture layout and interaction patterns from the local Salonized screenshot set so SalonFlow can achieve operational density and workflow parity **without** copying proprietary assets, logos, or branding.  
**Authority:** [`MASTER_ARCHITECTURE.md`](MASTER_ARCHITECTURE.md) and [`DOC_CONFLICTS.md`](DOC_CONFLICTS.md) win over kit docs. Supporting detail: [`03_UI_UX_SPEC.md`](03_UI_UX_SPEC.md), [`references/salonized/README.md`](references/salonized/README.md).  
**Screenshot inventory:** [`references/salonized/`](references/salonized/). Analyzed 2026-11-07.

**PII policy:** Calendar, Customers, Messages, and Feedback captures contain real customer identities. This document describes **layout only**. Do not reproduce real names, phones, emails, or review text. Use fictional placeholders (e.g. *Anna Berger*, *Lena Hofmann*) in fixtures and future redacted screenshots. PII-bearing files are gitignored pending Owner redaction.

---

## 1. Sidebar and navigation structure

### Primary sidebar (all screens)

| Trait | Observed in Salonized | SalonFlow implication |
|---|---|---|
| Placement | Far-left vertical rail, full viewport height | Keep a dedicated app shell nav; calendar owns remaining width |
| Theme | Dark charcoal / near-black | Dark nav is a strong receptionist landmark; finalize tokens in M02 (interim sage/slate may differ) |
| Item pattern | Icon + short text label, stacked | German labels for V1; original icons only |
| Active state | Coral/pink filled pill behind icon+label; white foreground | Accent = active only; never the sole status cue elsewhere |
| Density | Narrow; labels truncate if needed | Prefer ~200–240px expanded / ~56–72px collapsed per Master Architecture |

**Top cluster (product modules), top → bottom as seen:**

1. Dashboard  
2. Calendar (active on day-view capture)  
3. Customers  
4. Register *(POS — out of SalonFlow V1)*  
5. Products *(inventory — out of V1)*  
6. Messages  
7. Feedback  
8. Reports *(mostly sales — out of V1 product scope)*  
9. Marketing *(out of V1)*  
10. Online (status dot near bottom of top cluster on some screens)

**Bottom cluster** (separated by a subtle divider):

1. Settings (active when settings screens are open)  
2. What’s new (optional notification badge)  
3. Support Hub  

### SalonFlow V1 primary nav (target IA)

Align with Master Architecture, not Salonized’s full product line:

| German label | Role |
|---|---|
| Kalender | Day/week staff calendar (primary surface) |
| Übersicht | Dashboard / agenda (when captured) |
| Kunden | Customer list + detail |
| Team | Employees, skills, timetable, absences |
| Leistungen | Services / categories |
| Einstellungen | Settings shell + secondary nav |

**Do not ship in V1 nav:** Register, Products/stock, Marketing hub, sales Reports, billing, Treatwell promo tiles. Messages/Feedback may stay deferred (V2+) unless Owner elevates them.

### Secondary patterns

- **Settings:** vertical secondary nav column (see §8).  
- **List modules (Customers, Messages, Reports, Marketing):** horizontal tabs under the page title; active tab = coral underline + bold/coral text.  
- **Header utilities (right):** search, notifications/help, user avatar — keep minimal; avoid marketing widgets in the shell.

---

## 2. Calendar layout (toolbar, waiting list, sticky headers)

**Source:** `salonized-calendar-day.png` (filename historically mislabeled as dashboard; content is **day calendar**).

### Toolbar (above the grid)

Left → right pattern observed:

1. **Today** control  
2. **View switcher** (Day selected; Week available but not shown in this set)  
3. **Date navigator** — prev / next, readable date (weekday + calendar date), calendar picker affordance  
4. **Staff filter** dropdown(s) (e.g. employee / “show all”)  
5. **Search** icon  
6. Primary **Create appointment** action (dark filled button, top-right)

SalonFlow shell should also expose a **salon selector** near the top (required by architecture; not always prominent in the Salonized calendar crop).

### Sticky staff header row

- Employee **name + small circular avatar** sit in a sticky header above the time grid.  
- Headers stay fixed while the grid scrolls vertically; horizontal scroll moves columns with their headers.  
- Column widths stay narrow under high staff counts; names truncate rather than compressing to unreadability beyond ~10–11 visible columns.

### Waiting-list / all-day strip

- Directly under each staff header: a light blue **Warteliste** bar with a **+** affordance.  
- Treat as a layout cue for an optional all-day / waitlist band.  
- **Product rule:** waiting list is **reserved for V2** and must not be active in V1 (`03_UI_UX_SPEC.md`). V1 may omit the strip or show a non-interactive placeholder only if it does not imply working waitlist behavior.

### Canvas

- Light gray / off-white grid background.  
- Sticky **time ruler** on the left.  
- Multi-column staff body; horizontal scroll expected.

---

## 3. Employee columns (density for ~10–20 staff)

| Cue | Observation | Design target |
|---|---|---|
| Visible columns | ~11 staff in the day capture without fitting “all” | At **20 staff**, horizontal scroll is mandatory — never shrink columns to fit |
| Min readable width | Salonized columns are tight; labels truncate | SalonFlow target **~150–200px** (spec also cites ~145px floor); tune in usability tests |
| Avatars | Small circles beside names | Useful identity cue; keep accessible name text, not avatar-only |
| Sticky behavior | Header row sticky within calendar scrollport | Required acceptance for desktop |
| Filter | Hide staff not working / not selected | Support “who’s on shift” filtering |
| Tablet | Same density does not fit | Employee switcher / subset + form-based move when drag fails |

Fictional header examples for fixtures: *Jennifer*, *Lena*, *Linda*, *Emma* — never paste real customer names into docs or Playwright baselines.

---

## 4. Appointment cards

Observed hierarchy on pastel blocks (top → bottom):

1. **Time range** (e.g. `10:00 – 11:20`) + small **status icon** (clock / check / similar)  
2. **Customer name** (emphasized / bold)  
3. **Service summary** (truncated when long, e.g. refill / gel categories)  
4. **Corner status glyphs** (payment / notes / chat-style indicators in Salonized)

### Color and meaning

- Soft pastel fills by category (pink, purple, light green, peach observed).  
- SalonFlow: pastel by **service category or staff**, chosen via original tokens; **color is never the only status signal**.  
- Short cards must still preserve time → customer → service order (truncate service first).

### Blocked / unavailable cards

- Separate peach/light blocks with copy like “{Staff} is not available” (use fictional staff names in fixtures).  
- Distinct from bookable appointments; pair with hatch in empty cells (§5).

### Interactions (from product specs — **not** proven by this screenshot set)

- Empty slot → quick-create sheet/drawer.  
- Card click → detail/edit.  
- Drag/resize optimistic with authoritative rollback on `409`.  
- Keyboard / touch: reschedule dialog as first-class path.

---

## 5. Time intervals and grid

| Element | Observation |
|---|---|
| Slot size | **15-minute** horizontal rules (default) |
| Day span | Roughly **08:00 → 19:00+** visible; salons may extend (SalonFlow fixtures often 10:00–20:00) |
| Now-line | Horizontal **green** line + time badge (e.g. current local time) |
| Unavailable | Light **diagonal hatch** over off-shift / break regions |
| Accessibility | Hatch + text reason in detail; do not rely on pattern alone |

SalonFlow also plans zoom to 5/10/15/30-minute grids; DST-aware local mapping is mandatory (never pixel-drag as raw UTC).

---

## 6. Colors and spacing (approximate → original SalonFlow tokens)

**Do not copy Salonized brand assets.** Approximate observed palette for parity discussions; M02 locks final tokens.

| Role | Approximate cue | SalonFlow direction |
|---|---|---|
| Nav background | Near-black / charcoal `#1A1A1A`–`#1a1a2e` | Dark rail OK; original brand |
| Active nav / tabs / radios | Coral–pink ~`#F06292` / `#FF5C75` | Accent token; DOC_CONFLICTS: final accent in **M02** UI review |
| Canvas | Light gray `#F5F7F8` | Soft app background |
| Surfaces | White cards / tables | White content panels |
| Primary action | Dark navy / near-black button | Strong CTA without coral fill |
| Appointment fills | Muted pastels | Category/staff tints with AA contrast for text |
| Now-line | Green | Distinct from coral accent |
| Status pills (Messages) | Green delivered / orange bounced / teal sent | Text + color |
| Sentiment (Feedback) | Green positive / red negative rings | Deferred module |

**Spacing philosophy**

- **Calendar:** high information density; tight cards and columns.  
- **Settings / hub cards:** more airy white space.  
- **Tables (Customers, Messages):** slim rows, light dividers, caps column headers.

Typography: clean sans-serif; SalonFlow chooses original fonts (avoid default Inter/Roboto stacks if the design system specifies otherwise). shadcn/ui for primitives; calendar behind `CalendarAdapter`.

---

## 7. Booking dialogs — not in this screenshot set

**None of the provided images show** a create-appointment dialog, quick-create drawer, or appointment detail/edit modal.

Product still requires these surfaces (Master Architecture Flow A/B; `03_UI_UX_SPEC` SCREEN Q):

| Needed capture / design | Why |
|---|---|
| Slot click → **quick-create** sheet | Prefill salon / staff / start; customer search; services; duration; notes; Save |
| Appointment **detail / edit** | Status, reschedule, cancel, no-show, notes |
| Conflict / `409` state | Keep draft; show machine reason in German |
| Touch **Termin verschieben** fallback | iPad without reliable drag |
| Week-view create path | Week UI missing entirely |

Until Owner supplies screenshots, design from architecture + UI spec — **do not invent** undocumented Salonized chrome as fact.

---

## 8. Settings interface

**Sources:** `salonized-settings.png`, `salonized-general-settings.png`, `salonized-settings-data-export.png`.

### Shell

1. Primary dark sidebar with **Settings** active in the bottom cluster.  
2. **Secondary settings nav** (light column): uppercase **group headers** + stacked links; active item = light gray bar + bold.  
3. Main pane: page title, optional Save (dark) top-right, white **cards** on gray canvas.  
4. Settings hub adds “popular” shortcut cards + right-rail widgets (stats / SMS / referral) — **omit** SMS credits and referral promo from SalonFlow V1.

### Salonized secondary groups (observed)

| Group | Items (as labeled) | V1? |
|---|---|---|
| **GENERAL** | General settings, Data export, User accounts, Integrations, Billing | Keep general, export, users; **exclude Billing**; Integrations only if Owner-scoped |
| **COMPANY** | Company information, Absences, Employees, Resources, Timetable | **In V1** (map to Salon / Team IA) |
| **CALENDAR** | Calendar settings, Services, Online bookings | Calendar + Services **in V1**; public online booking **later** unless Owner pulls forward |
| **CUSTOMERS** | Customer settings, Forms | Customer settings **in V1**; Forms as needed |
| **SALES** | Invoices and receipts, VAT rates, Loyalty points | **Excluded** (no POS / invoices / VAT books) |
| **PROMOTE** | Microsite, Feedback widget, Pricing widget, Gift card widget | **Excluded** |

### General settings form pattern

Carded fields: Language, Currency, Time zone, Week start (Mon/Sun), Time format (24h / 12h).  
SalonFlow V1 defaults: **German UI**, `Europe/Berlin`, **Monday** week start, **24-hour** time, **EUR**, `DD.MM.YYYY`.

### Data export pattern

Tabs (e.g. monthly vs lifetime), report type dropdown (Appointments), month picker, XLS/CSV radios, dark **Export** button. Useful for M15-oriented admin UX; keep exports authorization-scoped and audit-friendly.

---

## 9. Customers list patterns useful for V1

**Source:** `salonized-customer.png` (PII — layout only).

| Pattern | Use in SalonFlow |
|---|---|
| Page title + tabs (`Customer list` / groups) | List first; groups optional later |
| Search field + filter control | Normalized name/phone search; no unauthorized fields |
| Result count | Helps receptionists trust filters |
| Primary **Create customer** (dark) | Required |
| Dense full-width table | Checkbox, Name, Mobile, Email, optional marketing flag, Address, row actions |
| Slim rows / light dividers | High scan speed |
| Row overflow menu | Edit / merge / notes entry points |

**V1 caution:** Newsletter / marketing columns are not a V1 focus; prefer notes, alerts, and booking history over promo flags. Synthetic fixtures only.

### Related list pattern — Messages (reference only)

`salonized-messages.png`: tabs (log / templates / SMS), filter + search, dense table (Sent, Type, Customer, Contact, Message, Status pills, row action). Useful for future messaging; **not** a V1 milestone unless scoped. PII-heavy.

### Related master–detail — Feedback (V2+)

`salonized-feedback.png`: list + detail pane, sentiment rings, publish/reply actions, linked appointment summary. Low V1 priority; PII-heavy.

---

## 10. Explicit gaps / missing screenshots

| Gap | Notes |
|---|---|
| True **Dashboard / Übersicht** | Not in set; `salonized-dashboard.png` source was calendar |
| **Booking / quick-create** UI | Critical missing — see §7 |
| Appointment **detail / edit** | Missing |
| **Week** calendar view | Missing |
| Employee **timetable / absences** admin screens | Missing (only linked from settings nav) |
| Services catalog editor | Missing |
| Login / role admin / import preview | Missing |
| Mobile / iPad calendar crops | Missing — required for tablet acceptance |
| Redacted PII replacements | Calendar, Customers, Messages, Feedback still need Owner redaction before commit |

### Out-of-scope captures (keep for IA contrast only)

- **`salonized-reports.png`:** Totals tabs, sales/VAT/payment-method cards — illustrates secondary tabs + KPI cards; **content is POS/sales-centric → out of V1**.  
- **`salonized-marketing.png`:** Insights, discounts, campaigns, waiting-list marketing — **out of V1**; pattern note only (horizontal tabs + tip rail).

---

## 11. Recommended implications for SalonFlow (no implementation)

1. **Optimize for receptionist density**, not marketing whitespace. Day calendar with sticky time + staff headers is the north-star UI.  
2. **German-first chrome:** `Kalender`, `Heute`, `Termin`, `Kunden`, `Einstellungen`; Monday-first weeks; 24h; Berlin TZ; EUR display where prices appear as reference only.  
3. **No POS in the shell:** drop Register, sales Reports, Billing, VAT, gift cards, loyalty, and payment status icons that imply checkout. Show service **price for reference** in booking, not payment workflows (ADR-012).  
4. **Nav accent:** coral/pink active state is a parity cue; lock final SalonFlow tokens in **M02** (DOC_CONFLICTS). Do not ship Salonized art or ‘tw’ marks.  
5. **20-staff rule:** horizontal scroll + min column width; never auto-fit all columns unreadably.  
6. **Waiting list:** layout may appear in references; **inactive in V1**.  
7. **Booking sheet is the critical undesigned surface** in this batch — prioritize wireframes/states (empty, loading, validation, `409`) before visual polish elsewhere.  
8. **Settings IA:** map Salonized GENERAL/COMPANY/CALENDAR/CUSTOMERS → Master Architecture Allgemein / Salon / Team / Kalender / Kunden; strip Sales/Promote.  
9. **Customers:** ship dense searchable table + create + detail/history leading to rebook; synthetic data only.  
10. **Evidence:** Playwright screenshots at 1440×900, iPad landscape, and ~390px phone with **fictional** fixtures (≥3 salons, 20 staff, 250+ appointments for calendar spike).  
11. **Accessibility:** focus rings, contrast, status text+icon, no hover-only calendar actions on touch.  
12. **Pixel-perfect Salonized clone is not the goal** — task-time and density parity are.

---

## Appendix A — Screenshot → analysis map

| File | Used for | PII | V1 relevance |
|---|---|---|---|
| `salonized-calendar-day.png` | §§1–5 | **YES** | Critical |
| `salonized-customer.png` | §§1, 9 | **YES** | High |
| `salonized-messages.png` | §§1, 9 | **YES** | Low / later |
| `salonized-feedback.png` | §§1, 9 | **YES** | V2+ |
| `salonized-settings.png` | §§1, 6, 8 | Aggregate | High (hub IA) |
| `salonized-general-settings.png` | §§6, 8 | No | High (locale defaults) |
| `salonized-settings-data-export.png` | §8 | No | Medium (export UX) |
| `salonized-reports.png` | §§1, 10 | Aggregate | Out of scope (pattern only) |
| `salonized-marketing.png` | §§1, 10 | Aggregate | Out of scope (pattern only) |

## Appendix B — Next Owner captures (priority)

1. Quick-create / booking sheet (desktop + tablet)  
2. Appointment detail / edit / cancel / no-show  
3. True dashboard agenda  
4. Week view (single technician)  
5. Timetable + absences  
6. Redacted replacements for all PII screenshots  

---

*End of UI reference. Implementation belongs to frontend after M02 design acceptance; this file is analysis only.*
