# SPEC-017 / NS-017 — First real booking transaction

**Status:** Ready after Owner approval of the functional-guideline integration  
**Owners:** backend-engineer implements; qa-engineer runs IT-01–IT-08; security-reviewer checks that the service is not exposed as an unauthenticated public route  
**Depends on:** M04 schema in `src/db`  
**Not in this ticket:** calendar library choice, iPad sign-off, login UI, POS, imports, dashboard

## Outcome

A receptionist-equivalent command can create one appointment in PostgreSQL, reject a double-book, and survive a retried request. The UI may stay a test harness. Persistence must be real.

## In scope

- Tables still missing from M04: shifts, absences, audit, idempotency keys
- Server-side command: create appointment with one service snapshot and one staff allocation
- Concurrency and version tests listed in `tasks/CROSS_MODULE_CONTRACT.md` IT-01–IT-08
- German error codes for conflict vs validation, without a polished calendar

## Out of scope

- Drag/drop, week view, email, waitlist, chores, rooms, recurrence
- Merge to `main`, production data, deploy
