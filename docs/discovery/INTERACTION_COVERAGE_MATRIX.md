# Interaction coverage matrix

Evidence labels: **OBSERVED** · **DOCUMENTED** (CSS) · **PROPOSED** · **UNVERIFIED**  
Screenshots: only sanitized assets under `screenshots/`. Live calendar frames with customer names were **not** committed.

| ID | Component | Trigger | Initial | Intermediate | Final | Visual feedback | Motion / transition | A11y | Evidence | Confidence | Required SalonFlow behavior | Automated test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IX-CAL-01 | Create CTA | Click **Create appointment** | Calendar toolbar | Vue `v-enter-active` on overlay (~92ms sample) | Create sheet + URL `.../create-event/appointment` | Sheet shadow; calendar remains behind | Short enter (~0.1–0.15s family) | Focus not trapped; no `role=dialog` | Live session 2026-11-08; motion SVG | OBSERVED + DOCUMENTED | Dialog sheet; focus in; German; Engine save only | IX-01 Playwright visibility + focus |
| IX-CAL-02 | Create sheet | Escape | Sheet open | Popovers `display:none` | `/calendar`; CTA often focused | Sheet gone | Leave CSS present; duration not re-measured | Focus restore partial | Live Escape trials | OBSERVED | Escape closes; restore opener | IX-02 |
| IX-CAL-03 | Create sheet | Escape while service Search focused | List + sheet open | — | Entire sheet closed; focus `body` | Sheet gone | UNVERIFIED list-vs-sheet precedence intent | Focus loss | Live | OBSERVED | Prefer: Escape closes list first, second Escape closes sheet | IX-04 policy test |
| IX-SVC-01 | Service select | Click Select | Placeholder Select | `fade-slide-down` + chevron-reverse | List ~360px; **Search…** focused | Category headers + € prices | 0.10s list / 0.12s chevron (CSS) | `aria-expanded` null | Live + CSS | OBSERVED / DOCUMENTED | Accessible combobox | IX-03 |
| IX-SVC-02 | Service search | Type catalog term e.g. Shellac | Full list | — | Filtered options | List updates | No extra motion observed | Search focused | Live filter (catalog only) | OBSERVED | Client filter snappy | IX-03 filter assert |
| IX-EMP-01 | Employee select | Click twin Select | Placeholder | Same select system | Staff list (prior discovery) | Same chrome | Shared tokens | Same a11y gap | Prior + this pass structure | PARTIAL | Qualified staff only | Share IX-03 pattern |
| IX-CUS-01 | Customer search | Focus / type | Empty Search customer | — | Results | — | — | — | Not opened (PII) | UNVERIFIED | Search + Walk-in (UI-03) | IT-10 / IX-05 |
| IX-CAL-04 | View switcher | Week → Day | Week grid | List open with Day option | Day + employee columns | Headers = staff names | Select list motion | — | Live | OBSERVED | Dense day primary (UI-02) | IX-06 |
| IX-CAL-05 | Today | Click Today | Any day | — | Today; control `active`+`focused` | Focus ring/state | Button 0.15s tokens | focus-visible documented | Live | OBSERVED | Clear Today affordance | Soft assert states |
| IX-CAL-06 | Date next | Click next chevron | e.g. Sun Nov 08 | Mutations ~30ms | Mon Nov 09 | No preloader seen | Immediate data swap | — | Live | OBSERVED | Instant; optional ≤100ms fade | IX-07 |
| IX-CAL-07 | Slot hover | Pointer over empty slot | Grid cell | fc-highlight CSS | Highlighted slot | `--fc-highlight-color` | UNVERIFIED paint timing | — | CSS only | DOCUMENTED / live UNVERIFIED | Subtle hover; click opens sheet | Optional IX-11 hover |
| IX-CAL-08 | Appointment hover | Pointer over event | Card | — | Resizer / highlight CSS | Shadow when `.is-highlighted` | opacity 0.15s on items | — | CSS | DOCUMENTED / live UNVERIFIED | Clear selected state | Later visual |
| IX-DND-01 | Drag appointment | Drag | Event at slot | `.fc-event-dragging` opacity 0.75 | Drop / cancel | Mirror / preview CSS; preview dims others 0.5 | FC defaults | — | CSS only — **no live drag** | DOCUMENTED / UNVERIFIED UX | Revert + error on 409; no fake success | IX-10 NS-009 |
| IX-NAV-01 | Sidebar active | Route calendar | Other page | — | `aria-current=page` + `_isActive_*` | Active style | `transition: all` 0s duration sampled on active link | current page | Live | OBSERVED | Clear active nav | e2e nav existing |
| IX-NAV-02 | Primary button hover/active | Hover/press CTA | Resting | — | Hover bg; active scale 0.97 | Color + scale | 0.15s bg; reduced-motion kills scale | focus-visible ring | CSS | DOCUMENTED | Same; German CTA | IX-08 / IX-09 |
| IX-NAV-03 | Sidebar tooltip | Hover icon | Icon only | — | Tooltip | — | — | title/aria often empty | Synthetic mouseenter failed | UNVERIFIED | Optional labels; don’t depend on tooltip | Manual / optional |
| IX-SAL-01 | Salon switcher | Open select | Current salon | — | Other salons | — | Select tokens likely shared | — | Prior discovery; not re-timed | UNVERIFIED motion | Keep existing e2e salon switch | Existing nav e2e |
| IX-FB-01 | Save success toast | Save appointment | Dirty form | Enter scale toast CSS | Success | Notification card | 0.2s enter / 0.1s leave CSS | — | CSS only | UNVERIFIED live | Show success; don’t block calendar | After sandbox writes |
| IX-FB-02 | Validation / 409 | Save invalid / conflict | Form filled | — | Error visible | Inline or toast | Must not auto-clear via leave alone | aria-live PROPOSED | Save blocked in discovery | UNVERIFIED Salonized copy | Persistent German error | API 409 e2e |
| IX-MOD-01 | Find availabilities | Click control | Create sheet | — | Availability UI (prior) | — | — | — | Prior create doc; not re-opened | PARTIAL | UI-06 after hours reliable | Later |
| IX-RM-01 | Reduced motion | OS/browser preference | Any | — | Scale/view-transition disabled in CSS | — | Media query present | Explicit support | CSS | DOCUMENTED | Honor preference | IX-09 |

## Coverage counts

| Confidence | Count (approx.) |
|---|---|
| OBSERVED (live interaction) | 10 |
| DOCUMENTED (CSS only) | 6 |
| PARTIAL | 2 |
| UNVERIFIED | 5+ (tooltips, drag live, customer search, save toasts, empty-slot create, full tab order) |

## Explicit non-claims

- No pixel-perfect or motion-perfect Salonized reproduction claimed.  
- No invented easing beyond strings copied from CSS.  
- Drag invalid-drop messaging not observed.  
- Toast copy after real save not observed.
