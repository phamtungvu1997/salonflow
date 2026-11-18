# SalonFlow project guide

Practical map of the running product. Product scope and milestones stay in [`MASTER_ARCHITECTURE.md`](MASTER_ARCHITECTURE.md). When documents disagree, [`DOC_CONFLICTS.md`](DOC_CONFLICTS.md) applies and Master Architecture V2 wins.

## What this is

SalonFlow is the internal booking desk for Jeannie, Juliet, and a future Heide salon. Staff book in the calendar. Customers can book through a public link. An AI receptionist drafts answers for WhatsApp, Instagram, TikTok, and email. The owner sees those chats in one inbox.

German is the staff and customer language. Times are Europe/Berlin. Money is EUR. Weeks start on Monday.

## Run it locally

```bash
npm install
npm run db:prepare
npm run dev
```

If `db:prepare` stays open after printing the database URL, leave that terminal running and start `npm run dev` in a second terminal.

- App: http://localhost:3000
- Dev login: `owner@salonflow.example` / `salonflow-dev`
- Database: PostgreSQL on `127.0.0.1:54329`, named `salonflow` (see `.env.local`)

Do not copy `.pgdata` between computers. Each machine creates its own database.

## The booking rule

`src/server/booking.ts` and PostgreSQL are the only place that creates, moves, or cancels an appointment and its resource allocation. The calendar, the public link, the AI receptionist, and marketing never decide that a slot is free by themselves. They ask the engine.

A saved appointment keeps the service name, duration, and price from that moment (`price_cents_snapshot`). Later catalog or discount changes do not rewrite old appointments.

## Staff desk

| Area | Route | What it does |
|---|---|---|
| Calendar | `/kalender` | Day and week grid, create and cancel appointments, absences in the staff column |
| Customers | `/kunden` | Directory and profile. Removing a customer archives them |
| Settings | `/einstellungen` | Services, staff, hours, holidays, rooms, online booking, accounts, software billing |
| Marketing | `/marketing` | Last-minute discount, dynamic price windows, discount codes, waiting list |
| Kundendialog | `/ki-rezeption` | Owner dashboard for chats, approvals, nail photos, and complaints |
| Public booking | `/b/{token}` | Customer link. Embed form is `/embed/{token}` |

Holidays for Hamburg are prefilled under **Einstellungen → Abwesenheiten**. A locked holiday writes one absence per active staff member from 08:00 to 20:00, so the calendar and the engine both close that day. Uncheck **Sperren** or delete the row to open it again.

**Einstellungen → Ressourcen** manages cabins, chairs, and devices. Staff columns stay on the calendar. Picking a resource on an internal appointment blocks that resource for the same time.

## Prices

The catalog price lives on `salon_services.price_cents`. Marketing does not change that number.

For a **new online booking**, the charged snapshot is calculated in this order:

1. Catalog price.
2. If dynamic pricing is on and the start time falls inside a `price_change_rules` window, apply that discount or increase.
3. Otherwise, if last-minute is on and the start is within the configured hours, apply the last-minute percent.
4. If the customer entered a valid discount code, apply that percent after the step above.

A code is valid when it is enabled, the date is on or after `valid_from`, a 1-month or 3-month expiry has not passed, and a one-use limit has not already been consumed. The code’s use count increases when the online appointment is written. Invalid codes are rejected. The appointment note lists the labels, for example `Last-Minute −15%`.

Internal calendar bookings keep the catalog price unless the server passes an explicit override. The public form is the place that sends a code.

Waiting-list rows do not reserve a chair and do not change a price.

## Small widgets

These settings used to be closed. They now read and write the salon’s own data.

- **MwSt.-Sätze** stores the rates. The default rate is the one a receipt uses.
- **Treuepunkte** adds a point when an appointment is marked completed, or one point per configured euro of the stored price. Points are kept per customer and are not a payment.
- **Rechnungen & Belege** stores the header, footer, and whether the date is shown. The footer states that payment happens in the salon.
- **Mikroseite** at `/widget/seite/{salonId}` shows the saved title, text, and contact email.
- **Preislisten-Widget** at `/widget/preise/{salonId}` lists active services with duration and catalog price. The settings page gives the iframe size and a copyable snippet.
- **Bewertungs-Widget** at `/widget/feedback/{salonId}` stores a 1–5 rating and a comment for that salon.
- **Gutschein-Widget** at `/widget/gutschein/{salonId}` stores a request. No amount is charged and no voucher email is sent.

## Software billing

**Einstellungen → Abrechnung** is the salon’s own SalonFlow subscription, not a customer checkout and not card charging.

The Studio plan is 59,00 €. Two active staff seats are included. Each further active staff member adds 5,00 € for that month. The page creates the current month’s invoice, marks it overdue after the 10th, and lists paid invoices after **Zahlung vermerken**. **PDF** opens a transfer note with the invoice number as the reference. **Merken** stores automatic payment as a preference only. No bank or card is debited.

## Online booking settings

**Einstellungen → Online-Buchungen** controls the public link: language, direct booking versus request, existing customers only, staff choice, top services, interval, notice, how far ahead, gap avoidance, address and birth date, color, and the share link or embed code.

**Freigeben** on a booking request creates the appointment through the engine and applies the current last-minute or dynamic window. Card payment stays off.

## Kundendialog

The section is named **Kundendialog** and lives at `/ki-rezeption`. The first screen is an owner dashboard: conversations by channel, open hints, recent dialogs, and bookings waiting for approval. **Neues Gespräch** opens the chat. Live WhatsApp, Instagram, and TikTok sending stays off until those flags are explicitly enabled.

- **Chat starten** opens a direct conversation.
- **Kommentar unter einem Beitrag** (Instagram or TikTok) drafts one private reply with a price from the catalog and the booking link. Nothing is posted.
- **E-Mail lesen** matches the From address to a customer of this salon and treats the text like a chat message.
- A booking is stored only after **Freigeben und buchen**.

The dashboard sorts work into three queues. A nail photo waits until you enter a price; **Angebot senden** writes that price back into the same WhatsApp, Instagram, TikTok, or email thread, with the booking link. A complaint offers Entschuldigung, a new appointment, 10 € goodwill, or a callback, and that choice is the reply in the same channel. Nothing is sent to a live account. The agent still does not invent a price from the photo.

## Checks

```bash
npm run test
npm run typecheck
```

`npm run test` is the unit suite. Integration tests need the local database (`npm run test:integration`).
