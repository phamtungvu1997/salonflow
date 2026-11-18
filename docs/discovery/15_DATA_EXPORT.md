# 15 — Data export / import-related interfaces

## EXP-001 Data export UI

| Field | Value |
|---|---|
| Entry | Settings → Data export → `/admin/export` |
| Help | **DOCUMENTED** S26 |

### Interaction (**OBSERVED**)

Tabs: **Monthly exports** | **Life time exports**

Monthly form:

- REPORT INFORMATION: Appointments (dropdown)
- MONTH: selectable month
- FILE TYPE: XLS | CSV
- **Export** button — **not clicked** (would export live business/customer-bearing data)

### Priority

- UI understanding: done.
- Running export against production account: **blocked by safety rules** unless Owner provides a redacted sample offline.
- SalonFlow import staging is M15 (**PROPOSED**); must not invent mappings without sample.

Screenshot: `screenshots/data-export.png`  
Also reference: `docs/references/salonized/salonized-settings-data-export.png`

## Import

No dedicated import wizard was found in primary nav during this pass (**UNVERIFIED** whether hidden under Integrations/apps). SalonFlow still plans controlled import (Master Architecture M15).
