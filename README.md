# SalonFlow

Internal booking desk for Jeannie Nagelstudio, Juliet – Salon de Beauté, and a future salon in Heide.

Staff book in the calendar. Customers book through a public link. Kundendialog drafts WhatsApp, Instagram, TikTok, and email replies for the owner to approve. Live sending and card payments stay off.

German UI (`de-DE`), `Europe/Berlin`, Monday-first weeks, EUR. Fictional customer data only.

The practical map of the running product is [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md). Product scope stays in [`docs/MASTER_ARCHITECTURE.md`](docs/MASTER_ARCHITECTURE.md). Contributor rules are in [`AGENTS.md`](AGENTS.md).

## Run locally

Node.js 22 and npm 10+.

```bash
npm ci
npm run db:prepare
npm run dev
```

If `db:prepare` stays open after printing the database URL, leave that terminal running and start `npm run dev` in another terminal.

- App: http://localhost:3000
- Dev login: `owner@salonflow.example` / `salonflow-dev`
- Database: PostgreSQL on `127.0.0.1:54329`, database `salonflow`

Copy [`.env.example`](.env.example) to `.env.local`. Do not commit `.env.local` or `.pgdata`.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run build
npm run test:e2e
```

GitHub Actions runs the same sequence on `main` and `feat/**`.

## Branches

- `main` is the default branch. Do not push to it directly.
- Feature work stays on `feat/…` and opens a pull request.
- Do not merge, and do not deploy to production, without Owner approval.
- Appointments are written only by `src/server/booking.ts` and the PostgreSQL constraints.
