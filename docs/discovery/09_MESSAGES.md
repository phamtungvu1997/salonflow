# 09 — Messages, templates, reminders

## Identification

| Field | Value |
|---|---|
| Entry | Sidebar Messages → `/messages/logs` |
| Safety | Message bodies / customer contacts not retained |

## Interaction (**OBSERVED**)

Tabs: **Message log** | **Email templates** | **SMS**

Message log columns: **SENT · TYPE · CUSTOMER · CONTACT · MESSAGE · STATUS**  
Filter: All  
Observed types in log chrome: **Appointment confirmation** with status **DELIVERED**

Calendar settings also configure reminder email/SMS lead times (**OBSERVED**).

## Functional logic

| Topic | Evidence |
|---|---|
| Transactional messages on booking | **OBSERVED** confirmation log rows · **DOCUMENTED** S10 |
| Templates editable | Tab **OBSERVED** · content **UNVERIFIED** |
| SMS credits | Settings stats + calendar SMS note **OBSERVED** |
| SalonFlow outbox | **PROPOSED** SF-043 later |

## Engineering requirements (**PROPOSED**)

- V1: optional deferred. If enabled later: outbox after commit only; no send on rollback.
- Priority: **P2**.
- OUT: marketing blasts as SaaS clone.

## Evidence

- Live messages chrome 2026-11-08.
- Reference (PII gitignored): `docs/references/salonized/salonized-messages.png`.
