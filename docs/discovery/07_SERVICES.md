# 07 — Services, categories, resources & eligibility

## SVC-001 Service catalog admin

| Field | Value |
|---|---|
| Entry | Settings → Services → `/admin/services` |

### Interaction (**OBSERVED**)

1. Actions: **Update prices**, **Create new** → Service | Package, **Add category** / Create category.
2. Category filters visible (e.g. Maniküre and others).
3. Booking dropdown categories (**OBSERVED** in create appointment): Maniküre, Pediküre, Gel/Acryl/BIAB/Gel-X lines, Shellac, Pflege, Entfernung, Design, Azubis, etc.
4. Options show name + € price; selecting sets duration.

## SVC-002 Resources

| Field | Value |
|---|---|
| Entry | `/admin/resources` |

### Interaction (**OBSERVED**)

- **New resource** / Create a resource.
- Active tools list present.
- Resource scheduling details **UNVERIFIED** (form not completed) · **DOCUMENTED** S15.

## Functional logic

| Topic | Evidence |
|---|---|
| Categories group services | **OBSERVED** |
| Duration/price drive booking form | **OBSERVED** |
| Historical snapshot on edit | **DOCUMENTED** S13/S14 · **PROPOSED** SF-016 |
| Staff eligibility | **DOCUMENTED** S01/S13 · **PROPOSED** SF-017 · picker filtering **UNVERIFIED** |
| Packages | Create Package action **OBSERVED** · booking package UX **UNVERIFIED** |
| Buffer time | Calendar setting **OBSERVED** · **DOCUMENTED** S14 |

## Engineering requirements (**PROPOSED**)

- Frontend: Leistungen admin German.
- Backend: categories, services, durations, prices, eligibility, optional resources (M04/M14).
- Tests: SF-015–SF-017, SF-021 multi-service.
- Priority: **P0** catalog; resources **P1**.

## Evidence

- Live services + resources + booking dropdown 2026-11-08.
