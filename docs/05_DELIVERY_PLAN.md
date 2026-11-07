# Delivery roadmap — vertical slices, ordered dependencies

Every ticket has an issue ID, owner role, dependencies, business requirement references, acceptance criteria and evidence. **No ticket is 'done' because code exists.** It is done only after tests, review and owner signoff when applicable.

> **Override:** Canonical milestone IDs are Master Architecture **M00–M19**. The coarse M0–M8 labels below are historical kit shorthand — see [`DOC_CONFLICTS.md`](DOC_CONFLICTS.md). Auth skeleton is **M05**, not foundation. Calendar spike uses **≥250** events.

## Milestones and gates (kit shorthand → use V2 IDs in work)
- **M0 / V2 M00 (requirements):** screenshots translated into UI states; scope approved; library spike plan; Treatwell risk acknowledged.
- **M1 / V2 M01 (foundation):** repo, lint/typecheck/test scripts, CI, synthetic fixtures, consistent local dev. **No auth skeleton here** (that is M05). No production data.
- **M2 / V2 M02–M03 (UX + calendar spike):** design shell + 20-worker day calendar comparing two libraries; drag, resize, touch, navigation benchmark. Owner approves screenshot and interaction flow.
- **M3 / V2 M04–M08 (backend invariant):** schema, tx scheduling engine, concurrency and role tests pass.
- **M4 / V2 M09–M12 (complete vertical booking):** receptionist creates, edits, moves and cancels one appointment end-to-end; live read updates.
- **M5 / V2 M11–M14 (multi-location + admin):** staff across locations, rosters/absence, service eligibility, customers, scoped auth.
- **M6 / V2 M15–M17 (operations):** audit, backups + restoration, Salonized import+reconciliation, monitored deployment, staff usability pilot.
- **M7 / V2 M18–M19 (cutover):** reconcile all future appointments; explicit supported Treatwell strategy; signed owner go-live and rollback plan.
- **M8 / later (extensions):** dashboard, recurrence, waiting list, notifications, public pay-at-salon widget.

## Backlog preview
See `tasks/INITIAL_ISSUES.md` for full issue-ready ticket contracts. Default priority is M0 → M1 → M2 → M3 → M4; specialist agents can independently research or test in parallel but must not concurrently modify the same shared source files.

## Dependency workflow
Each feature passes: product spec → UI state/contract → backend/DB contract → implementation → unit/integration/E2E → independent review → owner acceptance. Backend/API and frontend scaffolding may work in separate isolated branches after API contract approved. Merge with CI and conflict resolution by coordinator, never simultaneous blind edits.

## Progress board
`Proposed` → `Specified` → `Ready` → `In progress` → `PR review` → `Owner acceptance` → `Done` / `Blocked`. Use priority and dependency labels. Agents cannot mark owner acceptance themselves.

## Milestone evidence
- M2: demo video or screenshots with synthetic data for desktop and iPad; measured gaps and decision record.
- M3: test command/output proving concurrent 409 invariant and rollback.
- M4: Playwright trace/video of complete booking flow, plus mobile controls.
- M6: restoration transcript, sanitized import dry-run, threat model, authorization matrix.
- M7: reconciliation sheet with zero unexplained future booking differences, signed cutover checklist.
