# Salonflow

Internes Terminbuchungssystem für Jeannie Nagelstudio, Juliet – Salon de Beauté und einen geplanten Standort in Heide.

**Milestone M01:** technische Grundlage, App-Shell und Navigation.  
Es gibt **keine** funktionierende Terminpersistenz und **keine** Zahlungs-/POS-Module.

Governing docs:

- [`docs/MASTER_ARCHITECTURE.md`](docs/MASTER_ARCHITECTURE.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/feature-specs/SPEC-001-repository-foundation.md`](docs/feature-specs/SPEC-001-repository-foundation.md)

## Voraussetzungen

- Node.js **22 LTS** (oder kompatibel ≥ 20)
- npm **10+**

## Installation

```bash
git clone <repository-url> salonflow
cd salonflow
npm ci
```

Falls kein Lockfile-Checkout vorliegt:

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)  
Die Startseite leitet auf `/kalender` um.

### Routen (Deutsch)

| Pfad | Seite |
|---|---|
| `/kalender` | Kalender |
| `/kunden` | Kunden |
| `/mitarbeiter` | Mitarbeiter |
| `/leistungen` | Leistungen |
| `/einstellungen` | Einstellungen |
| `/spike/kalender` | M03 Kalender A/B Spike |
| `/spike/kalender/daypilot` | DayPilot Lite |
| `/spike/kalender/rbc` | React Big Calendar |
| `/spike/kalender/native` | Native Dense Baseline |

## Datenbank (M04+)

Schema: `src/db/schema`. Forward SQL: `src/db/migrations/0000_m04_foundation.sql`.

```bash
# Requires a local PostgreSQL and DATABASE_URL
psql "$DATABASE_URL" -f src/db/migrations/0000_m04_foundation.sql
# Rollback (destructive):
psql "$DATABASE_URL" -f src/db/migrations/0000_m04_foundation_down.sql
```

UI milestones do not require Postgres until booking APIs land.

## Qualitätssicherung

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Oder lokal denselben Ablauf wie CI:

```bash
npm run ci
```

Hinweise zu E2E:

- Playwright startet den Production-Server. Lokal wird vorher automatisch gebaut, wenn `CI` nicht gesetzt ist.
- In GitHub Actions läuft `npm run build` vor den E2E-Tests; der Server startet danach mit `npm run start`.

## Projektstruktur (Auszug)

```text
src/
  app/                 # Next.js App Router (deutsche Routen)
  components/layout/   # App-Shell, Sidebar
  components/ui/       # shadcn-basierte Primitive
  features/            # Feature-Module (Kalender, Fixtures, …)
  domain/              # Reine Domain-Helfer (locale, später Scheduling)
docs/                  # Architektur und Feature-Specs
e2e/                   # Playwright Smoke-Tests
.github/workflows/ci.yml
```

## Branch-Policy

- Feature-Arbeit auf Branches wie `feat/m01-repo-foundation`
- Kein Merge nach `main` und kein Production-Deploy ohne Owner-Freigabe
