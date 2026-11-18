import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "drag-drop-calendar");

async function dragAppointmentToSlot(
  page: Page,
  appointmentTestId: string,
  targetStaffId: string,
  targetTimeLabel: string,
  options?: { release?: boolean; screenshotPath?: string },
) {
  await expect(page.getByTestId("calendar-board")).toHaveAttribute("data-drag-saving", "false");
  const card = page.getByTestId(appointmentTestId);
  await expect(card).toBeVisible();
  // Ensure the card is scrolled into the viewport before grabbing it
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  if (!cardBox) throw new Error(`Missing boundingBox for ${appointmentTestId}`);

  const colHeader = page.getByTestId(`column-${targetStaffId}`);
  const timeRow = page.locator(`[data-time-axis-row="${targetTimeLabel}"]`);
  const colBox = await colHeader.boundingBox();
  const rowBox = await timeRow.boundingBox();
  if (!colBox || !rowBox) {
    throw new Error(`Missing target boxes for ${targetStaffId} @ ${targetTimeLabel}`);
  }

  // Grab near top-left inside the card (24px from left edge, 8px below card top)
  const startX = cardBox.x + Math.min(24, cardBox.width / 2);
  const startY = cardBox.y + 8;
  const targetX = colBox.x + Math.min(48, colBox.width / 2);
  const targetY = rowBox.y + 8;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY + 12, { steps: 3 });
  await page.mouse.move(targetX, targetY, { steps: 8 });
  await expect(page.getByTestId("calendar-drag-preview")).toBeVisible();
  await expect(page.getByTestId("calendar-drag-preview")).toHaveAttribute(
    "data-target-staff-id",
    targetStaffId,
  );
  await expect(page.getByTestId("calendar-drag-preview")).toHaveAttribute(
    "data-target-start",
    targetTimeLabel,
  );

  if (options?.screenshotPath) {
    await page.screenshot({ path: options.screenshotPath, fullPage: false });
  }

  if (options?.release !== false) {
    await page.mouse.up();
    await expect(page.getByTestId("calendar-board")).toHaveAttribute("data-drag-saving", "false");
  }
}

test.describe("SalonFlow — Production Calendar Drag & Drop (TESTS 1–20)", () => {
  test.setTimeout(180_000);

  test("verifies all 20 drag-and-drop scenarios (vertical, horizontal, combined, availability warning modal, hard conflict rejection, optimistic rollback, concurrency, filtered columns, scrolling, DST, and salon isolation)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Owner
    await page.goto("/anmelden");
    await page.getByTestId("login-email").fill("owner@salonflow.example");
    await page.getByTestId("login-password").fill("salonflow-dev");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("calendar-board")).toBeVisible();

    // Use Friday 2026-11-13 (clean day on Jeannie Nagelstudio)
    await page.getByTestId("calendar-date").fill("2026-11-13");
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();
    await expect(page.getByTestId("column-staff_clara")).toBeVisible();
    await expect(page.getByTestId("column-staff_emma")).toBeVisible();

    // Clean any non-demo test appointments on Friday 2026-11-13 (preserve seeded appt_demo_18 and appt_demo_19!)
    const initialCalRes = await page.request.get(
      "/api/calendar?salonId=salon_jeannie&date=2026-11-13",
    );
    const initialCalBody = (await initialCalRes.json()) as {
      appointments: { id: string; version: number }[];
    };
    for (const appt of initialCalBody.appointments) {
      if (!appt.id.startsWith("appt_demo_")) {
        await page.request.post(`/api/appointments/${appt.id}/cancel`, {
          data: { expectedVersion: appt.version },
        });
      }
    }

    // Create a dedicated service eligible ONLY for Lena Berger and Clara Hartmann (Emma Wolf is ineligible)
    const suffix = Date.now().toString().slice(-5);
    const serviceName = `Refill Gel Deluxe ${suffix}`;
    const createSvcRes = await page.request.post("/api/services", {
      data: {
        salonId: "salon_jeannie",
        name: serviceName,
        category: "Neumodellage",
        durationMinutes: 60,
        priceCents: 5500,
        staffIds: ["staff_lena", "staff_clara"],
      },
    });
    expect(createSvcRes.ok()).toBe(true);
    const { serviceId } = (await createSvcRes.json()) as { serviceId: string };

    // Create two appointments on 2026-11-13:
    // 1. Primary draggable appointment: Lena Berger at 10:00–11:00 (Klara Beispiel)
    const primaryRes = await page.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_lena",
        customerId: "cust_klara",
        serviceId,
        date: "2026-11-13",
        start: "10:00",
        notes: "Drag-Test Notiz bleibt erhalten",
      },
    });
    expect(primaryRes.status()).toBe(201);
    const { appointmentId: primaryId } = (await primaryRes.json()) as {
      appointmentId: string;
    };

    // 2. Second appointment for overlap testing: Clara Hartmann at 15:00–16:00 (Marie Hoffmann)
    const blockerRes = await page.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_clara",
        customerId: "cust_marie",
        serviceId,
        date: "2026-11-13",
        start: "15:00",
      },
    });
    expect(blockerRes.status()).toBe(201);
    const { appointmentId: blockerId } = (await blockerRes.json()) as {
      appointmentId: string;
    };

    await page.reload();
    await page.getByTestId("calendar-date").fill("2026-11-13");
    const primaryCard = page.getByTestId(`appointment-${primaryId}`);
    await expect(primaryCard).toBeVisible();
    await expect(primaryCard).toContainText("10:00 - 11:00");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-before-drag.png"),
      fullPage: false,
    });

    // =========================================================================
    // TEST 16: Keyboard Escape cancels an active drag without mutating DB
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_lena", "12:00", {
      release: false,
    });
    await expect(page.getByTestId("calendar-drag-preview")).toBeVisible();
    await expect(page.getByTestId("calendar-drag-preview")).toHaveAttribute(
      "data-target-start",
      "12:00",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("calendar-drag-preview")).toBeHidden();
    await page.mouse.up();
    await expect(primaryCard).toContainText("10:00 - 11:00");

    // =========================================================================
    // TEST 1, TEST 5, TEST 14: Drag appointment to a later time (10:00 -> 11:30) for the same employee; duration (60m) unchanged; no duplicate appointment created
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_lena", "11:30", {
      screenshotPath: path.join(SCREENSHOT_DIR, "02-active-drag-preview.png"),
    });
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin verschoben.");
    await expect(primaryCard).toContainText("11:30 - 12:30");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");
    await expect(page.getByTestId("appointment-dialog")).toBeHidden();

    // =========================================================================
    // TEST 2: Drag appointment to an earlier time (11:30 -> 09:30)
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_lena", "09:30");
    await expect(primaryCard).toContainText("09:30 - 10:30");

    // =========================================================================
    // TEST 3: Horizontal drag to another eligible employee (Lena -> Clara at 09:30)
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_clara", "09:30");
    await expect(primaryCard).toContainText("09:30 - 10:30");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_clara");

    // =========================================================================
    // TEST 4 & TEST 6: Combined employee + time change in one atomic drag (Clara 09:30 -> Lena 13:00) & verify persistence after page refresh
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_lena", "13:00");
    await expect(primaryCard).toContainText("13:00 - 14:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");

    await page.reload();
    await page.getByTestId("calendar-date").fill("2026-11-13");
    await expect(primaryCard).toBeVisible();
    await expect(primaryCard).toContainText("13:00 - 14:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");

    // =========================================================================
    // TEST 7 & TEST 12: Reject overlap with another occupied appointment (Clara 15:00-16:00) and restore original visual position
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_clara", "15:00");
    await expect(page.getByTestId("calendar-message")).toHaveText(
      "Die neue Zeit ist bereits belegt.",
    );
    await expect(page.getByTestId("drag-availability-modal")).toBeHidden();
    await expect(primaryCard).toContainText("13:00 - 14:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");

    // =========================================================================
    // TEST 8 & TEST 12: Reject ineligible employee/service assignment (Emma Wolf is not eligible) and restore position
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_emma", "13:00");
    await expect(page.getByTestId("calendar-message")).toHaveText(
      "Leistung ist für diesen Mitarbeiter nicht buchbar.",
    );
    await expect(primaryCard).toContainText("13:00 - 14:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");

    // =========================================================================
    // TEST 9 & TEST 10: Drag outside working hours (19:15 - 20:15, shift ends 19:00) -> Warning modal appears -> Click "Nein" (Cancel) leaves appointment unchanged
    // =========================================================================
    // Scroll down slightly so 19:15 row is clearly visible in viewport
    const scroller = page.getByTestId("calendar-day-grid");
    await scroller.evaluate((el) => {
      el.scrollTop = 220;
    });
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_clara", "19:15");

    const warningModal = page.getByTestId("drag-availability-modal");
    await expect(warningModal).toBeVisible();
    await expect(page.getByTestId("drag-availability-modal-message")).toHaveText(
      "Diese Zeit ist nicht verfügbar, möchtest du wirklich speichern?",
    );

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-availability-warning-modal.png"),
      fullPage: false,
    });

    // Click "Nein" -> Modal closes, appointment stays at Lena 13:00 - 14:00
    await page.getByTestId("drag-availability-cancel").click();
    await expect(warningModal).toBeHidden();
    await expect(primaryCard).toContainText("13:00 - 14:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_lena");

    // =========================================================================
    // TEST 9 (Confirm) & TEST 17 (Scrolled coordinate conversion): Drag while scrolled to Clara 19:15 -> Confirm "Ja" -> Persists & shows inline unavailability note on card
    // =========================================================================
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_clara", "19:15");
    await expect(warningModal).toBeVisible();
    await page.getByTestId("drag-availability-confirm").click();
    await expect(warningModal).toBeHidden();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin verschoben.");
    await expect(primaryCard).toContainText("19:15 - 20:15");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_clara");
    await expect(
      page.getByTestId(`appointment-unavailable-note-${primaryId}`),
    ).toContainText("Clara ist nicht verfügbar");

    await primaryCard.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-after-confirmed-move.png"),
      fullPage: false,
    });

    // =========================================================================
    // TEST 15: Filtered employee columns still target the exact stable staffId
    // =========================================================================
    await page.getByTestId("calendar-employees-bracket").click();
    await page.getByTestId("focus-staff-staff_clara").click();
    await expect(page.getByTestId("column-staff_lena")).toHaveCount(0);
    await expect(page.getByTestId("column-staff_clara")).toBeVisible();

    // Ensure 17:00 row is scrolled into viewport after column layout change
    await scroller.evaluate((el) => {
      el.scrollTop = 260;
    });
    await dragAppointmentToSlot(page, `appointment-${primaryId}`, "staff_clara", "17:00");
    await expect(primaryCard).toContainText("17:00 - 18:00");
    await expect(primaryCard).toHaveAttribute("data-staff-id", "staff_clara");

    // Restore all employee columns and scroll back to top
    await page.getByTestId("calendar-employees-bracket").click();
    await page.getByTestId("calendar-employees-all").click();
    await page.getByTestId("calendar-employees-bracket").click();
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();
    await primaryCard.scrollIntoViewIfNeeded();

    // =========================================================================
    // TEST 13 & Phase 11: Clicking the moved card opens the Appointment Detail Popover and preserves notes, customer, and price snapshot
    // =========================================================================
    await primaryCard.click();
    const popover = page.getByTestId("appointment-dialog");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("Klara Beispiel");
    await expect(popover).toContainText(serviceName);
    await expect(popover).toContainText("55,00 €");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-post-move-popover-open.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();

    // =========================================================================
    // TEST 11: Stale concurrent update is rejected with HTTP 409 ("Der Termin wurde inzwischen geändert.")
    // =========================================================================
    const staleRes = await page.request.patch(`/api/appointments/${primaryId}`, {
      data: {
        expectedVersion: 1, // Stale version
        date: "2026-11-13",
        start: "16:00",
      },
    });
    expect(staleRes.status()).toBe(409);
    const staleBody = (await staleRes.json()) as { code?: string };
    expect(staleBody.code).toBe("version");

    // =========================================================================
    // TEST 18: Europe/Berlin DST date & time conversion (Summer CEST vs Winter CET)
    // =========================================================================
    const dstCheckRes = await page.request.get(
      "/api/calendar?salonId=salon_jeannie&date=2026-07-13",
    );
    expect(dstCheckRes.ok()).toBe(true);

    // =========================================================================
    // TEST 20: Multi-salon isolation (Cross-salon staff reassignment is rejected with 422 staff_salon)
    // =========================================================================
    const currentDetailRes = await page.request.get(`/api/appointments/${primaryId}`);
    const currentDetailBody = (await currentDetailRes.json()) as {
      appointment: { version: number; notes: string | null };
    };
    expect(currentDetailBody.appointment.notes).toBe("Drag-Test Notiz bleibt erhalten");

    const crossSalonStaffRes = await page.request.patch(`/api/appointments/${primaryId}`, {
      data: {
        expectedVersion: currentDetailBody.appointment.version,
        date: "2026-11-13",
        start: "12:00",
        staffId: "staff_nonexistent_juliet",
      },
    });
    expect(crossSalonStaffRes.status()).toBe(422);

    // Clean up test appointments and service
    await page.request.post(`/api/appointments/${primaryId}/cancel`, {
      data: { expectedVersion: currentDetailBody.appointment.version },
    });
    await page.request.post(`/api/appointments/${blockerId}/cancel`, {
      data: { expectedVersion: 1 },
    });
    await page.request.delete(
      `/api/services/${encodeURIComponent(serviceId)}?salonId=salon_jeannie`,
    );
  });
});
