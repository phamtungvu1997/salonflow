# 11 — Waiting list

## Identification

| Field | Value |
|---|---|
| Entry | Marketing → Waiting list `/marketing/waiting-list` · Dashboard teaser · Calendar waiting-list chips |
| Help | **DOCUMENTED** S23 |

## Interaction (**OBSERVED**)

1. Filters: Show all / Today.
2. Columns: DATE · CUSTOMER · SERVICES · DURATION · SENT · EMPLOYEE.
3. Action/link: **Waiting list email settings**.
4. Calendar shows per-day waiting list counts.
5. Dashboard shows waiting-list customer count teaser.

## Functional logic

| Topic | Evidence |
|---|---|
| Waitlist is first-class calendar/marketing concept | **OBSERVED** |
| Convert waitlist → booking must use booking engine | **PROPOSED** SF-037 · convert UI **UNVERIFIED** (not clicked to avoid messaging) |
| Notifications on free slot | Email settings link **OBSERVED** · send **NOT** executed |

## Engineering requirements (**PROPOSED**)

- Priority **P1** after core booking (not P0 vertical slice).
- Convert only via booking transaction; failure must not drop waitlist entry (SF-037).
- Tests: calendar chip count; convert success/failure.

## Evidence

- Live waiting-list page 2026-11-08; no subscriber PII recorded.
