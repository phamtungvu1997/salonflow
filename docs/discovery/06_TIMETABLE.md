# 06 — Timetable, working hours, absences

## TIM-001 Timetable

| Field | Value |
|---|---|
| Entry | Settings → Timetable → `/admin/roster` |

### Interaction (**OBSERVED**)

1. Week navigator (`Week 45`, `Nov 2 - Nov 8`, Today).
2. Company row **Jeannie Nagelstudio** with daily opening spans, e.g. weekdays ~`10:00–20:00`, Sat `10:00–18:00`, Sun `10:00–19:00` (as displayed).
3. Employee rows listed under timetable for the same week.

### Logic

| Topic | Evidence |
|---|---|
| Opening hours drive availability | **OBSERVED** correlation with calendar hatching + empty Sunday slots in Find availabilities |
| Inherited vs manual staff hours | **DOCUMENTED** S03 · per-cell edit UI **UNVERIFIED** (not edited) |
| Breaks as gaps | **DOCUMENTED** S04 · **UNVERIFIED** live create |

## TIM-002 Absences

| Field | Value |
|---|---|
| Entry | `/admin/absences` |

### Interaction (**OBSERVED**)

1. **Create new absence** (not submitted).
2. **National holidays** table (DESCRIPTION, DATE) — DE holidays listed.
3. **Unavailable days** table columns: DESCRIPTION · APPLIES TO · FROM · UNTIL (lists blocked intervals tied to staff/services).

Also: calendar create modal tab **Absence** (**OBSERVED**).

### Logic

| Topic | Evidence |
|---|---|
| Absences block booking | **DOCUMENTED** S05 · calendar “is absent / not available” blocks **OBSERVED** |
| Company vs employee scope | **DOCUMENTED** S05 · create form **UNVERIFIED** |
| Google Calendar sync | **DOCUMENTED** S29 — optional later |

## Engineering requirements (**PROPOSED**)

- Backend availability = salon hours ⊕ staff hours ⊖ breaks ⊖ absences (M06).
- Calendar must hatch unavailable regions from same source.
- Tests: SF-007–SF-012.
- Priority: **P0**.

## Evidence

- Live roster + absences 2026-11-08; no mutating clicks.
