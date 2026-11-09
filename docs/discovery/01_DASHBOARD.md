# 01 — Dashboard

## Identification

| Field | Value |
|---|---|
| Workflow ID | DASH-001 |
| Module | Dashboard |
| Entry | Sidebar home → `/dashboard` |
| Role | Authenticated salon user (**OBSERVED** Full access account in session) |
| Preconditions | Logged in; location context in URL `/c/{company}/l/{location}/` |

## Interaction (**OBSERVED**)

1. Open Dashboard.
2. See tabs **Schedule** / **Activity**.
3. Empty schedule state: “No upcoming events today” + **Create appointment**.
4. Quick start: **Appointment** | **Sale** | **Customer**.
5. **Who’s working today**: staff card with appointment count + working hours (e.g. `10:00–19:00`).
6. **Today’s guests**: totals / returning / new percentages.
7. Waiting-list teaser linking to marketing waiting list.
8. **Calendar utilisation** Today / This week.
9. **Notes due today** + **Create note**.
10. Promo tiles (wallets / Treatwell Pay) — commercial upsell.

## Functional logic

| Topic | Evidence |
|---|---|
| Dashboard aggregates calendar/staff/waitlist | **OBSERVED** widgets |
| Create appointment routes to calendar create-event | **OBSERVED** href |
| Sale quick start is POS | **OBSERVED** `/register` — OUT OF SCOPE for SalonFlow V1 |
| Exact Activity tab contents | **UNVERIFIED** (not switched deeply) |
| Dashboard explained help | **DOCUMENTED** S25 |

## Engineering requirements (**PROPOSED**)

- Frontend: German “Übersicht” with today agenda, on-shift staff, utilisation from booking read-model (no payment promos).
- Backend: derive widgets from appointments + roster; no separate fake store.
- Tests: booking create updates dashboard counts (SF-045).
- Milestone: after M09; polish M14+.

## Evidence

- Live `/dashboard` navigation 2026-11-08.
- No screenshot committed (promo + staff card only; calendar empty state OK but low value vs settings captures).
