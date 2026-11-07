# UI/UX specification — Salonized-inspired, original implementation

## Source of evidence
Owner's three November 2026 Salonized screenshots: Dashboard, Day Calendar, Settings. They contain identifiable customer appointments: do not store originals in the repo, share with cloud agents, or expose in screenshots. Use anonymized synthetic fixtures and the descriptions below.

## Visual principles
- Calendar density is vital. This is a receptionist work tool, not a low-density marketing landing page.
- Original clean styling with the observed information hierarchy: dark narrow left nav (~100px on wide desktop), white toolbar, light-gray application canvas, white sections, soft pink/coral active navigation and muted appointment tints. Do not use the 'tw' logo or Salonized art.
- Optional light/dark toggles; default light. No excessive motion; proper focus indicators and contrast; color never sole status indication.
- Technician column has min readable width (~145px at desktop, tune from usability tests), sticky top row, horizontal scroll across 20 workers. Vertical time ruler sticky at left.
- Zoom options: 5/10/15/30-min grid; avoid recomputing UTC by pixel drag without DST-aware conversion.

## SCREEN CAL — Daily Calendar (highest priority)
Layout at 1440px wide:
[Sidebar] [Top: Salon selector | Today | prev/next | date | Day/Week | Staff filter | Search | +Appointment]
          [Left time column] [Staff 1] [Staff 2] [Staff 3] ... [Staff N] [Horizontal scroll]
          [10:00]             {appointment cards per technician}
          [10:15]             ...

- Header: sticky name/avatar, shift indication, filter unavailable staff.
- Unavailable time: subtle diagonal hatch and reason in accessible detail.
- Appointment: category-colored rectangle with time, customer label, service summary, status/alerts; preserve visual hierarchy when card is short. Use fake names in fixtures.
- Interactions: slot click opens quick-create drawer; card click opens details; drag and resize optimistic UI pending server; on rejection restore original and show accurate reason; keyboard alternative via reschedule dialog; touch needs long-press or button alternative.
- A waiting-list row is reserved for V2 but not active in V1.
- Search filters customer by normalized phone/name without exposing unauthorized fields.
- Week view: one technician, seven day columns; day switch and month/date picker.

## SCREEN Q — Quick-create drawer
Required order and prefill: Staff/Salon/Time (from clicked slot) → Customer quick search or walk-in → Service(s) with favorites and recent → auto computed duration/end → optional notes → Save. Show service price for reference, not as payment workflow. Keep drafts on 409 conflict. Inline warnings for outside shift, double booking, ineligible technician. Routine target ≤ 15 seconds for returning customer.

## SCREEN DASH — Dashboard (second priority)
Main schedule list with upcoming appointments and status; quick-start new appointment / customer; notes due today (V2); who's working (shifts + count); customer counts and utilization (V2). Exclude Treatwell terminal promo, Sale/Register and billing tiles.

## SCREEN SETTINGS — Settings (third priority)
Left secondary navigation sections: GENERAL (profile, users, data export), COMPANY (locations, staff, absences, rooms/resources, timetable), CALENDAR (calendar settings, services), CUSTOMERS (customer settings). Main panel has card list plus category editor and hours forms. Exclude sales, VAT, payment, gift cards, promotions and billing settings.

## Other screens
Customers list/detail, Employee/team, Services/categories, Timetable, Absences, Login, Role administration, Import preview, Audit (admin only), support/error state.

## Design implementation rules
- Use shadcn/ui for menus, dialogs, sheets, inputs, tables; original design tokens and typography.
- Keep `CalendarAdapter` boundary around selected calendar library; compare DayPilot Lite and React Big Calendar using one fixture and interaction checklist.
- Pixel equivalence is not the goal; validate task flow and density against screenshots at consistent viewport sizes. Build Playwright screenshots and check accessibility.
- Mobile and iPad cannot rely on hover. Calendar must allow selecting/switching employees if width is constrained.

## V1 visual test fixtures
Synthetic: 3 salons, 20 staff, 200 appointments across one day and 2 weeks, categories (Auffüllen, Shellac, Pediküre, Maniküre, Gelmodellage, Nail Art), shifts 10:00–20:00, one off shift, break, overlap attempt, all-day block, no-show label. No real customer data.

## UI acceptance
At 1440×900: visible top toolbar, sticky staff row/time ruler, legible 15min rows, 20 employees via horizontal scroll, fast click and drag. At iPad landscape: tap accessible, horizontal scroll, move via form if drag unsupported. At 390px phone: day-first technician selector and booking form usable. Keyboard focus and color contrast checks pass.
