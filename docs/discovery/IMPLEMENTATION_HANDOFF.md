# Discovery handoff — implementation planning

| Field | Value |
|---|---|
| Coordinator | Principal Engineering Coordinator |
| Date | 2026-11-08 |
| Governing specs | Master Architecture V2 · DOC_CONFLICTS · AGENTS.md · SF-001–SF-048 |
| Discovery pack | `docs/discovery/*` (UI/dependency evidence; screenshots ≠ backend proof) |
| Active PR | [#1 NS-017: PostgreSQL booking engine](https://github.com/phamtungvu1997/salonflow/pull/1) on `feat/ns-017-booking-workflow` |
| Companion PR | [#2 UI preview concepts](https://github.com/phamtungvu1997/salonflow/pull/2) — design only |

**Rule:** Do not mark features complete without working code + passing tests. Do not merge/deploy without Owner approval.

**Owner UI approvals (2026-11-08):** UI-01=B · UI-02=B · UI-03=A · UI-04=A · UI-05=A (preserve future color modes) · UI-06=A · UI-07=defer PR #2.

---

## 1. Discovery coverage summary

| Area | Status | Notes |
|---|---|---|
| Application inventory | Done | All major Salonized nav/settings inventoried |
| Module docs 01–15 | Done | Chrome-level; write paths largely UNVERIFIED |
| Create appointment deep dive | Done | Modal fields/availabilities OBSERVED; Save not executed |
| Appointment detail/edit | Partial | Actions OBSERVED; Save/Delete/Move not executed |
| Dependency graph + X-matrix | Done | Reviewed; Flow C/D fixes applied |
| Coverage report | Done | Explicitly **not** 100% |
| Specialist reviews | Done | Product/QA Fail baseline; Independent Request-changes (addressed); Backend Pass w/ caveats |

**What discovery proves:** UI structure, field names, cross-screen entry points, catalog/availability *signals*.  
**What discovery does not prove:** Salonized concurrency internals, save validation text, absence-over-booking UX, multi-salon exclusivity in this account.

---

## 2. Cross-module dependency matrix (status)

Canonical behavior: **SF-001–SF-048** + **IT-01–IT-16**.  
Discovery traceability: [`CROSS_MODULE_BEHAVIOR_MATRIX.md`](CROSS_MODULE_BEHAVIOR_MATRIX.md) (X01–X40).  
Ownership: [`APPLICATION_DEPENDENCY_GRAPH.md`](APPLICATION_DEPENDENCY_GRAPH.md).

| High-risk rule | Architecture stance | Code today | Gap |
|---|---|---|---|
| Booking Engine sole allocator | Hard rule | `src/server/booking.ts` writes appointments + allocations | Absences/chores must not INSERT allocations later |
| Double-book / cross-salon | SF-023/013 · IT-03/06 | Integration tests claim pass locally | CI not green; no claim “complete” until CI |
| Idempotent create | SF-047 · IT-06 | Idempotency keys in engine | Keep client UUID on create |
| Versioned update | SF-048 · IT-08 | `expectedVersion` on PATCH/cancel | Stale UI restore polish (M10) |
| No-show occupancy | Flow C: **retain** | Cancel frees; no-show path thin/absent in UI | Implement status ≠ cancel |
| Hours/absence vs futures | Flow D: gate before commit | Shifts checked on book; absence CRUD incomplete | NS-006 remainder |
| Snapshots | SF-016 · IT-05 | Engine stores duration/name snapshots | Service admin edit must not rewrite lines |

Matrix update required after this handoff: keep X-rows as discovery only; implementation tickets cite **SF/IT**, not X as authority.

---

## 3. Implementation gap analysis

### Already implemented (partially verified)

| Capability | Evidence in repo | Verified? |
|---|---|---|
| German app shell + nav | `nav-items.ts`, pages | UI present; not Owner visual sign-off |
| Login session | `/anmelden`, auth routes | Harness login in e2e |
| Salon-scoped APIs | staff/customers 403 across salon in e2e | Partial RBAC |
| Staff / service / hours admin | feature admin UIs + APIs | Functional harness |
| Create / move / cancel appointment | `booking.ts` + `calendar-board.tsx` + e2e | Local IT-01–08 claimed; **CI fail** |
| GiST exclusion + advisory locks | migrations + engine | Local integration tests |
| Service snapshots on create | booking insert path | Covered by IT-05 claim |

### Partially implemented

| Capability | Missing for “done” |
|---|---|
| Calendar day board | Not Salonized-density; no week view; no waiting-list row; harness chrome |
| Create booking UX | Inline form after slot click — **not** discovery modal (services/employee/Find availabilities/repeat) |
| Customer in booking | New customer works; rich search/history (SF-035) missing |
| Absences | Schema/tests lean on shifts; full absence admin + Flow D gate missing |
| Auth roles | Login works; Calendar-view vs Full-access parity incomplete |
| CI | `npm ci` lockfile out of sync on PR #1 |

### Missing (P0 path)

| Capability | Ticket / milestone |
|---|---|
| Green CI + Owner-accepted NS-017 | NS-017 closeout |
| Salonized-inspired create sheet (M09) | NS-008 |
| Drag conflict revert + no-show/status (M10) | NS-009 |
| Absence overlap conflict list | NS-006 → feeds NS-009 IT-12 |
| Find-availabilities read API | Part of NS-008/NS-006 |
| Realtime multi-user | NS-014 (after create stable) |
| Dashboard | NS-013 |
| Import | NS-011 (needs redacted export) |

### Contradictions / risks flagged

1. **PR #1 CI red** — lockfile missing `@testing-library/dom` etc. → cannot claim NS-017 complete.  
2. **Harness ≠ product UI** — e2e proves engine path; discovery modal still design debt (NS-004/NS-008).  
3. **Customer create then book** in UI is two HTTP calls — contract prefers **one transaction** (SF-020); race can orphan customer (**PROPOSED** fix in NS-008).  
4. **No-show** must not reuse cancel’s free-allocation path (Architecture Flow C).  
5. Discovery waitlist **P2** — do not pull into NS-008.

---

## 4. Updated dependency-ordered backlog

Update applied in [`tasks/INITIAL_ISSUES.md`](../../tasks/INITIAL_ISSUES.md). Sequence for daily booking replacement:

```text
NS-017 closeout (CI green, Owner review)     ← FIRST
    ↓
NS-008  M09 create sheet + IT-09/IT-10         ← smallest complete receptionist E2E (product UI)
    ↓
NS-006 remainder (absences + Flow D)  ∥  NS-005 auth hardening
    ↓
NS-009  M10 move/cancel/no-show + IT-11/IT-12
    ↓
NS-010 customers  →  NS-014 realtime  →  NS-013 dashboard
    ↓
NS-011 import (sample)  →  NS-012 backups  →  NS-015 acceptance
```

NS-004 (visual calendar tokens) may proceed **in parallel** after Owner UI decisions — must not block engine closeout; should land before or with NS-008 polish.

NS-016 waitlist/recurrence remains planning-only until Owner promotes.

---

## 5. UI decisions requiring Owner approval

Do **not** start major redesign until these are answered.

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| UI-01 | Create-appointment chrome | **A)** Keep harness form until after NS-017 merge · **B)** Build Salonized-like modal now (discovery schematic) as NS-008 | **B after NS-017 green** — modal is the daily workflow |
| UI-02 | Calendar density target | **A)** Current board · **B)** Dense multi-column day (UI_REFERENCE) · **C)** Week-first | **B** for V1 primary; week secondary |
| UI-03 | Walk-in without customer | **A)** Allow (Salonized OBSERVED) · **B)** Require customer | **A** with clear “Walk-in” label |
| UI-04 | Cancel wording | **A)** Stornieren (soft-cancel) · **B)** Mirror Salonized “Delete” label | **A** |
| UI-05 | Appointment color | **A)** Per employee · **B)** Per service category (Salonized setting) | **A** for V1 simplicity; setting later |
| UI-06 | Find availabilities in V1 create | **A)** Include · **B)** Defer; rely on hatch + Engine 409 | **A** lightweight (X37) once hours solid |
| UI-07 | PR #2 concept preview | Adopt / reject / defer vs NS-004 | Defer to NS-004 review; do not merge as product |

**Status:** Owner approved 2026-11-08 (all recommendations accepted; UI-05 note: keep future color-mode extensibility).

---

## 6. Next three implementation tickets

### Ticket A — **NS-017-CI / NS-017 closeout** (recommended first)

**Goal:** Make the booking engine PR merge-ready without claiming receptionist UX done.  
**Lead:** devops-engineer + backend-engineer · **QA:** re-run IT-01–IT-08  
**Depends on:** existing PR #1  
**Acceptance criteria:**

1. `package-lock.json` sync so `npm ci` succeeds in CI.  
2. CI job “Lint, typecheck, test, build” green (or documented Owner waiver).  
3. `npm run test:integration` IT-01–IT-08 green against CI Postgres.  
4. SPEC-017 checklist marked with command evidence.  
5. Explicit statement in PR: harness calendar ≠ final UI; no merge to `main` without Owner.  
6. No production data; no deploy.

### Ticket B — **NS-008** (M09 create sheet)

**Goal:** Smallest **product** end-to-end: empty slot → German create sheet → Engine save → reload visible.  
**Lead:** frontend-engineer + ui-ux-designer · backend for availability hint if UI-06=A  
**Depends on:** NS-017 closeout + Owner UI-01/UI-03  
**Acceptance criteria:**

1. IT-09 Playwright: empty slot → service → customer/walk-in → save → reload card in column.  
2. IT-10: in-sheet customer create linked in **one** server transaction (fix SF-020 orphan risk).  
3. Sheet fields mapped from discovery: service*, duration, employee*, date/time, note, customer search; German copy.  
4. Engine remains sole writer; UI does not authorize conflicts (409 retains form).  
5. No POS checkout, no waitlist convert, no notifications required.  
6. Screenshots synthetic/fictional only.

### Ticket C — **NS-009** (M10 edit path) *or* **NS-006 absences** if UI-06 needs hours first

**Preferred after B:** NS-009  
**Acceptance criteria (NS-009):**

1. IT-11: drag/move onto occupied slot → UI reverts; DB version unchanged.  
2. Cancel soft-status + frees allocation (IT-07 already engine-side); German Stornieren.  
3. No-show status **retains occupancy** (Flow C); separate from cancel.  
4. IT-12 once absences exist: absence over future appointment → conflict list, appointment kept.  
5. `expectedVersion` 409 path visible to user (SF-048).

If Owner prioritizes Find availabilities accuracy first, insert **NS-006 remainder** (absence CRUD + Flow D) before full NS-009.

---

## 7. Recommended first implementation ticket

**Start with Ticket A — NS-017 closeout (CI lockfile + green checks).**

Reason: the vertical slice engine already exists on PR #1; discovery confirms the *product* UX still needed, but building NS-008 on a red CI foundation wastes effort. After A is Owner-accepted, implement NS-008 against the live Engine.

---

## 8. Traceability cheat sheet (essential workflows)

| Salonized workflow | FE | BE | DB | Tests |
|---|---|---|---|---|
| Create appointment | NS-008 sheet | `createAppointment` | appointments, appointment_services, resource_allocations, idempotency | IT-06, IT-09 |
| Edit / move | NS-009 | PATCH + version | allocations swap | IT-08, IT-11 |
| Cancel | NS-009 | cancel route | status + inactive allocation | IT-07 |
| Staff + hours | staff-admin (exists) | staff/hours APIs | staff, weekly_shifts | IT-01, IT-04 |
| Services | service-admin (exists) | services API | catalog + staff_services | IT-05 |
| Customers | customer-admin + sheet | customers API (txn w/ book) | customers | IT-10 |
| Absences | NS-006 UI | scheduling writer | absences / time_blocks | IT-12 |
| Calendar read | calendar-board → denser UI | calendar API | read model | e2e reload |

---

## 9. Immediate coordinator actions (no redesign)

1. Owner: approve UI-01…UI-07. **Done 2026-11-08.**  
2. Engineering: NS-017-CI lockfile fix on `feat/ns-017-booking-workflow`. **CI green; await Owner merge.**  
3. Commit discovery docs when Owner wants them on the branch (currently largely untracked).  
4. Do not merge PR #1 or #2 to `main` without Owner.  
5. After A green → open NS-008 implementation branch from updated base.  
6. Interaction/motion extension: [`UI_INTERACTION_AND_MOTION_SPEC.md`](UI_INTERACTION_AND_MOTION_SPEC.md) + [`INTERACTION_COVERAGE_MATRIX.md`](INTERACTION_COVERAGE_MATRIX.md) — hand to UI/UX + Frontend for NS-008 (familiar motion, not clones).  
7. Frontend implementation brief (docs-only): [`NS-008_FRONTEND_IMPLEMENTATION_BRIEF.md`](NS-008_FRONTEND_IMPLEMENTATION_BRIEF.md) — component tree, motion tokens, IX-01…05 selectors, SF-020/409 risks, Salonized non-copy list.
