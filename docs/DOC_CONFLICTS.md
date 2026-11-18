# Document conflicts — Master Architecture V2 wins

**Authority:** [`MASTER_ARCHITECTURE.md`](MASTER_ARCHITECTURE.md) (V2).  
Kit docs `01`–`10`, baselines, and `KIT_*` files are supporting detail. If they conflict with V2, follow this file.

| Topic | Kit / older claim | V2 / repo decision |
|---|---|---|
| Milestone IDs | Coarse `M0–M8` in `05_DELIVERY_PLAN.md` | Canonical **`M00–M19`** |
| NS tickets | `tasks/INITIAL_ISSUES.md` numbering | Keep NS-* IDs; map onto V2 milestones (see below) |
| ORM | Drizzle **or** Prisma | **Drizzle + explicit SQL** for GiST (ADR pending formal accept) |
| Auth in foundation | Kit M1 “auth skeleton” | Auth is **M05** after schema; no fake production auth in M01 |
| Calendar fixtures | ≥200 events (NS-003) | **≥250** events for M03 spike |
| ADR-001 | Kit: calendar library | V2 ADR-001 = modular monolith; calendar spike = **ADR-004** |
| Kit README | “No application code / CI” | Outdated — M01 app + CI exist on `feat/m01-repo-foundation` |
| Agent reading order | Start at `01_PRODUCT_CHARTER.md` | Start at **Master Architecture**, then `01`–`10` |
| Nav accent | Pink/coral in UI spec | Final tokens decided in **M02** UI review (M01 sage/slate is interim) |
| Guideline gates G00–G07 | Coarser than M00–M19; G01 says “login scaffold” in the shell | Keep **M00–M19**. Login is **M05**, not M01. Guideline behavior still applies. |
| Guideline nav includes Reports | Settings/reports screenshots show sales/VAT | V1 reports are appointment/utilization only. No POS/VAT. |
| Chores, buffers, rooms, recurrence, waitlist | Listed in SF-028–SF-037 and FLOW-03 tabs | **P1/later** unless Owner promotes. Booking engine must leave room for extra allocation kinds; do not build those UIs in the first slice. |
| “Four locations” example | Guideline cascade text | Product has **three** salons: Jeannie, Juliet, planned Heide. |

## NS → V2 milestone map

| Kit ticket | V2 |
|---|---|
| NS-001 | M00 |
| NS-002 | M01 |
| NS-003 | M03 |
| NS-004 | M02 (design acceptance) |
| NS-005 | M04 + M05 |
| NS-006 | M06 |
| NS-007 | M07 (+ M08 API pieces) |
| NS-008 | M08 + M09 |
| NS-009 | M10 (+ M11 pieces) |
| NS-010 | M13 |
| NS-011 | M15 |
| NS-012 | M16 |
| NS-013 | Later / P1 dashboard |
| NS-014 | M12 |
| NS-015 | M17 + M18 |
| NS-016 | Later planning only |

## Baseline docs

`BASELINE_BLUEPRINT.md`, `PHASE_A_REFERENCE.md`, and `MASTER_PROMPT_REFERENCE.md` are historical. Raise an ADR rather than silently preferring them over V2.
