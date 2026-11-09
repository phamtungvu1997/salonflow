# UI interaction and motion specification (Salonized → SalonFlow)

| Field | Value |
|---|---|
| Status | Discovery extension — interaction/motion |
| Observation date | 2026-11-08 |
| Account | Jeannie Nagelstudio (Salonized) — read-only |
| Governing product UI | Owner UI-01…UI-07 (Salonized-style modal, dense day, walk-in, Stornieren, employee colors, Find availabilities) |
| Labels | **OBSERVED** live · **DOCUMENTED** CSS/stylesheet · **PROPOSED** SalonFlow · **UNVERIFIED** not safely confirmed |
| Safety | No appointment save/edit/cancel. No customer search with results saved. No live drag of appointments. No unredacted calendar screenshots committed. |

**Rule:** Aim for Salonized-*familiar* interaction quality, not pixel/motion cloning. Prefer short, purposeful motion; support `prefers-reduced-motion`; never hide booking errors behind animation.

Related: [`INTERACTION_COVERAGE_MATRIX.md`](INTERACTION_COVERAGE_MATRIX.md) · [`DISCOVERY_GAPS.md`](DISCOVERY_GAPS.md) · [`01_CREATE_APPOINTMENT.md`](01_CREATE_APPOINTMENT.md)

---

## 1. Motion system (observed tokens)

From accessible stylesheets + live class samples (**DOCUMENTED** / **OBSERVED**):

| Token / class family | Behavior | Duration / easing | Confidence |
|---|---|---|---|
| `fade-slide-down-*` | Dropdown list enter/leave: opacity + `translateY(-10px)` | **0.10s** | DOCUMENTED CSS |
| `chevron` / `chevron-reverse-*` | Select chevron flip | **0.12s** transform+opacity | DOCUMENTED CSS |
| `pop-enter-active` | Popover pop-in | **0.15s** `cubic-bezier(0.175, 0.885, 0.32, 1.275)` + opacity 0.15s | DOCUMENTED CSS |
| Primary button (`_base_dycf3_*`) | Hover bg; **active** `scale(0.97)` with `transition-duration: 0s` on press | bg **0.15s**; scale instantaneous | DOCUMENTED CSS |
| `@media (prefers-reduced-motion: reduce)` | Disables button active scale; also disables root view-transitions | n/a | DOCUMENTED CSS |
| `calendar-item` opacity | Soften non-highlighted / preview modes | **0.15s** | DOCUMENTED CSS |
| FullCalendar drag | `.fc-event-dragging` opacity **0.75**; selected drag adds shadow | n/a (FC default) | DOCUMENTED CSS only — live drag **UNVERIFIED** |
| Toast `._notification_*` | Enter scale 0.5→1; leave fade | enter **0.2s** (+0.1s delay), leave **0.1s** | DOCUMENTED CSS — live toast **UNVERIFIED** (no save) |
| Create overlay Vue classes | `v-enter-active` / `v-enter-to` on content + background | Class present ~**92ms** after CTA click (**OBSERVED** sample); exact curve tied to 0.1s opacity rules nearby | OBSERVED sample + DOCUMENTED |
| Tabs underline `._tabsLine_*` | left/width animate | **0.2s** cubic-bezier(0.215, 0.61, 0.355, 1) | DOCUMENTED CSS |
| List fade / list-pop-slide | Longer list transitions exist in bundle | 0.15–0.4s | DOCUMENTED — not all exercised |

Sanitized token board: [`screenshots/interaction-motion-tokens.svg`](screenshots/interaction-motion-tokens.svg)

**SalonFlow (PROPOSED):** reuse a small token set (`--motion-fast: 100ms`, `--motion-base: 150ms`, spring-ish only for overlays). Disable non-essential motion under `prefers-reduced-motion`. No continuous pulse on booking surfaces.

---

## 2. Priority surfaces

### 2.1 Create appointment (popover sheet) — UI-01

| Step | Observation |
|---|---|
| Initial | Calendar week/day visible; CTA **Create appointment** |
| Trigger | Click CTA (**OBSERVED**) → URL `/calendar/create-event/appointment` |
| Intermediate | Vue enter classes on overlay content/background (~92ms sample) |
| Final | Create sheet over calendar; tabs Appointment/Absence/Chore/Note; fields Service*, Duration, Employee*, date/time, Find availabilities, note, Search customer |
| Chrome | Absolute popovers (`popoverCreate`), box-shadow `rgba(0,0,0,.15) 0 0 5px`; **no** `role="dialog"` / `aria-modal` on observed nodes (**OBSERVED**) |
| Close (X) | Close controls exist as `div._close_*` (**OBSERVED** DOM); click-close not re-timed this pass |
| Escape | With sheet open (no nested list): closes sheet, URL returns to `/calendar`, focus often restores to **Create appointment** link (**OBSERVED**). With service Search focused: Escape closed sheet; focus landed on `body` (**OBSERVED**) |
| Focus trap | **UNVERIFIED** / weak: focus not forced into sheet on open (active element remained a link) |
| Body scroll | `body` overflow remained `visible` while sheet open (**OBSERVED**) — calendar still in a11y tree |

**SalonFlow required:** Modal/sheet with explicit dialog semantics (`role="dialog"`, `aria-modal="true"`), focus move to first field or title on open, focus restore to opener on close, Escape closes, German copy. Short open/close (≤150ms) or instant under reduced-motion. Engine remains sole writer; 409/validation must stay visible (no auto-dismiss animation that clears errors).

### 2.2 Service selector

| Step | Observation |
|---|---|
| Initial | Placeholder **Select** |
| Trigger | Click select control |
| Intermediate | `fade-slide-down` + chevron-reverse classes (**OBSERVED** ~24–29ms into transition) |
| Final | List ~360px tall; categories + name + € price; **Search…** input **auto-focused** (**OBSERVED**) |
| Filter | Typing `Shellac` narrowed priced options (**OBSERVED**; catalog names only) |
| Scroll | List content scrollable in practice; outer `overflowY: visible` on list node (**OBSERVED**) — treat inner scroll as implementation detail |
| aria-expanded | **null** on select root (**OBSERVED**) — a11y gap to improve in SalonFlow |

**SalonFlow required:** Searchable combobox; keyboard arrow/Enter/Escape; filter without network on full catalog if loaded; show duration side-effect after pick (existing discovery). Playwright: open, type filter, assert option count, Escape closes list without saving.

### 2.3 Employee selector

Same select pattern as service (**OBSERVED** twin **Select** control). Deep filter/keyboard **partially** covered by shared component CSS; staff-only filter pass not re-done this session (**UNVERIFIED** incremental).

### 2.4 Customer search / walk-in (UI-03)

| Step | Observation |
|---|---|
| Control | Textbox placeholder **Search customer** (**OBSERVED**) |
| Results / ranking | Not exercised (PII / live data policy) — **UNVERIFIED** |
| Walk-in | Prior discovery: appointments possible without customer — **OBSERVED** historically; not re-proven this pass |

**SalonFlow required:** Search + explicit **Walk-in** path; do not block save solely for missing customer when walk-in selected. No animation on validation errors.

### 2.5 Calendar — week vs dense day (UI-02)

| Step | Observation |
|---|---|
| Week→Day | View select toggles; Day shows **employee column headers** (Jennifer, Lena, …) and date label `Sun, Nov 08, 2026` (**OBSERVED**) |
| Today | Control receives `active` + `focused` states (**OBSERVED**) |
| Date next | Day advances `Sun, Nov 08` → `Mon, Nov 09`; DOM mutations ~30ms; **no** visible preloader (**OBSERVED**) |
| Slot hover highlight | FullCalendar `.fc-highlight` + `--fc-highlight-color` present in CSS (**DOCUMENTED**); live hover paint **UNVERIFIED** (no hover tool / no PII screenshot) |
| Appointment card hover | FC resizer shown on `:hover`; `.is-highlighted` shadow rules (**DOCUMENTED**); live **UNVERIFIED** |
| Loading skeleton | Preloader keyframes exist in bundle; not seen on date step (**OBSERVED** absence) |

**SalonFlow required:** Dense multi-column day as primary; week secondary. Date changes feel immediate; optional subtle fade ≤100ms on data swap, never blocking. Employee-based colors (UI-05) with future mode hook.

### 2.6 Drag and drop

| Evidence | Notes |
|---|---|
| CSS | Dragging opacity 0.75; mirror z-index; selected drag shadow (**DOCUMENTED**) |
| Live drag / invalid drop / snap | **Not executed** (would mutate live schedule) — **UNVERIFIED** |
| Preview mode | `.calendar-wrap--preview` dims other items to opacity 0.5 (**DOCUMENTED**) |

**SalonFlow required (NS-009):** Optimistic preview allowed; on Engine 409 revert instantly with visible German error; no success animation if write failed. Respect reduced-motion (instant revert OK).

### 2.7 Sidebar / salon switcher

| Step | Observation |
|---|---|
| Active nav | Calendar link `aria-current="page"` + `_isActive_*` (**OBSERVED**) |
| CTA button motion | Create appointment: `transition: background-color 0.15s, transform 0.15s`; focus-visible ring via `--focus-ring` (**DOCUMENTED**) |
| Icon tooltips | Synthetic mouseenter produced **no** tooltip node (**UNVERIFIED** real hover) |
| Salon switcher | Not re-opened this pass; prior discovery exists — treat chrome as known, motion **UNVERIFIED** |

### 2.8 Save / success / error

| Path | Status |
|---|---|
| Successful save toast | CSS tokens only — **UNVERIFIED** live |
| Validation on empty required | **UNVERIFIED** this pass (avoid noise); prior create doc notes required * |
| Conflict / 409 | Salonized text **UNVERIFIED**; SalonFlow must show persistent inline/toast until dismissed |

---

## 3. Keyboard & pointer matrix (summary)

| Action | Result | Confidence |
|---|---|---|
| Escape (sheet open) | Closes create; URL back; focus often to CTA | OBSERVED |
| Escape (search in service list) | Closed entire sheet (not list-only) | OBSERVED |
| Tab order in sheet | **UNVERIFIED** complete pass | — |
| Pointer click empty slot → create | **UNVERIFIED** (mutation risk) | — |
| Touch | CSS has `body.is-touch` hover→active mapping for primary button | DOCUMENTED |

---

## 4. Accessibility expectations for SalonFlow (PROPOSED)

1. Dialog semantics + focus trap on create/edit sheets.  
2. Combobox pattern (`aria-expanded`, `aria-controls`, listbox options).  
3. Visible `:focus-visible` rings (Salonized documents `--focus-ring` on buttons).  
4. `prefers-reduced-motion: reduce` disables scale/slide; keep state changes instant.  
5. Do not rely on color alone for selected appointment (UI-05 employee color + pattern/border).  
6. Errors announced (aria-live) and not auto-removed by leave animations.

---

## 5. Playwright verification plan

Automatable **without** claiming motion-perfect pixels:

| ID | Behavior | Assert |
|---|---|---|
| IX-01 | Open create sheet | dialog/sheet visible; focus in sheet |
| IX-02 | Escape closes | sheet hidden; focus back to opener |
| IX-03 | Service combobox | open → Search focused → filter reduces options |
| IX-04 | Escape closes list or sheet (define SalonFlow: list first) | list hidden; sheet policy explicit |
| IX-05 | Walk-in path | can save without customer when Walk-in selected (IT-09/10) |
| IX-06 | Day view columns | ≥2 staff columns visible |
| IX-07 | Date next | date label changes; no crash |
| IX-08 | Focus-visible | tab to primary button shows ring (CSS class or computed outline) |
| IX-09 | Reduced motion | emulate `prefers-reduced-motion`; open sheet still usable |
| IX-10 | Drag conflict | drag to busy → UI reverts + error text (NS-009; Engine 409) |
| IX-11 | Hover slot (optional) | `locator.hover` + class/highlight attached — soft assert |

Do **not** assert exact cubic-bezier or ms timing in CI.

---

## 6. Handoff

Delivered to **UI/UX Designer** and **Frontend Engineer** for NS-008 (create modal) and calendar density (UI-02). Implementation must follow Master Architecture V2 + SF rules; this file does not override booking Engine authority.
