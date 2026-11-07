# UI concepts — reception calendar

Status: awaiting Owner approval. No production component has been rewritten.

Previews, fictional data only:

- `design-concepts/previews/konzept-a.png` — Empfang
- `design-concepts/previews/konzept-b.png` — Atelier
- Open `design-concepts/a.html` and `design-concepts/b.html` in a browser

Branch: `design/ui-concepts`. Booking engine, schema, and API contracts are unchanged.

## Audit of the current calendar

Compared with `docs/references/salonized/salonized-calendar-day.png` and the running SalonFlow day view.

| Area | Salonized reference | Current SalonFlow |
|---|---|---|
| Proportions | The day grid fills the viewport. One toolbar row. | A page title, explanation, and placeholder note sit above the grid and push the day down. |
| Sidebar | Narrow dark rail. Coral pill on the active item. Short labels. | Dark rail is right. The active item is a gray pill, and the mark is a blush sparkle tile. The footer still talks like a prototype. |
| Type | Staff name, then time, customer, service on the card. | Column headers are raw names. The card shows only the customer. |
| Density | About eleven staff columns, names truncate, 15-minute rules. | Columns use a 145px minimum and grow. Ten people plus a form do not fit. Most of a column is empty hatch. |
| Cards | Pastel block, time range, customer, service. | One mint rectangle. No time, no service, no category color. |
| Grid | Hatch only off shift. Green now-line. | Hatch is the dominant texture, including whole columns with no hours. No now-line. |
| Chrome | Heute, Tag/Woche, date, filters, dark “Create” button. | A native date field. Salon and “Anmelden” live in a separate header. |
| Form | Not in the screenshot set. The product still needs a compact create sheet. | The create form stacks under the grid, so the day and the form compete for height. |
| Controls | One compact control height. | Inputs are 40px beside a 28px grid. |
| iPad | Same density does not fit; the reference implies a subset of columns. | The desktop grid is the only layout. |

The settings screenshot is a different problem: large empty canvases and promo cards. That airiness must not be copied into the calendar.

## Token proposal

Keep the existing token names. Proposed values for the Empfang direction:

| Token | Now | Proposal |
|---|---|---|
| `--sidebar` | `#171e29` | `#1b2433` |
| Active nav | blush pill | `#e15b6d` on the active item only |
| `--background` | `#f3f5f7` | `#eef1f4` |
| `--primary` | `#243041` | `#1b2433` for the one primary button |
| Card fills | one sage | shellac `#f6d6de`, gel `#e7ddf8`, manicure `#f8e6d4`, pedicure `#d9ebd8`, french `#d9e7f8` |
| `--cal-row-height` | `28px` | `16px` per 15 minutes (`64px` per hour) |
| `--radius` | `0.45rem` | `6px` on controls, `4px` on cards |
| Type | display + sans | Segoe-compatible sans in the product; no second display face on the grid |

## Recommendation

Build **Konzept A, Empfang**. A full book is scanned by color and by column. The pastel blocks, hatch, now-line, and one-row toolbar match the way the reference calendar is used. Konzept B is calmer, and its sectioned sheet (“Wer / Was / Wann”) is the better form. Use that sheet inside A. Do not adopt B’s white cards as the default: category color becomes a thin stripe and is harder to see across ten columns.

V1 does not activate the Warteliste. The strip in A is only a layout placeholder.

## Components to change after approval

- `src/styles/tokens.css`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/app-shell.tsx`
- `src/features/calendar/calendar-board.tsx` — toolbar, columns, cards, now-line
- Create and edit appointment UI, from an inline form to a side sheet
- Shared button and field heights

Not in this pass: booking engine, migrations, API contracts, staff and service admin pages.
