# 12 — Online booking settings

## Identification

| Field | Value |
|---|---|
| Entry | `/admin/online-bookings` |
| Help | **DOCUMENTED** S24 |

## Interaction (**OBSERVED**)

Accordion groups:

1. **Main settings** (Enable control present)
2. **Schedule management**
3. **Customer information**
4. **Online payments**
5. **Style and sharing**

Observed fields/labels include:

- Booking widget & Emails language
- Booking option: Online bookings / Booking requests
- Applies to: All customers / Only existing customers
- Optional vs Required customer fields
- Select 3 top services *
- Online bookings interval
- Minimum gap between booking time & appointment start
- How far into the future customers can book
- Color / Schedule View (Week · Month and week)
- Google analytics id
- Share: link, button embed code, open widget code, button position

Preview pane: “SAVE CHANGES TO SEE HOW IT LOOKS”  
**Save not clicked.**

Related calendar settings control customer cancel/reschedule windows (**OBSERVED**).

## Priority

- Public widget UX: **P2** (architecture must allow later; AGENTS.md / Master Architecture).
- Online payments: **OUT OF SCOPE** V1.
- Internal booking remains P0.

Screenshot: `screenshots/online-booking-settings.png`
