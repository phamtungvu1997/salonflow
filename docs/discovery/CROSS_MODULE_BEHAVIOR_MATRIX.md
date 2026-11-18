# Cross-module behavior matrix (discovery traceability)

> **Not a parallel source of truth.** This file traces Salonized discovery → existing **SF-001–SF-048** and **IT-01–IT-16**.  
> Master Architecture V2 + `DOC_CONFLICTS.md` + `AGENTS.md` govern implementation.  
> This file does **not** mint new SF-* IDs and must not soften Architecture Flows A–E.

Discovery rows use **X##** IDs only for traceability.

Evidence: **OBSERVED** · **DOCUMENTED** · **PROPOSED** · **UNVERIFIED**  
Priority tags on rows: **P0** / **P1** / **P2** / **OUT** (per Master Architecture + DOC_CONFLICTS).

---

## Contract field legend

| Field | Meaning |
|---|---|
| Preconditions | What must already exist |
| Source module | Where the action is initiated |
| Affected modules | Downstream consumers |
| Expected state changes | Authoritative data changes |
| UI updates | What screens must refresh |
| Backend checks | Booking Engine / domain validations |
| Permissions | Who may act / observe |
| Failure behavior | Partial-failure & conflict handling |
| Consistency / concurrency | Multi-user rules |
| SF / IT | Existing requirement & test IDs |

---

## X01 — Create bookable employee

| Field | Content |
|---|---|
| Trigger | Admin saves new employee |
| Preconditions | Authorized manager; salon exists |
| Source | Employees admin |
| Affected | Timetable, Calendar columns, Appointment employee picker, Assignments |
| Expected state | Staff row + optional assignment + stable resource id; **no** appointment invented |
| UI updates | Employee list; calendar header when assigned; picker options |
| Backend checks | Validation; transactional assignment create |
| Permissions | Manager/admin for salon |
| Failure | No partial assignment |
| Consistency | Single staff identity across locations |
| SF / IT | **SF-001**, SF-005 · **IT-01** |
| Evidence | **DOCUMENTED** S01 · employee list/picker **OBSERVED** |
| Screenshots/docs | `05_EMPLOYEES.md` |

## X02 — Create login-only user

| Field | Content |
|---|---|
| Trigger | Add user account |
| Preconditions | Admin auth |
| Source | User accounts |
| Affected | AuthN only |
| Expected state | User can login; **not** a calendar resource |
| UI updates | Accounts list; activity log |
| Backend checks | No auto `staff` link |
| Permissions | Admin |
| Failure | No staff side-effect |
| Consistency | SF-002 invariant |
| SF / IT | **SF-002** · **IT-02** |
| Evidence | **DOCUMENTED** S02 · roles Full access / Calendar view **OBSERVED** |

## X03 — Change working hours / opening hours · **P0**

| Field | Content |
|---|---|
| Trigger | Edit timetable / salon hours |
| Preconditions | Staff/salon exist |
| Source | Timetable / Company → scheduling domain (same locks as bookings) |
| Affected | Availability, Calendar hatching, Find availabilities, Booking Engine validation |
| Expected state | **Architecture Flow D:** identify invalidated future appointments; require explicit policy/resolution **before** schedule change commits; never silently delete appointments |
| UI updates | Conflict resolution list; then hatch regions / slot search |
| Backend checks | Reject new bookings outside effective hours; share exclusive locks with booking writes |
| Permissions | Manager |
| Failure | No hours commit while unresolved futures (unless Owner-approved override policy) |
| Consistency | Derived availability single source |
| SF / IT | **SF-007**, SF-008, SF-009, **SF-046** · *(IT-04 is breaks only — do not treat as hours-change test)* |
| Evidence | Roster hours **OBSERVED**; Sunday no slots **OBSERVED**; commit-gate UX **UNVERIFIED** live · behavior **PROPOSED** per Master Architecture Flow D |

## X04 — Create absence · **P0**

| Field | Content |
|---|---|
| Trigger | Create absence (admin or calendar Absence tab) |
| Preconditions | Target employee/company/resource |
| Source | Absences / Calendar → scheduling domain (allocation writes only via booking/scheduling writer) |
| Affected | Calendar blocks, Availability, conflict lists |
| Expected state | Overlaps surfaced; appointments **retained**; absence commits only under Flow D policy; any `resource_allocations` for blocks written by scheduling domain — not ad-hoc admin INSERT |
| UI updates | Conflict list then blocked regions |
| Backend checks | Scope (employee vs company vs resource — SF-012); overlap detection; same locks as bookings |
| Permissions | Manager (self-absence **UNVERIFIED**) |
| Failure | Unauthorized → no absence; unresolved futures → no silent commit |
| Consistency | Absence ≠ chore metrics |
| SF / IT | **SF-011**, **SF-046** · **IT-12** (employee absence+conflict). SF-012 company/resource scope needs separate coverage (**PROPOSED** IT-19) |
| Evidence | Absences + calendar “not available” **OBSERVED** · **DOCUMENTED** S05 · create submit / conflict gate **UNVERIFIED** |

## X05 — Create / activate service

| Field | Content |
|---|---|
| Trigger | Add category/service |
| Preconditions | Admin auth |
| Source | Services admin |
| Affected | Appointment service dropdown, colors, qualifications |
| Expected state | Catalog row active |
| UI updates | Booking search lists service |
| Backend checks | Duration/price required per product rules |
| Permissions | Manager |
| Failure | No orphan category link |
| SF / IT | **SF-015** |
| Evidence | Services admin + dropdown categories **OBSERVED** · **DOCUMENTED** S13 |

## X06 — Edit service duration / price

| Field | Content |
|---|---|
| Trigger | Save service edits |
| Preconditions | Service exists; may have past appointments |
| Source | Services |
| Affected | Future booking defaults only; historical snapshots unchanged |
| Expected state | Catalog updated; appointment line snapshots immutable |
| UI updates | New creates show new duration/price |
| Backend checks | Snapshot isolation |
| Permissions | Manager |
| Failure | Reject invalid duration |
| SF / IT | **SF-016** · **IT-05** |
| Evidence | Duration auto-update on select **OBSERVED**; catalog edit submit **UNVERIFIED** · **DOCUMENTED**/ **PROPOSED** snapshot |

## X07 — Create customer

| Field | Content |
|---|---|
| Trigger | Customers → Create or in-booking add |
| Preconditions | AuthZ |
| Source | Customers / Booking sheet |
| Affected | Search index; optional booking link after commit |
| Expected state | Customer row; linked only when booking commits |
| UI updates | List/search; booking customer rail |
| Backend checks | Required fields; no booking write from customer module |
| Permissions | Reception/manager |
| Failure | Booking without linked customer if create rolled back |
| SF / IT | **SF-020** · **IT-10** |
| Evidence | 2026-11-08: `/customers/new` fields and empty-save required message **OBSERVED**; successful submit **UNVERIFIED**. See `04_CUSTOMERS.md` |

## X08 — Create appointment (Booking Engine) · **P0**

| Field | Content |
|---|---|
| Trigger | Save Create appointment |
| Preconditions | AuthZ; staff; service; time; hours allow; no conflicting allocation; walk-in may omit customer |
| Source | Calendar create sheet (UI) → **Booking Engine** |
| Affected | Allocations, Calendar, Dashboard, Messages outbox, Reports counts, Activity log |
| Expected state | Appointment + service snapshots + active allocations + audit **atomic** |
| UI updates | Card in column; dashboard; authorized peers via SF-038 |
| Backend checks | Auth, salon scope, hours, absences, eligibility, resources, idempotency |
| Permissions | Roles with booking write; salon-scoped |
| Failure | 409/validation; **full rollback**; form retained; no message send |
| Consistency / concurrency | Exactly-one winner on conflict; idempotent retry |
| SF / IT | **SF-018**, **SF-021**, **SF-022**, **SF-023**, **SF-047** · **IT-06**, **IT-09** |
| Evidence | Create UI + availabilities **OBSERVED**; save **not** executed · confirmations in message log **OBSERVED** |
| Screenshots | `screenshots/appointment-create-schema.svg` · `01_CREATE_APPOINTMENT.md` |

## X09 — Edit / move / reschedule appointment · **P0**

| Field | Content |
|---|---|
| Trigger | Edit Save / Move / drag |
| Preconditions | Appointment exists; `expectedVersion` |
| Source | Appointment detail/edit → Booking Engine |
| Affected | Allocations, Calendar, History, Notifications (if policy), peers |
| Expected state | Version++; reallocations replaced atomically |
| UI updates | Card moves; on 409 revert |
| Backend checks | Full revalidation as create |
| Permissions | Booking writers; scoped |
| Failure | 409 stale/conflict; UI restore |
| SF / IT | **SF-024**, **SF-048**, SF-038 · **IT-08**, **IT-11** |
| Evidence | Detail actions Edit/Move + edit sheet **OBSERVED**; drag/save **UNVERIFIED** |

## X10 — Cancel appointment · **P0**

| Field | Content |
|---|---|
| Trigger | Cancel/Delete action (SalonFlow: soft-cancel; optional cancel reason per Architecture Flow C) |
| Preconditions | Active appointment |
| Source | Detail → Booking Engine |
| Affected | Allocations freed; Calendar; Dashboard; optional notifications |
| Expected state | Status cancelled; audit kept; slot reusable |
| UI updates | Card removed/styled cancelled; counts refresh |
| Backend checks | Auth; version |
| Permissions | Authorized roles |
| Failure | No partial free without status |
| SF / IT | **SF-025** · **IT-07** |
| Evidence | Delete action visible **OBSERVED**; not clicked · **PROPOSED** soft-cancel vs hard delete |

## X11 — Mark no-show · **P0**

| Field | Content |
|---|---|
| Trigger | Mark as no show |
| Preconditions | Appointment in allowable status |
| Source | Detail → **Booking Engine** status command |
| Affected | Status history; customer indicators; optional email prompt per calendar settings |
| Expected state | **Architecture Flow C:** status → no-show; **retain historical resource occupancy** unless manager runs an audited correction workflow that explicitly releases allocations |
| UI updates | Status label; occupancy still shown as historical unless corrected |
| Backend checks | Transition table SF-026/027; no silent free-on-no-show |
| Permissions | Authorized |
| Failure | Invalid transition rejected |
| SF / IT | **SF-026**, **SF-027** · (**PROPOSED** IT-22 for status+occupancy assert) |
| Evidence | Action + settings prompt **OBSERVED**; execution **UNVERIFIED**; occupancy rule **PROPOSED** from Master Architecture (not OBSERVED Salonized) |

## X12 — Waiting list entry / convert · **P2** (Architecture; DOC_CONFLICTS P1/later — Owner may promote)

| Field | Content |
|---|---|
| Trigger | Add waitlist / convert to booking |
| Preconditions | Entry exists for convert |
| Source | Marketing waiting list / calendar chips |
| Affected | Waitlist store; on convert → Booking Engine → Calendar |
| Expected state | Convert success archives entry; **failure keeps entry** |
| UI updates | Chip counts; waitlist table |
| Backend checks | Convert = normal booking validations |
| Permissions | Staff; messaging may need extra auth |
| Failure | No orphan booking; no lost waitlist on 409 |
| SF / IT | **SF-037** |
| Evidence | Page/chips **OBSERVED**; convert/notify **UNVERIFIED** |

## X13 — Online booking settings change · **P2**

| Field | Content |
|---|---|
| Trigger | Save online bookings admin |
| Preconditions | Admin |
| Source | Online bookings settings |
| Affected | Public widget rules; still **not** bypassing Engine on commit |
| Expected state | Config only |
| UI updates | Widget preview after save (Salonized) |
| Backend checks | Lead times applied at public create path |
| Permissions | Admin |
| Failure | No save → no preview (Salonized copy **OBSERVED**) |
| SF / IT | Supports later public channel; payments **OUT** |
| Evidence | Settings **OBSERVED**; Save not clicked · **DOCUMENTED** S24 |
| Screenshots | `screenshots/online-booking-settings.png` |

## X14 — Calendar slot interval / color mode

| Field | Content |
|---|---|
| Trigger | Save calendar settings |
| Preconditions | Admin |
| Source | Calendar settings |
| Affected | Grid display only |
| Expected state | Preference changed; **appointment timestamps unchanged** |
| UI updates | Calendar grid |
| Backend checks | No rewrite of `start_at`/`end_at` |
| SF / IT | **SF-030**, SF-031 · **IT-13** |
| Evidence | 15 mins / per category **OBSERVED** · **DOCUMENTED** S08 |
| Screenshots | `screenshots/calendar-settings.png` |

## X15 — Multi-salon staff assignment

| Field | Content |
|---|---|
| Trigger | Assign employee to second salon |
| Preconditions | Multi-location account |
| Source | Employees |
| Affected | Both calendars; Booking Engine exclusivity |
| Expected state | One staff id; assignments N; **no overlapping allocations** across salons |
| UI updates | Staff appears in assigned calendars only |
| Backend checks | Cross-salon exclusion in create/move |
| SF / IT | **SF-013** · **IT-03** |
| Evidence | **DOCUMENTED** S06 · **UNVERIFIED** in this single-location exploration |

## X16 — Resource requirement on service · **P2**

| Field | Content |
|---|---|
| Trigger | Attach room/tool to service / book service |
| Preconditions | Resource exists |
| Source | Resources + Services → Engine |
| Affected | Allocations for staff **and** resource |
| Expected state | Dual exclusive allocation |
| SF / IT | **SF-034** (later) |
| Evidence | Resources admin **OBSERVED** · wiring **UNVERIFIED** · **DOCUMENTED** S15 |

## X17 — Reminder / confirmation messaging

| Field | Content |
|---|---|
| Trigger | Booking commit + reminder schedule settings |
| Preconditions | Notification enabled; customer contact may be required |
| Source | Booking Engine outbox ← Calendar settings |
| Affected | Messages log |
| Expected state | Outbox rows **after** commit only; idempotent. Salonized SMS-credit billing is **OUT** of SalonFlow V1 (observation only). |
| Failure | No send on rollback |
| SF / IT | **SF-043** · (**PROPOSED** IT-23) |
| Evidence | Reminder settings **OBSERVED**; message log types **OBSERVED**; send path **UNVERIFIED** · Priority **P1/P2** per Owner launch decision |

## X18 — Data export

| Field | Content |
|---|---|
| Trigger | Export appointments |
| Preconditions | Permission |
| Source | Data export |
| Affected | Download file only (no booking mutation) |
| Expected state | File generated |
| Permissions | Admin; salon scope |
| SF / IT | Supports **SF-040** import prep · **IT-14** import |
| Evidence | Form **OBSERVED**; export not run |
| Screenshots | `screenshots/data-export.png` |

## X19 — Employee name/color change

| Field | Content |
|---|---|
| Trigger | Update employee display fields |
| Affected | Calendar headers/cards |
| Expected state | Display only; appointment ids unchanged |
| SF / IT | **SF-003** |
| Evidence | **DOCUMENTED** S01 · live edit **UNVERIFIED** |

## X20 — Employee deactivate / remove from salon

| Field | Content |
|---|---|
| Trigger | Deactivate or remove assignment |
| Affected | Availability, pickers, future appointment conflict UI |
| Expected state | No new bookings; enumerate futures; history kept |
| SF / IT | **SF-004**, **SF-006** |
| Evidence | **PROPOSED** (stricter than possible source) · Salonized exact UX **UNVERIFIED** |

## X21 — Qualification change

| Field | Content |
|---|---|
| Trigger | Edit staff↔service eligibility |
| Affected | Booking employee candidates |
| Expected state | Immediate filter |
| SF / IT | **SF-017** |
| Evidence | **DOCUMENTED** · live filter **UNVERIFIED** |

## X22 — Breaks in timetable

| Field | Content |
|---|---|
| Trigger | Split shift / add break |
| Affected | Availability gap |
| Expected state | Cannot book into break |
| SF / IT | **SF-010** · **IT-04** |
| Evidence | **DOCUMENTED** S04 · UI **UNVERIFIED** |

## X23 — Multi-service booking lines

| Field | Content |
|---|---|
| Trigger | + Add another service then save |
| Affected | Multiple snapshots/allocations; duration sum |
| SF / IT | **SF-021** · IT-05 related |
| Evidence | UI affordance **OBSERVED**; save **UNVERIFIED** |

## X24 — Chore / note calendar events

| Field | Content |
|---|---|
| Trigger | Create Chore or Note tab event |
| Affected | Calendar; chores block booking & count as work; notes default non-blocking |
| SF / IT | **SF-028**, **SF-029** |
| Evidence | Tabs **OBSERVED**; forms **UNVERIFIED** · **DOCUMENTED** S21 |

## X25 — Recurring appointments

| Field | Content |
|---|---|
| Trigger | Repeat toggle + save series |
| Affected | Multiple occurrences; conflict preview |
| SF / IT | **SF-032**, **SF-033** |
| Evidence | Toggle **OBSERVED**; series editor **UNVERIFIED** · **DOCUMENTED** S11/S12 |

## X26 — Customer selected in booking (history)

| Field | Content |
|---|---|
| Trigger | Pick customer on sheet |
| Affected | Suggestions/alerts UI |
| SF / IT | **SF-035** |
| Evidence | 2026-11-08: selected customer on the create sheet showed a relative “last appointment” line **OBSERVED**. Search-results panel not re-opened. **DOCUMENTED** S19/S20 |

## X27 — Duplicate customer merge

| Field | Content |
|---|---|
| Trigger | Merge action |
| Affected | Appointment FKs consolidated; audit |
| SF / IT | **SF-036** |
| Evidence | **DOCUMENTED** S17 · UI **UNVERIFIED** |

## X28 — Real-time calendar refresh

| Field | Content |
|---|---|
| Trigger | Any booking mutation |
| Affected | Other authorized clients |
| Expected state | Prompt refresh; unauthorized see nothing |
| SF / IT | **SF-038** |
| Evidence | **PROPOSED** M12 · live multi-browser **UNVERIFIED** |

## X29 — Dashboard / reporting reads

| Field | Content |
|---|---|
| Trigger | Open dashboard / change report period |
| Affected | Derived metrics only |
| Expected state | Same SoT as appointments; DST-safe boundaries |
| SF / IT | **SF-045**, **SF-039** |
| Evidence | Dashboard widgets **OBSERVED**; sales reports mostly **OUT** |

## X30 — Permission / role change

| Field | Content |
|---|---|
| Trigger | Change user role or salon scope |
| Affected | API, exports, realtime feeds |
| Expected state | Immediate enforcement |
| SF / IT | **SF-044** · **IT-15** |
| Evidence | Roles **OBSERVED** · enforcement tests **PROPOSED** |

## X31 — Locale / timezone settings

| Field | Content |
|---|---|
| Trigger | Change language/TZ/week start/time format |
| Affected | Display only; stored instants UTC |
| SF / IT | **SF-041** · **IT-16** |
| Evidence | General settings **OBSERVED** · SalonFlow defaults German per AGENTS.md |
| Screenshots | `screenshots/general-settings.png` |

## X32 — Import re-run

| Field | Content |
|---|---|
| Trigger | Import Salonized export |
| Affected | Staging → Engine commits |
| Expected state | Idempotent external IDs |
| SF / IT | **SF-040** · **IT-14** |
| Evidence | Export UI **OBSERVED**; import path **UNVERIFIED** |

## X33 — Archive historical readability

| Field | Content |
|---|---|
| Trigger | Archive employee/service/customer |
| Affected | Historical calendar labels via snapshots |
| SF / IT | **SF-042** |
| Evidence | **PROPOSED** |

## X34 — Empty-slot create prefills

| Field | Content |
|---|---|
| Trigger | Click empty calendar cell |
| Affected | Create sheet defaults staff/time |
| SF / IT | **SF-018** · **IT-09** |
| Evidence | **DOCUMENTED** FLOW-03 · click **UNVERIFIED** (safety) |

## X35 — Booking from customer profile · **P1** (after M09 walk-in slice)

| Field | Content |
|---|---|
| Trigger | Book from profile |
| Affected | Create sheet with customer preselected |
| SF / IT | **SF-019** |
| Evidence | **DOCUMENTED** S09 · UI **UNVERIFIED** this pass |

## X36 — Create salon · **P0/P1** (multi-location readiness)

| Field | Content |
|---|---|
| Trigger | Admin creates salon/location |
| Preconditions | Authorized owner |
| Source | Salons / company admin |
| Affected | Calendar context, settings, empty roster, permissions |
| Expected state | New empty branch; no fabricated staff/appointments |
| SF / IT | **SF-014** |
| Evidence | **DOCUMENTED** S07 · live multi-salon create **UNVERIFIED** in this account |

## X37 — Availability query / Find availabilities · **P0**

| Field | Content |
|---|---|
| Trigger | Find availabilities or slot hint API |
| Preconditions | Staff + service duration context |
| Source | Create/edit sheet (read) |
| Affected | UI slot list only |
| Expected state | Hint DTO with revision/reason codes; **never authorizes** write — Engine revalidates on save |
| Backend checks | Hours − breaks − absences − active allocations |
| SF / IT | Supports SF-018/022 · no dedicated IT yet |
| Evidence | Nested modal empty/slotted days **OBSERVED**; Apply not used · formula **PROPOSED** |

## X38 — Copy appointment · **P0**

| Field | Content |
|---|---|
| Trigger | Detail → Copy |
| Preconditions | Existing appointment |
| Source | Detail → must open create command via **Booking Engine** (no client-side clone write) |
| Affected | New appointment + allocations if saved |
| Expected state | Prefill draft only until Engine commit |
| SF / IT | Uses SF-022 path |
| Evidence | Copy action **OBSERVED**; behavior **UNVERIFIED** |

## X39 — Backup restore drill · **P0** ops (M16)

| Field | Content |
|---|---|
| Trigger | Restore from backup |
| Expected state | Known IT-06 appointment returns; authz still holds |
| SF / IT | **IT-15** restore half · (**PROPOSED** IT-26 split) |
| Evidence | **PROPOSED** · not executed in discovery |

## X40 — All exclusive resource_allocations writes · **P0**

| Field | Content |
|---|---|
| Trigger | Any occupancy change (appointment, blocking chore, block-backed absence) |
| Source | Scheduling / Booking domain only |
| Expected state | No module INSERT/UPDATE `resource_allocations` outside that writer |
| SF / IT | Underpins SF-022–025, SF-028, SF-011 |
| Evidence | **PROPOSED** Master Architecture · not a Salonized schema claim |

---

## SF ↔ IT quick index (existing; do not duplicate)

| SF | Primary IT |
|---|---|
| SF-001, SF-005 | IT-01 |
| SF-002 | IT-02 |
| SF-013, SF-023 | IT-03 |
| SF-010 | IT-04 |
| SF-016, SF-021 | IT-05 |
| SF-022, SF-047 | IT-06 |
| SF-025 | IT-07 |
| SF-048 | IT-08 |
| SF-018 | IT-09 |
| SF-020 | IT-10 |
| SF-024 | IT-11 |
| SF-011, SF-046 | IT-12 |
| SF-030 | IT-13 |
| SF-040 | IT-14 |
| SF-044 | IT-15 |
| SF-041 | IT-16 |

## Implementation order (dependencies)

1. AuthZ + Salons + Staff + Services catalog (M04–M05)  
2. Hours/absences availability facts (M06)  
3. Booking Engine constraints (M07)  
4. Create API + audit + idempotency (M08)  
5. Calendar create UI (M09)  
6. Edit/cancel/version (M10)  
7. Cross-salon exclusivity (M11)  
8. Realtime (M12)  
9. Customers (M13)  
10. Admin parity (M14)  
11. Import (M15)

## Notes

- SalonFlow may be **stricter** than Salonized (**PROPOSED** SF safety rules). Do not claim those as OBSERVED Salonized internals.
- Master Architecture V2 wins on conflicts (`docs/DOC_CONFLICTS.md`).
