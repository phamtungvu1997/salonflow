# Discovery gaps & blocked items

## Blocked by safety policy (need Owner decision / sandbox)

| Gap | Why blocked | Suggested next step |
|---|---|---|
| Persist create/edit/cancel appointment | Would change live schedule | Sandbox salon or Owner-supervised fixture window |
| Drag-reschedule conflict UX | Mutates appointments | Same |
| Customer search result ranking / history panel | Retrieves personal records | Redacted test customers only |
| Create customer/employee/service/absence | Persistent writes | Sandbox |
| Run Data export | Exports live business/customer data | Owner provides redacted export sample for M15 |
| Send messages / reminders / waitlist notify | Outbound comms | Disabled in discovery |
| Online booking Save / widget publish | Persistent config | Read-only remains |

## Partially verified (chrome observed, deep fields incomplete)

| Area | Missing detail |
|---|---|
| Customer groups / labels admin | 2026-11-08: two system segments and a Favourite label chip were seen. Create-label rules and custom fields still open |
| Customer profile tabs | Overview and Appointments columns seen. Sales, Reports, Forms, Loyalty interiors not opened |
| Employee detail editor | Color, services eligibility, login link, location assignment |
| Service edit dialog | Processing time, buffer, resource requirements, online visibility |
| Timetable cell editor | One-day vs future pattern UI |
| Absence create form | Scope selectors |
| Recurring appointment builder | After Repeat toggle |
| Message templates | Email/SMS body variables |
| Appointment requests module | Approval workflow |
| `/online` public hub | Beyond admin online-bookings |
| Company information | Address/legal fields |
| Multi-location | Second location not present/explored |
| Day view live | Relied on prior UI_REFERENCE + references for density |

## Unverified behavioral claims (do not implement as “Salonized fact” without re-check)

1. Exact concurrency message text on double-book save.
2. Whether Save on edit allows overbooking with warning vs hard block.
3. Package booking line expansion rules.
4. Resource double-booking prevention details.
5. Import path existence inside Integrations.

## Unverified / partial interaction & motion (2026-11-08 extension)

See [`UI_INTERACTION_AND_MOTION_SPEC.md`](UI_INTERACTION_AND_MOTION_SPEC.md) and [`INTERACTION_COVERAGE_MATRIX.md`](INTERACTION_COVERAGE_MATRIX.md).

| Gap | Why incomplete | Next step |
|---|---|---|
| Live drag-and-drop snap / invalid-drop UI | Would mutate appointments | Sandbox + NS-009; CSS-only evidence today |
| Appointment / slot hover paint timing | No reliable hover tool; calendar PII blocks screenshots | Sandbox empty calendar + Playwright `hover` |
| Sidebar / toolbar tooltips | Synthetic `mouseenter` showed no tip | Real pointer hover in sandbox |
| Customer search dropdown motion + ranking | Live PII | Redacted test customers |
| Save success / error toast live timing | No save allowed | Sandbox write window |
| Empty-slot click → create prefill | Accidental persist risk | Sandbox |
| Full keyboard tab order / focus trap in create | Focus not trapped today in Salonized | SalonFlow must improve; re-check after NS-008 |
| Escape closes list vs whole sheet | Observed whole-sheet close when Search focused | Decide SalonFlow policy (list-first) and test |
| Exact create-open duration | Only ~92ms class-sample + CSS 0.1s family | Do not encode Salonized ms in CI |
| Salon switcher open animation | Not re-timed this pass | Optional polish pass |

## Checkpoint / resume point

Next discovery session should start with Owner-approved **sandbox writes** for:

1. Empty-slot create prefills (SF-018)
2. Employee detail + service eligibility
3. Service edit dialog
4. Timetable break editing
5. Waitlist → book conversion (without messaging if possible)
6. Drag conflict + save toast interaction capture (motion extension)

Until then, engineering can proceed on P0 booking slice using OBSERVED create/edit chrome + interaction spec (familiar motion, not clones) + Master Architecture + SF catalog.
