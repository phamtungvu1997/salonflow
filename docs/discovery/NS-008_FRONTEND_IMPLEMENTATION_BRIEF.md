# NS-008 — Frontend implementation brief (create appointment modal)

| Field | Value |
|---|---|
| Status | Implementation brief — docs only (no production UI change this pass) |
| Author | Frontend Engineer |
| Date | 2026-11-08 |
| Ticket | NS-008 / M09 (create sheet) + IT-09 / IT-10 |
| Depends on | NS-017 Owner merge (Engine APIs assumed present); Owner UI-01=B, UI-03=A, UI-06=A |
| Inputs | [`UI_INTERACTION_AND_MOTION_SPEC.md`](UI_INTERACTION_AND_MOTION_SPEC.md) · [`INTERACTION_COVERAGE_MATRIX.md`](INTERACTION_COVERAGE_MATRIX.md) · [`01_CREATE_APPOINTMENT.md`](01_CREATE_APPOINTMENT.md) · harness `src/features/calendar/calendar-board.tsx` |
| Rule | Salonized-*familiar* interaction quality, not pixel/motion cloning. Engine is sole booking writer. |

**Harness note:** `calendar-board.tsx` is a vertical-slice form under the day grid (`data-testid="booking-form"`). It proves Engine save / Stornieren / reload. It is **not** the product create UI. NS-008 replaces that inline form with a Salonized-style **modal** (Owner UI-01 **B**), keeping the same Engine write path.

---

## 0. Product decisions locked for this ticket

| ID | Decision | NS-008 impact |
|---|---|---|
| UI-01 B | Modal create chrome | Dialog/sheet over calendar, not harness inline card |
| UI-02 B | Dense day later | Keep current day grid; density polish is parallel/follow-on (NS-004), not a blocker for sheet open/save |
| UI-03 A | Walk-in | Explicit walk-in path; do not require customer when walk-in selected |
| UI-04 A | Stornieren wording | Out of create-sheet scope (edit path / NS-009); keep German cancel copy elsewhere |
| UI-05 A | Employee colors | Prefill/display uses staff color on calendar; sheet itself does not invent alternate color modes |
| UI-06 A | Find availabilities | Lightweight nested availability UI after hours solid; read-only Engine/availability API — UI never “authorizes” a slot |

German UI (`de-DE`), `Europe/Berlin`, `DD.MM.YYYY`, 24h, EUR. No POS / payments / invoices.

---

## 1. Component breakdown (files/modules to add)

Prefer feature modules under `src/features/booking/` + thin calendar openers. Add shadcn primitives only as needed (`dialog`, `input`, `label`, `command`/combobox). Do **not** expand CalendarAdapter for create chrome.

### 1.1 Proposed tree

```text
src/features/booking/
  create-appointment/
    create-appointment-modal.tsx      # Shell: dialog, open/close, focus, Escape, German title
    create-appointment-form.tsx       # Form state + submit orchestration
    use-create-appointment.ts         # Prefill from slot; idempotency key; submit modes
    create-appointment-api.ts         # Typed POST helpers (single-txn payload)
    types.ts                          # CreateAppointmentDraft, CustomerMode, ConflictPayload
  components/
    service-combobox.tsx              # Searchable service list (IX-03/04)
    employee-combobox.tsx             # Same pattern; filter by service eligibility
    customer-panel.tsx                # Search | new customer | walk-in (UI-03)
    datetime-fields.tsx               # Date + time (Berlin local) + duration display
    find-availabilities-dialog.tsx    # Nested dialog (UI-06); Apply writes draft only
    booking-error-banner.tsx          # Persistent 409/422; aria-live; no auto-dismiss via leave anim
    popular-services.tsx              # Optional chips — V1 if catalog exposes favorites; else stub later
src/components/ui/
  dialog.tsx                          # shadcn Dialog (role=dialog, aria-modal)
  # input / label / command as needed
src/styles/tokens.css                 # Motion tokens (section 2)
e2e/
  create-appointment.spec.ts          # IX-01…IX-05 + IT-09/IT-10
```

### 1.2 Module responsibilities

| Module | Owns | Does not own |
|---|---|---|
| `create-appointment-modal.tsx` | Open/close, focus trap, restore to opener, reduced-motion class, `data-testid="create-appointment-dialog"` | Availability math; multi-event tabs (Absence/Chore/Note) |
| `create-appointment-form.tsx` | Field layout (service*, duration mirror, employee*, date/time, note, customer panel, primary **Termin erstellen**) | Deciding conflicts |
| `service-combobox.tsx` / `employee-combobox.tsx` | Local filter, listbox a11y, Escape-closes-list-first | Network search of full catalog if already loaded |
| `customer-panel.tsx` | Modes: `existing` \| `new` \| `walk-in`; German labels | PII ranking experiments |
| `find-availabilities-dialog.tsx` | Month day pick + Morning/Afternoon buckets + Apply → draft start | Persist booking |
| `use-create-appointment.ts` | Build Engine payload; disable double-submit; map API errors to banner | Optimistic “slot reserved” |
| Calendar board (thin change later) | CTA **Termin erstellen** + empty-slot click → open modal with prefill `{ staffId, date, start }` | Keep harness form until modal lands; then delete inline `booking-form` |

### 1.3 Field map (from discovery → SalonFlow German)

| Discovery (EN) | SalonFlow control | Required | Prefill / side effect |
|---|---|---|---|
| SERVICE * | `service-combobox` | Yes | Filter to staff-eligible; on pick → set duration minutes + price display |
| DURATION | read-mostly input (editable later if SPEC allows) | Derived | Overrides from service snapshot (SF-016 snapshot on save) |
| EMPLOYEE * | `employee-combobox` | Yes | Prefill from clicked column |
| Date / Time | `datetime-fields` | Yes | Prefill from slot / calendar `datum` |
| Find availabilities | nested dialog | Optional | UI-06; after hours / empty day messaging from Engine read |
| Note | textarea | No | SF-029 |
| Search customer / + Add / Walk-in | `customer-panel` | Walk-in **or** customer | UI-03; SF-018/020 |
| Create appointment | primary button | — | German **Termin erstellen**; idempotency key per attempt |

**V1 defer (do not block IT-09/10):** Absence/Chore/Note tabs, Repeat appointment, + Add another service (SF-021 multi-line), + Add another date, Popular services chips if no API, Dashboard quick-start routes.

### 1.4 Backend contract touchpoints (FE consumes; BE co-owns)

Current harness path is **two HTTP calls** (`POST /api/customers` then `POST /api/appointments` with required `customerId`). That violates SF-020 for “new customer inside booking.”

NS-008 FE must call **one** write:

```text
POST /api/appointments
Idempotency-Key: <uuid>
{
  salonId, staffId, serviceId, date, start,
  customerMode: "existing" | "new" | "walk-in",
  customerId?: string,          // existing
  newCustomer?: { displayName }, // new — created only if appointment commits
  guestDisplayName?: string,     // walk-in — customerId null
  notes?: string
}
```

Align payload names with Engine after BE lands (Master Architecture shows `guestDisplayName` / nullable `customerId`). FE brief: **do not ship** UI that creates customer then books in two steps.

Availability read (UI-06): `GET` candidate slots for staff+service+day — exact path owned by backend; FE only displays and Applies into draft.

---

## 2. Motion CSS tokens to add

Add to `src/styles/tokens.css` (and wire utilities in `globals.css`). Familiar durations from discovery; **not** cubic-bezier clones required in CI.

```css
:root {
  /* Motion — NS-008 / calendar chrome */
  --motion-fast: 100ms;          /* list fade-slide, overlay opacity */
  --motion-base: 150ms;          /* dialog enter, button bg, chevron */
  --motion-toast: 200ms;         /* success toast enter only */
  --motion-ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --motion-ease-pop: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* overlay only */
  --motion-distance-y: 10px;     /* list/sheet enter translate */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
    --motion-toast: 0ms;
    --motion-distance-y: 0px;
  }
}
```

### Utility classes (proposed)

| Class | Use | Reduced motion |
|---|---|---|
| `.sf-motion-overlay-enter` | Dialog + backdrop opacity (+ optional translateY) over `--motion-base` + `--motion-ease-pop` | Instant show |
| `.sf-motion-list-enter` | Combobox list: opacity + `translateY(calc(-1 * var(--motion-distance-y)))` over `--motion-fast` | Instant |
| `.sf-motion-chevron` | `transform` 180° over `--motion-fast` | Instant flip |
| `.sf-motion-press` | Primary button `:active { transform: scale(0.97) }` with `transition-duration: 0s` on transform | **Disabled** under reduce (match Salonized CSS intent) |
| `.sf-motion-fade` | Optional calendar data swap ≤ `--motion-fast` | Instant |

**Hard rules**

- No continuous pulse on booking surfaces.
- Error banner / toast **must not** auto-remove via leave animation; dismiss is explicit or until next successful save.
- Do **not** assert ms/easing in Playwright (discovery IX plan).

---

## 3. Playwright IX-01…IX-05 → selectors / tests

New file: `e2e/create-appointment.spec.ts`. Prefer `getByRole` + stable `data-testid`. Keep fictional names only.

| ID | Behavior | Concrete selectors / asserts |
|---|---|---|
| **IX-01** | Open create sheet | Opener: `getByTestId("create-appointment-open")` **or** empty slot `getByTestId("slot-{staffId}-{HH:mm}")` / `getByRole("button", { name: `${staff} ${time}` })`. Assert `getByTestId("create-appointment-dialog")` visible with `role="dialog"`; focus inside dialog (`getByTestId("create-appointment-title")` or first field `create-service-trigger`). |
| **IX-02** | Escape closes; restore opener | With dialog open (no nested list): `page.keyboard.press("Escape")` → dialog hidden; opener focused (`create-appointment-open` or originating slot). |
| **IX-03** | Service combobox | Click `getByTestId("create-service-trigger")` → listbox `create-service-listbox` visible; search `create-service-search` focused; type catalog fragment → `create-service-option` count decreases; pick one → duration `create-duration` updates. |
| **IX-04** | Escape closes **list first** | Open service list → Escape → listbox hidden, **dialog still open**; second Escape → dialog closed (SalonFlow policy — improve on Salonized). |
| **IX-05** | Walk-in save path | Select walk-in `getByTestId("create-customer-walk-in")`; fill service + ensure employee/time; `getByTestId("create-appointment-submit")` → success message / card on grid; **no** customer required. Maps IT-09 walk-in branch. |

### IT-09 / IT-10 (acceptance; same suite)

| Test | Flow | Assert |
|---|---|---|
| **IT-09** | Empty slot → service → existing **or** walk-in → save → reload | Card in staff column (`appointment-*` or role button with customer/walk-in label); survives `page.reload()` |
| **IT-10** | Mode **new customer** inside sheet → single POST → profile linked | Intercept/network: **one** booking write (no prior orphan `POST /api/customers` alone); after save, customer appears in search/admin with appointment link |

### Suggested `data-testid` contract (freeze early)

```text
create-appointment-open
create-appointment-dialog
create-appointment-title
create-appointment-close
create-service-trigger | create-service-search | create-service-listbox | create-service-option
create-employee-trigger | create-employee-search | create-employee-listbox
create-duration
create-date | create-time
create-find-availabilities | find-availabilities-dialog | find-availabilities-apply
create-note
create-customer-search | create-customer-new | create-customer-walk-in | create-customer-name
create-appointment-submit
create-appointment-error          # aria-live="assertive" or polite
calendar-message                  # keep existing success string channel if useful
```

IX-06…IX-11 (day columns, date next, focus-visible, reduced-motion, drag 409, hover) stay **out of NS-008 critical path** except optional IX-09 smoke on the dialog open.

---

## 4. Risks

### 4.1 SF-020 — customer + book single transaction

| Risk | Detail | Mitigation |
|---|---|---|
| Orphan customer | Harness today: `POST /api/customers` then `POST /api/appointments`. If book 409/5xx after customer 201, orphan profile. | BE: create customer inside appointment txn (or compensating delete — prefer txn). FE: single submit API only. IT-10 fails if two-step remains. |
| Walk-in vs required `customerId` | Current Zod `customerId: z.string().min(1)` blocks UI-03. | BE must allow null + `guestDisplayName` / walk-in mode before FE enables submit. |
| Idempotency | Double-click **Termin erstellen** | Client UUID per attempt; disable button while in flight; show Engine reused response as success without duplicate card. |

### 4.2 409 / validation visibility vs animations

| Risk | Detail | Mitigation |
|---|---|---|
| Error cleared by leave anim | Toast leave 0.1s could hide conflict text | `booking-error-banner` stays mounted until dismiss or successful save; toast optional **after** success only |
| Dialog close on 409 | User loses draft | On 409/422: **keep dialog open**, retain field values, focus error banner (`aria-live`) |
| Optimistic UI | FE must not paint “saved” card before 2xx | Wait for Engine; then reload calendar query. No fake persistence. |
| Motion distraction | Scale/slide during error | Disable press-scale while `submitting` or `error`; reduced-motion → instant |

German conflict copy comes from API `error` / machine code map (`STAFF_OCCUPIED`, `OUTSIDE_SHIFT`, …) — never invent “success” animation on failure.

### 4.3 Other

- **Find availabilities (UI-06)** accuracy depends on hours/absences (NS-006 remainder). Ship nested dialog against read API; empty-state copy OK; do not block IT-09 if Apply is optional when slot already prefilled.
- **Focus trap** must exceed Salonized (see §5); test IX-01/02.
- **CalendarAdapter** unused for modal — avoid dragging NS-008 into adapter refactors.

---

## 5. Explicitly NOT copying from Salonized

| Salonized observation | SalonFlow stance |
|---|---|
| No `role="dialog"` / `aria-modal` on create overlay | **Require** dialog semantics |
| Weak / missing focus trap; focus can remain on CTA link while sheet open | **Move focus** into dialog on open; trap Tab; restore opener on close |
| Escape from service Search closes **entire** sheet | **Escape closes list first**, then sheet (IX-04) |
| `aria-expanded` null on selects | Combobox pattern with `aria-expanded`, `aria-controls`, listbox options |
| `body` overflow remains `visible`; calendar stays fully interactive behind | Prefer inert/backdrop + `aria-modal`; disable underlying pointer interaction while open |
| English discovery labels | German strings only in product UI |
| Vue enter class timing / exact cubic-bezier | Familiar short motion via tokens only — no pixel/motion cloning |
| Absence / Chore / Note tabs in same shell | Appointment-only for NS-008 |
| Repeat + multi-date + multi-service affordances | Defer (SF-021/032 later) |
| Live toast scale choreography | Optional success toast; not required for IT-09 |
| URL route `/calendar/create-event/appointment` | Optional deep-link later; modal state may be React-only in V1 |
| Missing dialog a11y, tooltip-only icon labels, color-only selection | Fix a11y; employee color + text/pattern (UI-05) |
| Any real customer PII / unredacted screenshots | Forbidden |

---

## 6. Implementation sequence (when coding starts)

1. Branch from post–NS-017 base (Owner-merged Engine).  
2. Add motion tokens + Dialog primitive (no calendar rewrite).  
3. Modal shell + open from slot/CTA (IX-01/02).  
4. Service/employee comboboxes (IX-03/04).  
5. Customer panel walk-in + existing (IX-05); wire **single-txn** create with BE.  
6. Error banner + 409 retain-draft.  
7. Find availabilities nested dialog (UI-06) when read API ready.  
8. Playwright IT-09/IT-10 + IX-01…05; remove harness inline `booking-form` once green.  
9. Draft PR with commands/evidence; independent review — **no self-merge**.

---

## 7. Out of scope this ticket

- Dense day visual overhaul (UI-02 / NS-004 polish)
- Drag/resize / Stornieren edit path (NS-009; UI-04)
- Waitlist, notifications, recurrence, POS
- Production deploy / merge to `main` without Owner
- Modifying production components in the discovery→brief pass (this document only)
)
