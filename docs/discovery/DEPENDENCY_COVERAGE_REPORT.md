# Dependency Coverage Report

| Field | Value |
|---|---|
| Date | 2026-11-08 |
| Scope | Salonized discovery + SalonFlow SF/IT contracts |
| Completeness claim | **Not 100%.** Screens opened ≠ all dependencies verified. |

## 1. Coverage by module

| Module | UI inventoried | Dependency rules mapped | Safe live verification | Linked SF | Linked IT | Gap level |
|---|---|---|---|---|---|---|
| Dashboard | Yes | X29 | Partial (read) | SF-045,039 | — | Medium |
| Calendar | Yes | X14,X28,X34 | Partial (no drag) | SF-030,031,038,018 | IT-09,11,13 | Medium |
| Appointments | Yes create/detail/edit chrome | X08–X11,X23,X25 | No save/move/cancel | SF-018–027,032,033,047,048 | IT-06–12 | **High** (writes blocked) |
| Customers | List chrome | X07,X26,X27,X35 | No search/create/merge | SF-019,020,035,036 | IT-10 | High PII |
| Employees | List | X01,X19,X20,X15,X21 | No detail save | SF-001–006,013,017 | IT-01–03 | Medium |
| Timetable/Hours | Week view | X03,X22 | No cell edit | SF-007–010 | IT-04 | Medium |
| Absences | List + holidays | X04 | No create | SF-011,012,046 | IT-12 | Medium |
| Services | Admin + booking dropdown | X05,X06,X16,X23 | No catalog edit save | SF-015,016,021,034 | IT-05 | Medium |
| Resources | List | X16 | No wiring proof | SF-034 | — | High |
| Settings general/calendar | Yes | X14,X17,X31 | No Save | SF-030,041,043 | IT-13,16 | Low–Medium |
| User accounts | Yes | X02,X30 | No role mutation | SF-002,044 | IT-02,15 | Medium |
| Messages | Log chrome | X17 | No send | SF-043 | — | Medium |
| Waiting list | Yes | X12 | No convert | SF-037 | — | High |
| Online booking | Settings | X13 | No Save | (future channel) | — | Medium |
| Reports | Totals | X29 | Read-only | SF-039 | — | Low (mostly OUT) |
| Export | Form | X18,X32 | No export run | SF-040 | IT-14 | High (needs sample) |
| Auth realtime | — | X28,X30 | Not multi-browser tested | SF-038,044 | IT-15 | High |

## 2. Discovered dependencies (OBSERVED signals)

- Service select → duration + price summary update.
- Find availabilities → empty vs slotted days correlate with working pattern.
- Appointment detail → Edit/Move/Copy/No-show/Delete + history.
- Edit reuses create-event route with Save.
- Walk-in allowed without customer.
- Waiting-list counts on calendar + marketing page.
- Message log shows appointment confirmations.
- User activity log records appointment/customer/absence events.
- Settings expose reminders, online cancel/reschedule lead times, slot interval.

## 3. Documented dependencies (Help / SF)

- Full SF-001–SF-048 catalog and FLOW-01–07.
- Help S01–S31 referenced in functional guideline.
- IT-01–IT-16 acceptance tests already defined for engine slice.

## 4. Unverified dependencies (explicit)

| ID | Dependency | Why unverified |
|---|---|---|
| U1 | Exact Salonized concurrency message on double book | Unsafe to collide live |
| U2 | Absence-over-appointment conflict UI | Would create absence |
| U3 | Hours change with existing futures | Would mutate hours |
| U4 | Service deactivate/duration edit snapshot in Salonized | Would mutate catalog |
| U5 | Staff deactivate with futures | Mutating |
| U6 | Multi-salon exclusivity UI | No second location in session |
| U7 | Resource double-book prevention | Not wired in explored UI |
| U8 | Empty-slot prefill | Not clicked |
| U9 | Drag reschedule revert | Mutating |
| U10 | Idempotent retry after network fail | Needs controlled fault injection |
| U11 | DST edge in Salonized product | Needs crafted dates |
| U12 | Waitlist convert + messaging | Mutating / sends |
| U13 | Customer merge UI | PII + mutate |
| U14 | Import path | Not found / not run |
| U15 | Multi-browser realtime latency | Not tested |

## 5. Missing implementation contracts (vs Master Architecture)

| Gap | Needed contract | Milestone |
|---|---|---|
| Idempotency key header/body on create | API + client | M08 |
| `expectedVersion` on update | API + UI | M10 |
| Conflict payload with suggested slots | API error schema | M08/M10 |
| Availability query DTO shared by Find slots + Engine | read API ≠ authorize | M07 |
| Outbox message types + dedupe keys | notifications | later SF-043 |
| Waitlist convert command wrapping Engine | waitlist module | P1 |
| Import staging schema + external IDs | M15 | M15 |
| SSE/poll event authorization filter | M12 | M12 |

These are **PROPOSED** SalonFlow contracts, not reverse-engineered Salonized APIs.

## 6. Missing / not-yet-green tests

| Test | Status expectation |
|---|---|
| IT-01–IT-08 | Required for NS-017 engine exit |
| IT-09–IT-12 | Required for M09/M10 UI |
| IT-13–IT-16 | Settings/import/auth/DST |
| Multi-browser SF-038 | Missing harness until M12 |
| Waitlist SF-037 E2E | Not in first slice |
| Treatwell channel | Out / later |

## 7. High-risk scenarios (implement order)

1. **Concurrent booking** (SF-023 / IT-03/06) — data integrity  
2. **Stale edit** (SF-048 / IT-08) — silent overwrite risk  
3. **Absence/hours vs futures** (SF-046 / IT-12) — hidden appointment loss  
4. **Cross-salon staff** (SF-013 / IT-03) — double book across locations  
5. **Snapshot drift** (SF-016 / IT-05) — historical price/duration corruption  
6. **Network retry duplicates** (SF-047 / IT-06) — duplicate customers/appointments  
7. **Authz leakage** (SF-044 / IT-15) — cross-salon PII  
8. **Import duplication** (SF-040 / IT-14) — cutover risk  

## 8. Completeness checklist

| Check | Status |
|---|---|
| Every major inventoried action has expected outcome | Yes for explored chrome; writes marked UNVERIFIED |
| State-changing actions identify affected modules | Yes in X01–X35 |
| Affected modules have update requirements | Yes (UI + backend fields) |
| Invalid states have response | Yes via SF failure/409 patterns (**PROPOSED**) |
| Critical deps have acceptance tests | Mapped to IT-01–16; not all implemented in CI yet |
| Unverified tracked | Section 4 + `DISCOVERY_GAPS.md` |
| Workflows map to milestones | Matrix implementation order + mapping doc |
| Conflicts with Master Architecture flagged | Booking Engine sole allocator; POS OUT; no SF ID duplication |

## 9. Specialist review log (2026-11-08)

| Role | Focus | Outcome | Disposition |
|---|---|---|---|
| Product Analyst | SF/FLOW completeness | **Fail** full baseline: SF-014 unmapped (fixed → X36); OBSERVED overclaim risks flagged | Fixes applied in matrix/graph |
| Backend Architect | Engine sole allocator | **Pass with caveats**: Engine OK for appointments; require sole writer of **all** `resource_allocations`; M07–M10 DTOs missing | Graph ownership clarified; contracts listed §5 |
| QA Engineer | IT-01–16 + edge stubs | **Fail** QA readiness: weak IT-09/12/14/15; propose IT-17–26 | Stubs recorded below; not minted as SF IDs |
| Independent Reviewer | Architecture contradictions | **Request-changes**: X11 occupancy, Flow D hours gate, P1/P2 gating, missing P0 rows | Critical fixes applied; remaining Owner decisions below |

### Applied fixes after review

- Retitled matrix as discovery traceability (not parallel SoT).
- X11 no-show → retain occupancy (Architecture Flow C).
- X03/X04 → Flow D commit gate + shared locks.
- Added X36 (SF-014), X37 (availability query), X38 (Copy), X39 (restore), X40 (allocations writer).
- Waitlist priority corrected to **P2** (Owner may promote).
- SMS credits marked OUT observation-only.

### Remaining Owner decisions (do not guess)

1. Sandbox for write-path verification.
2. Soft-cancel UI copy vs Salonized “Delete”.
3. Accept SF-004/006 stricter deactivate warnings.
4. Launch-critical promotion of waitlist / reminders / recurrence.
5. Redacted export sample for M15.
6. Second-location verification window.
7. Confirm screenshot redaction policy continues for any new calendar captures.

### PROPOSED additional IT stubs (QA; not SF IDs)

IT-17 deactivate+futures · IT-18 hours-change+futures · IT-19 company/resource absence scope · IT-20 eligibility reject · IT-21 in-booking customer rollback · IT-22 no-show occupancy · IT-23 outbox rollback · IT-24 SF-038 multi-browser · IT-25 archive snapshots · IT-26 restore drill split.

## 10. Engineering use rule

Engineers may implement P0 against **Master Architecture V2 + SF-001–SF-048 + IT-01–IT-16**, using these discovery docs as **PROPOSED/OBSERVED/UNVERIFIED** guidance only. Do not treat unverified Salonized write behavior as fact.
