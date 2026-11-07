# Architecture decisions, assumptions and risk register

## Approved starting assumptions (confirm with owner before release)
- Single company-operated internal application; future Heide branch; German interface, EUR, Europe/Berlin.
- No payment or POS.
- Staff may work at multiple locations; conflicts across branches prohibited.
- PostgreSQL is authoritative; client calendar library is replaceable.
- Screenshots serve as workflow/layout references only; original brand assets/code prohibited.

## Decisions requiring explicit ADR after prototype
- ADR-001 Calendar component: DayPilot Lite vs React Big Calendar vs another free licensed candidate. Measure touch, resource columns, accessibility, perf, drag+resize; no handwaving.
- ADR-002 Drizzle vs Prisma and raw SQL migration strategy.
- ADR-003 Auth provider/session strategy, owner MFA, recovery.
- ADR-004 Live update transport SSE vs WebSocket vs polling.
- ADR-005 Deployment provider, database placement, RPO/RTO and backup retention.
- ADR-006 Multi-salon customer data sharing if locations operate as separate legal entities.
- ADR-007 Treatwell booking reconciliation and rollout plan.

## High risks
| Risk | Mitigation | Release impact |
|---|---|---|
| Double bookings under concurrency | PostgreSQL exclusion constraints, serializable business validation as applicable, concurrency integration tests | Hard blocker |
| Unverified Treatwell live sync | Documented supported route, safe manual reconciliation or migrate channel | Hard blocker if Treatwell continues bookings |
| Cloud agent accessing live PII | Synthetic fixtures, limited credentials, sanitized exports only, reviews | Hard blocker |
| Touch/calendar library limits | Prototype on actual iPads, alternative form-based reschedule | Hard blocker for required devices |
| Salonized import mismaps | Preview, external-ID mapping, idempotent test batches, count reconciliation | Hard blocker |
| Employee collision between salons | Single staff identity & resource allocation | Hard blocker |
| AI code changes beyond scope | Agent rules, small tickets, PR gates, branch restrictions | High |
| Operational downtime | Monitoring, rehearsed restore, fallback manual log, rollback | High |
| GDPR/access leakage | Least-privilege RBAC, logs, deletion/export policy, legal check | Hard blocker |

## Decision record template
`ADR-NNN Title` / Date / Status proposed|accepted / Context / Alternatives / Decision / Consequences / Verification / Owner approval.
