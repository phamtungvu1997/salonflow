# Test matrix — tests must be executed, not merely described

| Test ID | Feature | Setup/action | Required outcome | Test layer |
|---|---|---|---|---|
| T-001 | Quick create | staff/time click, customer lookup, service, save | persisted booking displayed, accurate end time | E2E |
| T-002 | Duplicate collision | 2 requests same staff/time simultaneously | exactly one commits; other gets HTTP 409 | PostgreSQL integration |
| T-003 | Cross-salon collision | one staff assigned to two branches; overlapping requests | one rejects, same shared resource identity | Integration |
| T-004 | Invalid drag | drag onto occupied slot | UI rollback, message, no DB change | E2E + integration |
| T-005 | Optimistic concurrency | two edits same version | no lost update; 409 | Integration |
| T-006 | Shift conflict | book outside hours without override | blocked with explanation | Integration |
| T-007 | Break/absence | book during blocked time | blocked | Integration |
| T-008 | Employee eligibility | select technician unqualified for service | validation rejects | Integration |
| T-009 | Sequential services | book two treatments with different staff | correct allocated intervals/end time | Integration |
| T-010 | Cancellation | cancel booked appointment | allocations released, history retained | Integration |
| T-011 | No-show | mark appointment no-show | appears in history, correct status marker | E2E |
| T-012 | DST spring forward | nonexistent Berlin local time | reject/normalize with documented policy, no silent shift | Unit + integration |
| T-013 | DST fall back | ambiguous Berlin time | store explicit instant, unambiguous display | Unit + integration |
| T-014 | Auth isolation | tech tries unauthorized admin/customer endpoint | denied server-side | Security integration |
| T-015 | Reimport duplicate | same Salonized test export twice | no duplicate or corruption | Import integration |
| T-016 | Restore | encrypted backup restored to test environment | sample appointments/customers faithfully restored | Ops rehearsal |
| T-017 | 20 staff layout | synthetic 20 staff/200 bookings | readable, scrollable, no unusable lag | Browser/perf |
| T-018 | iPad | tap, selection, rescheduling fallback | workable without mouse/hover | Device manual + E2E |
| T-019 | Multi-user refresh | user A saves, user B views | timely refresh, correct data, no phantom UI | E2E |
| T-020 | Owner dashboard | compare utilization to assigned shifts | correct mathematical denominator | Unit + integration |

Each PR maps its issue's requirement IDs to applicable T-IDs. Any failing hard-blocker prevents 'Done'.
