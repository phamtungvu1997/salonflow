import path from "node:path";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "core-integration-milestone");

test.describe("SalonFlow — Core Integration & Stabilization Milestone (16-Step Verification)", () => {
  test.setTimeout(180_000);

  test("executes the complete 16-step cross-module booking, customer history, service snapshot, conflict, no-show, cancel, and absence workflow against PostgreSQL", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Owner
    await page.goto("/anmelden");
    await page.getByTestId("login-email").fill("owner@salonflow.example");
    await page.getByTestId("login-password").fill("salonflow-dev");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("calendar-board")).toBeVisible();

    // Ensure no leftover test absences or unarchived Hannah Lindemann customers exist from interrupted runs
    const existingAbsRes = await page.request.get("/api/absences?salonId=salon_jeannie");
    if (existingAbsRes.ok()) {
      const existingAbsBody = (await existingAbsRes.json()) as {
        absences?: { id: string; description: string }[];
      };
      for (const a of existingAbsBody.absences ?? []) {
        if (a.description === "Zahnarzttermin") {
          await page.request.delete(
            `/api/absences?salonId=salon_jeannie&id=${encodeURIComponent(a.id)}`,
          );
        }
      }
    }
    const existingCustRes = await page.request.get(
      "/api/customers?salonId=salon_jeannie&q=Hannah%20Lindemann-",
    );
    if (existingCustRes.ok()) {
      const existingCustBody = (await existingCustRes.json()) as {
        customers?: { id: string; displayName: string }[];
      };
      for (const c of existingCustBody.customers ?? []) {
        if (c.displayName.startsWith("Hannah Lindemann-")) {
          await page.request.delete(
            `/api/customers/${encodeURIComponent(c.id)}?salonId=salon_jeannie`,
          );
        }
      }
    }

    const suffix = Date.now().toString().slice(-5);
    const serviceName = `Spa Maniküre Deluxe ${suffix}`;
    const customerFirst = "Hannah";
    const customerLast = `Lindemann-${suffix}`;
    const customerFull = `${customerFirst} ${customerLast}`;

    // =========================================================================
    // STEP 1 & 2: Create a service in Settings and assign duration, price, and eligible employee
    // =========================================================================
    await page.getByTestId("nav-einstellungen").click();
    await page.getByTestId("settings-nav-services").click();
    await expect(page.getByTestId("settings-section-services")).toBeVisible();

    await page.getByTestId("services-create-new-dropdown-btn").click();
    await page.getByTestId("services-menu-add-service").click();
    await expect(page.getByTestId("service-editor-modal")).toBeVisible();

    await page.getByTestId("service-modal-name").fill(serviceName);
    await page.getByTestId("service-modal-price").fill("52,00");
    await page.getByTestId("service-modal-duration").selectOption("60");

    // Assign ONLY Lena Berger and Clara Hartmann
    await page.getByTestId("service-modal-toggle-all-staff").click();
    const lenaBox = page.getByTestId("service-modal-staff-Lena Berger");
    const claraBox = page.getByTestId("service-modal-staff-Clara Hartmann");
    if (!(await lenaBox.isChecked())) await lenaBox.check();
    if (!(await claraBox.isChecked())) await claraBox.check();

    await page.getByTestId("service-modal-save").click();
    await expect(page.getByTestId("service-editor-modal")).toBeHidden();
    await expect(page.getByTestId("services-settings-feedback")).toContainText(serviceName);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "step01-settings-service-created.png"),
      fullPage: false,
    });

    // =========================================================================
    // STEP 5: Create a fictional customer in Customers (/kunden)
    // =========================================================================
    await page.getByTestId("nav-kunden").click();
    await expect(page.getByTestId("customer-admin")).toBeVisible();
    await page.getByTestId("customer-create-open").click();
    await expect(page.getByTestId("customer-form-modal")).toBeVisible();
    await page.getByTestId("customer-name").fill(customerFirst);
    await page.getByTestId("customer-last-name").fill(customerLast);
    await page.getByTestId("customer-email").fill(`hannah.${suffix}@beispiel.de`);
    await page.getByTestId("customer-phone").fill("176 99887766");
    await page.getByTestId("customer-create").click();
    await expect(page.getByTestId("customer-form-modal")).toBeHidden();
    await expect(page.getByTestId("customer-message")).toContainText("Kundin gespeichert.");

    // =========================================================================
    // STEP 3, 4, 6 & 7: Open Create Appointment, find service, verify defaults/eligibility, select customer & save
    // =========================================================================
    await page.getByTestId("nav-kalender").click();
    await expect(page.getByTestId("calendar-board")).toBeVisible();
    await page.getByTestId("calendar-date").fill("2026-11-12"); // Thursday
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();

    await page.getByRole("button", { name: "Termin erstellen" }).click();
    const bookingDialog = page.getByTestId("booking-form");
    await expect(bookingDialog).toBeVisible();

    await page.getByTestId("booking-service").click();
    await page.getByTestId("booking-service-search").fill(serviceName);
    await page
      .getByTestId("booking-service-list")
      .getByRole("option", { name: new RegExp(serviceName) })
      .click();

    // Step 4: Verify defaults (60 Min., 52,00 €) and eligible employees (Lena, Clara; not Emma)
    await expect(page.getByTestId("booking-duration")).toHaveValue("60 Min.");
    await expect(bookingDialog).toContainText("52,00 €");

    await page.getByTestId("booking-employee").click();
    const empList = page.getByTestId("booking-employee-list");
    await expect(empList).toContainText("Lena Berger");
    await expect(empList).toContainText("Clara Hartmann");
    await expect(empList).not.toContainText("Emma Wolf");
    await empList.getByRole("option", { name: "Lena Berger" }).click();

    // Set time to 14:00 (free slot for Lena Berger on Thursday 2026-11-12)
    await page.getByTestId("booking-start").click();
    await page.getByTestId("booking-start-list").getByRole("option", { name: "14:00" }).click();

    // Step 6: Select the newly created customer
    await page.getByTestId("booking-customer-search").fill(customerFull);
    await bookingDialog.getByRole("button", { name: new RegExp(customerFull) }).click();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "step06-create-appointment-configured.png"),
      fullPage: false,
    });

    // Step 7: Save appointment to PostgreSQL
    await page.getByTestId("booking-save").click();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin gespeichert.");

    // =========================================================================
    // STEP 8 & 9: Verify it appears in the correct Calendar column & persists across refresh
    // =========================================================================
    const apptCard = page.getByRole("button", { name: new RegExp(customerFull) });
    await expect(apptCard).toBeVisible();
    await expect(apptCard).toContainText("14:00 - 15:00");
    await expect(apptCard).toContainText(serviceName);

    await page.reload();
    await page.getByTestId("calendar-date").fill("2026-11-12");
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();
    await expect(apptCard).toBeVisible();
    await expect(apptCard).toContainText("14:00 - 15:00");

    // =========================================================================
    // STEP 10: Open and edit the appointment (Popover -> Full Detail View -> Edit Modal -> Save)
    // =========================================================================
    await apptCard.click();
    const popover = page.getByTestId("appointment-dialog");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText(customerFull);
    await expect(popover).toContainText("60 Min.");
    await expect(popover).toContainText("52,00 €");

    // Open full Appointment Detail View ("Termin" modal) via More menu
    await page.getByTestId("appointment-more-btn").click();
    await expect(page.getByTestId("appointment-more-menu")).toBeVisible();
    await page.getByTestId("more-menu-view-details").click();
    await expect(page.getByTestId("appointment-detail-view-modal")).toBeVisible();
    await expect(page.getByTestId("appointment-detail-history")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "step10a-appointment-detail-view.png"),
      fullPage: false,
    });

    // Click "Bearbeiten" in the right-hand Actions list to switch to Edit Appointment Modal
    await page.getByTestId("detail-view-action-edit").click();
    const editModal = page.getByTestId("appointment-edit-modal");
    await expect(editModal).toBeVisible();

    // Open Customer "..." context menu -> Edit Customer stacked secondary dialog
    await page.getByTestId("edit-appointment-customer-menu-btn").click();
    await expect(page.getByTestId("edit-appointment-customer-menu")).toBeVisible();
    await page.getByTestId("edit-appointment-customer-edit-btn").click();
    await expect(page.getByTestId("appointment-customer-edit-modal")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "step10b-stacked-customer-edit-modal.png"),
      fullPage: false,
    });

    // Press Escape to close only the stacked secondary customer modal while keeping Edit Appointment open
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("appointment-customer-edit-modal")).toBeHidden();
    await expect(editModal).toBeVisible();

    // Move appointment start time from 14:00 to 15:00 and add a note
    await page.getByTestId("edit-appointment-start").click();
    await page
      .getByTestId("edit-appointment-start-list")
      .getByRole("option", { name: "15:00" })
      .click();
    await page.getByTestId("edit-appointment-notes").fill("Wünscht Mandelform & Rosenöl");
    await page.getByTestId("appointment-edit-save").click();

    await expect(page.getByTestId("calendar-message")).toHaveText("Termin verschoben.");
    await expect(apptCard).toContainText("15:00 - 16:00");

    // =========================================================================
    // STEP 11: Verify Customer History in /kunden references the booking
    // =========================================================================
    await page.getByTestId("nav-kunden").click();
    await page.getByTestId("customer-search-input").fill(customerLast);
    await page.getByText(customerFull).first().click();
    await expect(page.getByTestId("customer-profile")).toBeVisible();
    await expect(page.getByTestId("profile-kpi-appointments")).toContainText("1");
    await expect(page.getByTestId("profile-history-card")).toContainText(serviceName);

    await page.getByTestId("profile-tab-appointments").click();
    await expect(page.getByTestId("profile-appointments-panel")).toContainText(serviceName);
    await expect(page.getByTestId("profile-appointments-panel")).toContainText("Lena Berger");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "step11-customer-profile-appointment-history.png"),
      fullPage: false,
    });

    // =========================================================================
    // STEP 12, 13 & 14: Change service duration & price in Settings -> Verify new bookings vs existing snapshot
    // =========================================================================
    await page.getByTestId("nav-einstellungen").click();
    await page.getByTestId("settings-nav-services").click();
    await page.getByTestId("service-category-bar-Maniküre").click();
    await page.getByTestId(`settings-service-edit-${serviceName}`).click();
    await page.getByTestId("service-modal-price").fill("64,00");
    await page.getByTestId("service-modal-duration").selectOption("75");
    await page.getByTestId("service-modal-save").click();
    await expect(page.getByTestId("service-editor-modal")).toBeHidden();

    // Step 13: New booking receives 75 Min. and 64,00 €
    await page.getByTestId("nav-kalender").click();
    await page.getByTestId("calendar-date").fill("2026-11-12");
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();
    await page.getByRole("button", { name: "Termin erstellen" }).click();
    await page.getByTestId("booking-service").click();
    await page.getByTestId("booking-service-search").fill(serviceName);
    await page
      .getByTestId("booking-service-list")
      .getByRole("option", { name: new RegExp(serviceName) })
      .click();
    await expect(page.getByTestId("booking-duration")).toHaveValue("75 Min.");
    await expect(page.getByTestId("booking-form")).toContainText("64,00 €");

    // =========================================================================
    // STEP 15: Verify conflicting appointments are rejected (HTTP 409)
    // =========================================================================
    await page.getByTestId("booking-employee").click();
    await page.getByTestId("booking-employee-list").getByRole("option", { name: "Lena Berger" }).click();
    await page.getByTestId("booking-start").click();
    await page.getByTestId("booking-start-list").getByRole("option", { name: "15:00" }).click();
    await page.getByTestId("booking-customer-search").fill("Klara Beispiel");
    await page.getByTestId("booking-form").getByRole("button", { name: "Klara Beispiel", exact: true }).click();
    await page.getByTestId("booking-save").click();
    await expect(page.getByTestId("booking-error")).toHaveText("Die Zeit ist bereits belegt.");
    await page.getByTestId("booking-close").click();

    // Step 14: Verify existing appointment snapshot is unchanged (60 Min., 52,00 €, 15:00 - 16:00)
    await expect(apptCard).toContainText("15:00 - 16:00");
    await apptCard.click();
    await expect(page.getByTestId("appointment-dialog")).toContainText("60 Min.");
    await expect(page.getByTestId("appointment-dialog")).toContainText("52,00 €");

    // =========================================================================
    // STEP 16: Verify No-Show (retains allocation), Cancellation (releases allocation), and Absence blocking
    // =========================================================================
    // 16a: Mark as No-Show -> status becomes no_show, but 15:00-16:00 remains occupied!
    await page.getByTestId("appointment-more-btn").click();
    await page.getByTestId("more-menu-noshow").click();
    await expect(page.getByTestId("calendar-message")).toHaveText(
      "Termin als Nicht erschienen markiert.",
    );

    // Fetch the created service ID and customer ID
    const [svcLookupRes, custLookupRes] = await Promise.all([
      page.request.get("/api/services?salonId=salon_jeannie"),
      page.request.get(`/api/customers?salonId=salon_jeannie&q=${encodeURIComponent(customerLast)}`),
    ]);
    const svcLookupBody = (await svcLookupRes.json()) as {
      services: { id: string; name: string }[];
    };
    const custLookupBody = (await custLookupRes.json()) as {
      customers: { id: string; displayName: string }[];
    };
    const createdServiceId = svcLookupBody.services.find((s) => s.name === serviceName)!.id;
    const createdCustomerId = custLookupBody.customers[0]!.id;

    // Attempting to book Lena at 15:00 while no_show is active must still return 409 Conflict
    const noShowConflictRes = await page.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_lena",
        customerId: createdCustomerId,
        serviceId: createdServiceId,
        date: "2026-11-12",
        start: "15:00",
      },
    });
    expect(noShowConflictRes.status()).toBe(409);

    // 16b: Cancel appointment -> releases occupied time
    await apptCard.click();
    await expect(page.getByTestId("popover-status-noshow")).toBeVisible();
    await page.getByTestId("appointment-cancel").click();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin storniert.");
    await expect(apptCard).toHaveCount(0);

    // 16c: Absence validation -> Create a Monday absence for Lena Berger (16:00 - 17:00 on 2026-11-12) and verify booking in that window is rejected with 422 "absent"
    const createAbsRes = await page.request.post("/api/absences", {
      data: {
        salonId: "salon_jeannie",
        description: "Zahnarzttermin",
        appliesTo: "employee",
        staffId: "staff_lena",
        startDate: "2026-11-12",
        startTime: "16:00",
        endDate: "2026-11-12",
        endTime: "17:00",
        allDay: false,
      },
    });
    expect(createAbsRes.status()).toBe(201);
    const createAbsBody = (await createAbsRes.json()) as { absenceIds?: string[] };

    const absenceRejectRes = await page.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_lena",
        customerId: createdCustomerId,
        serviceId: createdServiceId,
        date: "2026-11-12",
        start: "16:00",
      },
    });
    expect(absenceRejectRes.status()).toBe(422);
    const absenceRejectBody = (await absenceRejectRes.json()) as { code?: string };
    expect(absenceRejectBody.code).toBe("absent");

    // Clean up temporary test absence and test customer so subsequent E2E tests see the exact baseline count (19)
    for (const absId of createAbsBody.absenceIds ?? []) {
      await page.request.delete(
        `/api/absences?salonId=salon_jeannie&id=${encodeURIComponent(absId)}`,
      );
    }
    await page.request.delete(
      `/api/customers/${encodeURIComponent(createdCustomerId)}?salonId=salon_jeannie`,
    );
  });
});
