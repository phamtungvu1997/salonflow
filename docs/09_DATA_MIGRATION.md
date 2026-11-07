# Migration and cutover

- Keep Salonized authoritative until production acceptance and synchronization/reconciliation strategy is signed off.
- Official Salonized: Settings → General → Data Export; lifetime exports cover customer database, appointments, deleted appointments and absences, with company-wide or per-location options. Exact file columns require inspecting authorized exports.
- Do NOT commit real exports to Git, screenshots, PRs, or cloud agent repositories. For engineering, produce anonymized sample files outside real PII.
- Import flow: upload in protected admin environment → parse safety/size/encoding → preview mappings + sample rows (redacted in logs) → normalize dates/phones → match staff/salons/services → duplicate analysis → dry-run report → approved commit batch → external-ID mapping → compare counts and future appointments → rollback/reversal log.
- Import scripts must be idempotent and maintain immutable raw source identifiers/hashes where permitted. No direct writes outside import service.
- Before cutover: verify all future booked dates, missing staff, absent staff, multi-service duration, cancellation status, location, timezone and customer identity. Generate exception list; ZERO unexplained future appointment discrepancies required.
- Treatwell status must be separately resolved: its documented Salonized integration is not evidence of a supported private API. Owner must decide to retain the connector and manually reconcile, use a verified supported route, or retire Treatwell channel before going live.
- Contingency: rollback decision and hotline/manual appointment log, two-person verification after restore.
Source: https://help.salonized.com/en/articles/573326-how-do-i-export-data-for-my-accounting
