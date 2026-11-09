# SalonFlow — macOS Development Handoff (`docs/DEV_HANDOFF.md`)

**Handoff Date:** 2026-11-09  
**Governing Spec:** [`docs/MASTER_ARCHITECTURE.md`](MASTER_ARCHITECTURE.md) (V2) & [`AGENTS.md`](../AGENTS.md)

---

## 1. Current Branch & Commit Lineage

- **Latest Working Branch (Active Head):** `feat/ns-015-appointment-interactions` (Code Milestone Commit: `6ebbd24`, Handoff Head: `HEAD`)
- **Repository Remote:** `https://github.com/phamtungvu1997/salonflow.git`
- **Branch Ancestry (Linear Chain — No Divergent Code on Sibling Feature Branches):**
  1. `main` (`8787fd9`) — Empty repository root
  2. `feat/m01-repo-foundation` (`9b92b70`) — M00/M01 architecture & documentation gates
  3. `feat/m02-m03-m04-slices` (`2018f67`) — M02 shell tokens, M04 Drizzle PostgreSQL schema, M03 calendar spike
  4. `feat/ns-017-booking-workflow` (`99e6fc2`) — **PR #1**: PostgreSQL booking engine (`resource_allocations_no_overlap`, advisory locks, snapshots, audit/outbox)
  5. `feat/branding-logo-integration` (`0698d31`) — **PR #3**: Approved SalonFlow branding, sidebar shell, login header, and favicons
  6. `feat/ns-008-appointment-modal` (`16c6fb1`) — Calendar Day/Week view, Customers directory & 3-column profile, and Settings workspace
  7. `feat/ns-014-marketing-module` (`76ed9f6`) — Marketing module (`Einblicke`, `Warteliste`, `Rabatte`, `Dynamische Preisgestaltung`, `E-Mail`, `Filter`, `Wiederbuchungserinnerung`) + auto-initialized dev session
  8. **`feat/ns-015-appointment-interactions` (Current Head)** — Video-derived Calendar/Appointment interactions (`AppointmentDetailPopover`, `AppointmentViewModal`, inline service/duration/staff editing, stacked `EditCustomerInlineModal`), unified cross-module Services catalog (`service-catalog-sync.ts`), consolidated sidebar navigation, absence window enforcement in `src/server/booking.ts`, and 16-step end-to-end verification suite (`e2e/core-integration-milestone.spec.ts`).

> **Note:** Sibling branch `design/ui-concepts` (`e333230`, PR #2) is a standalone static design-concept preview branch retained for historical UI reference only (`UI-07` Owner decision) and is intentionally not part of the product branch lineage.

---

## 2. Completed Features (Verified End-to-End Against PostgreSQL)

1. **PostgreSQL Booking Engine (`src/server/booking.ts`)**
   - `createAppointment`, `rescheduleAppointment`, `cancelAppointment`, and `markAppointmentNoShow`.
   - Enforces PostgreSQL `resource_allocations_no_overlap` GiST exclusion constraint (`HTTP 409` on overlap).
   - Enforces transaction-scoped `pg_advisory_xact_lock` idempotency keys and optimistic `expectedVersion` concurrency checks.
   - Enforces weekly shift hours (`weekly_shifts`) and employee absence intervals (`absences`, `HTTP 422 code: "absent"`).
   - Enforces salon service activation (`salon_services.active = true`) and employee service eligibility (`staff_services`).
   - Writes immutable historical snapshots (`title_snapshot`, `duration_minutes_snapshot`, `price_cents_snapshot` in `appointment_services`) so later service price/duration updates in Settings never alter existing bookings.
   - Distinguishes `no_show` (`status = 'no_show'`, allocation stays `active = true` blocking the slot) from `cancelled` (`status = 'cancelled'`, allocation becomes `active = false` releasing the slot).

2. **Calendar & Appointment Workflows (`src/features/calendar/*`, `/kalender`)**
   - Multi-column employee Day View (`Tag`) and 7-day Week View (`Woche`), ISO `KW` week badge, multi-week forward jump (`1–10 Wochen`), employee filter (`Im Dienst` / `Mit Terminen`), hatched non-working hours & absence blocks.
   - `AppointmentModal` with 4 tabs (`Termin`, `Abwesenheit`, `Aufgabe`, `Notiz`), categorized searchable service selector with category color badges/durations/prices, customer lookup + inline customer creation, and `Verfügbarkeiten finden` slot helper.
   - Floating `AppointmentDetailPopover` on card click with status pill, `Kommentar zum Termin hinzufügen`, `Wiederholen`, and `Mehr` action menu (`Termin-Details & Verlauf`, `Verschieben`, `Kopieren`, `Als Nicht erschienen markieren`, `Stornieren`).
   - Full two-column `AppointmentViewModal` (`Termin`) displaying customer details, appointment service snapshot rows, chronological audit trail (`Verlauf`), and vertical action list.
   - `Termin bearbeiten` mode with inline service/duration/employee editors, customer `...` context menu (`Bearbeiten` / `Auswahl aufheben`), and stacked secondary `Kundin bearbeiten` (`EditCustomerInlineModal`) dialog with proper `Escape` key layering (topmost modal closes first).

3. **Customers & Customer History (`src/features/customers/*`, `/kunden`)**
   - Searchable customer directory, 2-pane attribute filter (`Kundengruppe`, `Termine`, `Marketing-E-Mails`, `Erstellt`), `Kundengruppen` segmentation view, and `Kundin erstellen/bearbeiten` modal.
   - 3-column `CustomerProfileView` displaying live PostgreSQL KPIs (`Termine`, `Stornierungen`, `Nicht erschienen`, `Gesamtumsatz`), chronological `Verlauf` feed, `Termine` booking table, and direct `Termin erstellen` button pre-populated with the customer.

4. **Shared Service Catalog & Settings Workspace (`src/features/settings/*`, `/einstellungen`)**
   - Consolidated left sidebar (`Übersicht`, `Kalender`, `Kunden`, `Marketing`, `Einstellungen`); `/mitarbeiter` and `/leistungen` redirect cleanly into `/einstellungen?section=employees` and `/einstellungen?section=services`.
   - `Einstellungen > Leistungen`: Category accordions with color swatches & live appointment card preview, 2-column Service Editor (`Leistung erstellen/bearbeiten`), `Paket (NEU)` modal, bulk `Preise aktualisieren`, soft-deactivation (`Leistung deaktivieren`), and live cross-tab synchronization via `src/features/services/service-catalog-sync.ts`.
   - `Einstellungen > Mitarbeiter` & `Arbeitszeiten`: Employee directory, calendar color swatches, per-category service eligibility toggles, and 7-day weekly shift grid (`PUT /api/staff/[id]/hours`).
   - Additional Settings modules: `Allgemeine Einstellungen`, `Datenexport`, `Benutzerkonten` + `Aktivitätsprotokoll`, `Unternehmensdaten`, `Abwesenheiten` (holidays + staff absences with conflict checking), `Ressourcen`, `Kalendereinstellungen`, `Online-Buchungen`, and `Kundeneinstellungen`.

5. **Marketing Workspace (`src/features/marketing/*`, `/marketing`)**
   - `Einblicke`, `Warteliste`, `Rabatte` (`Last-Minute-Rabatt`, `Dynamische Preisgestaltung` calendar overlay, `Rabattcodes` linked to shared service catalog), `E-Mail`, `Filter`, and `Wiederbuchungserinnerung`.

---

## 3. In-Progress Work & Active Pull Requests

### In-Progress Work
- **Core Integration & Stabilization Milestone (`feat/ns-015-appointment-interactions`)**: Implementation and all automated quality gates are **100% complete and committed**. Currently awaiting **Product Owner Gate D sign-off** before opening/updating the consolidated PR or merging prior milestone PRs into `main`.

### Active Pull Requests on GitHub
| PR | Title | Branch | Status | CI Check |
|---|---|---|---|---|
| [#1](https://github.com/phamtungvu1997/salonflow/pull/1) | `NS-017: PostgreSQL booking engine` | `feat/ns-017-booking-workflow` | `OPEN` | Green (`42498569035`) |
| [#2](https://github.com/phamtungvu1997/salonflow/pull/2) | `UI preview: reception calendar concepts` | `design/ui-concepts` | `OPEN` (Reference Only per `UI-07`) | Green |
| [#3](https://github.com/phamtungvu1997/salonflow/pull/3) | `Brand: integrate SalonFlow logo into shell and login` | `feat/branding-logo-integration` | `OPEN` | Green (`42500217654`) |

*(All intermediate branches `feat/ns-008-appointment-modal`, `feat/ns-014-marketing-module`, and `feat/ns-015-appointment-interactions` are pushed to `origin`.)*

---

## 4. Quality Gates & Known Failing Tests

- **Known Failing Tests:** **`0` (None)**
- Latest verified test run on `feat/ns-015-appointment-interactions`:
  - `npm run typecheck`: **PASS** (`0 errors`)
  - `npm run lint`: **PASS** (`No ESLint warnings or errors`)
  - `npm test` (Vitest unit tests): **PASS** (`6 files, 10/10 passed`)
  - `npm run test:integration` (PostgreSQL integration suite `IT-01`–`IT-10`): **PASS** (`10/10 passed`)
  - `npx playwright test --workers=1` (Full Playwright E2E regression suite): **PASS** (`19/19 passed` across all 10 spec files, including `e2e/core-integration-milestone.spec.ts`)

---

## 5. Exact Next Development Task (On Your Mac)

1. **Inspect & Approve the Integrated Local Preview (`GATE D`)** on `feat/ns-015-appointment-interactions` at `http://localhost:3000/kalender`.
2. **Upon Product Owner Approval:**
   - Open a Pull Request for `feat/ns-015-appointment-interactions` (or merge approved foundational PRs #1 and #3 into `main` in order, then fast-forward/merge `feat/ns-015-appointment-interactions`).
3. **Next Feature Milestone After Stabilization Merge:**
   - Proceed to the next Owner-prioritized V1 operational enhancement (e.g., Drag-and-Drop calendar card rescheduling with snap preview wired to `PATCH /api/appointments/[id]`, or Waiting List → Appointment conversion workflow).

---

## 6. Local Setup Instructions for macOS

SalonFlow uses `embedded-postgres`, which automatically downloads and manages a local PostgreSQL 18 cluster in `.pgdata/` on port `54329`—**no Docker or Homebrew PostgreSQL setup is required**.

### Step-by-Step Commands on macOS (Terminal)

```bash
# 1. Clone the repository and check out the latest working branch
git clone https://github.com/phamtungvu1997/salonflow.git
cd salonflow
git checkout feat/ns-015-appointment-interactions

# 2. Ensure Node.js 20+ is active, then install dependencies
npm install

# 3. Create your local environment file from the template
cp .env.example .env.local

# 4. Initialize embedded PostgreSQL (.pgdata on port 54329), run migrations, and seed fictional data
npm run db:prepare

# 5. (Optional) Install Playwright Chromium browser for E2E tests
npx playwright install chromium

# 6. Start the Next.js development server
npm run dev
```

### Accessing the Application on macOS
- Open **[http://localhost:3000/kalender](http://localhost:3000/kalender)** in your browser.
- In development mode (`NODE_ENV !== "production"`), visiting `/kalender` automatically initializes an authenticated Owner session defaulted to **Jeannie Nagelstudio** (`salon_jeannie`).
- Manual login credentials at [http://localhost:3000/anmelden](http://localhost:3000/anmelden):
  - **Owner (Jeannie + Juliet)**: `owner@salonflow.example` / `salonflow-dev`
  - **Receptionist (Jeannie only)**: `empfang.jeannie@salonflow.example` / `salonflow-dev`

### Keeping Embedded PostgreSQL Running Across Restarts
- `npm run db:prepare` or `npm run test:integration` automatically starts the persistent embedded PostgreSQL cluster in `.pgdata/` on `127.0.0.1:54329`.
- Whenever you reboot your Mac, simply run `npm run db:prepare` before `npm run dev` to ensure the embedded PostgreSQL daemon is up and seeded.

---

## 7. Local Files Excluded from GitHub & How to Transfer Them Securely

Per our strict privacy and security rules (`AGENTS.md`), the following local files on your Windows machine are **gitignored** and **never pushed to GitHub**:

| Local Path on Windows | Purpose | Need to Transfer to Mac? | How to Recreate or Transfer Safely |
|---|---|---|---|
| `.env.local` | Local PostgreSQL connection string (`DATABASE_URL=postgres://postgres:password@127.0.0.1:54329/salonflow`) | **No transfer needed** | Recreate on Mac via `cp .env.example .env.local`. |
| `.pgdata/` | Windows x64 binary data directory for `embedded-postgres` | **Do NOT copy across OS** (OS-specific Postgres cluster files) | Recreate cleanly on macOS via `npm run db:prepare`. |
| `artifacts/` | Playwright verification screenshots generated by E2E tests | **No transfer needed** | Regenerate anytime on Mac via `npx playwright test`. |
| `docs/references/salonized/*.png` & `docs/discovery/screenshots/*.png` | Raw Salonized reference screenshots (some containing unredacted customer PII) | **Optional (Private local reference only)** | If wanted on your Mac for visual reference, transfer strictly via encrypted personal storage (e.g., USB drive, AirDrop/iCloud Private Drive, or 1Password vault) — **never via Git**. |
| `C:\Users\vupham\Desktop\salonized *.mp4` (outside repo on Windows Desktop) | Raw Salonized reference screen-recording videos (`salonized interaction.mp4`, `salonized services dependencies 1.mp4`, etc.) | **Optional (Private local reference only)** | Transfer directly between your personal devices via encrypted USB or private cloud storage outside the Git repository. |
