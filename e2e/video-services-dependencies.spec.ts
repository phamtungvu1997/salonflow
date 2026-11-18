import path from "node:path";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "services-dependencies");

test.describe("Video-Driven Services Module & Cross-Module Integration (TESTS 1–12)", () => {
  test.setTimeout(150_000);

  test("reproduces Settings -> Services UI, shared PostgreSQL catalog, live cross-module synchronization, eligibility, snapshots, deactivation, and salon scoping", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Owner (access to both Jeannie Nagelstudio and Juliet)
    await page.goto("/anmelden");
    await page.getByTestId("login-email").fill("owner@salonflow.example");
    await page.getByTestId("login-password").fill("salonflow-dev");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("calendar-board")).toBeVisible();

    const suffix = Date.now().toString().slice(-5);
    const serviceName = `BIAB Hema-Free Verstärkung ${suffix}`;
    const customerName = `Miriam Sparr ${suffix}`;

    // =========================================================================
    // PHASE 2 & 10: Settings -> Services Overview, Category Accordion & Package Tab
    // =========================================================================
    await page.goto("/einstellungen");
    await page.getByTestId("settings-nav-services").click();
    await expect(page.getByTestId("settings-section-services")).toBeVisible();
    await expect(page.getByTestId("service-category-bar-Maniküre")).toBeVisible();
    await expect(page.getByTestId("service-category-bar-Pediküre")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-services-category-list.png"),
      fullPage: false,
    });

    // Verify Package sub-tab empty state & Create Package modal (video 00:18 – 00:26)
    await page.getByTestId("services-subtab-package").click();
    await expect(page.getByTestId("services-package-empty-state")).toBeVisible();
    await page.getByTestId("services-create-package-btn").click();
    await expect(page.getByTestId("package-editor-modal")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-create-package-modal.png"),
      fullPage: false,
    });
    await page.getByTestId("package-modal-cancel").click();
    await page.getByTestId("services-subtab-service").click();

    // =========================================================================
    // TEST 1 & PHASE 4: Create a New Fictional Service in Settings -> Services
    // =========================================================================
    await page.getByTestId("services-create-new-dropdown-btn").click();
    await page.getByTestId("services-menu-add-service").click();
    await expect(page.getByTestId("service-editor-modal")).toBeVisible();

    // Provide name, category (Maniküre), duration (60 min), price (48,00 €)
    await page.getByTestId("service-modal-name").fill(serviceName);
    await page.getByTestId("service-modal-price").fill("48,00");
    await page.getByTestId("service-modal-duration").selectOption("60");

    // Assign ONLY Lena Berger and Clara Hartmann as eligible employees
    await page.getByTestId("service-modal-toggle-all-staff").click(); // unchecks all if all were checked
    const lenaCheckbox = page.getByTestId("service-modal-staff-Lena Berger");
    const claraCheckbox = page.getByTestId("service-modal-staff-Clara Hartmann");
    if (!(await lenaCheckbox.isChecked())) await lenaCheckbox.check();
    if (!(await claraCheckbox.isChecked())) await claraCheckbox.check();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-service-editor-create.png"),
      fullPage: false,
    });

    await page.getByTestId("service-modal-save").click();
    await expect(page.getByTestId("service-editor-modal")).toBeHidden();
    await expect(page.getByTestId("services-settings-feedback")).toContainText(serviceName);
    await expect(page.getByTestId(`settings-service-row-${serviceName}`)).toBeVisible();
    await page.getByTestId("services-settings-feedback").scrollIntoViewIfNeeded();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-expanded-category-with-new-service.png"),
      fullPage: false,
    });

    // Verify the new service exists in PostgreSQL via GET /api/services
    const apiCheck1 = await page.request.get("/api/services?salonId=salon_jeannie");
    expect(apiCheck1.ok()).toBeTruthy();
    const apiBody1 = (await apiCheck1.json()) as {
      services: {
        id: string;
        name: string;
        durationMinutes: number;
        priceCents: number;
        staffIds: string[];
      }[];
    };
    const createdSvc = apiBody1.services.find((s) => s.name === serviceName);
    expect(createdSvc).toBeDefined();
    expect(createdSvc?.durationMinutes).toBe(60);
    expect(createdSvc?.priceCents).toBe(4800);
    expect(createdSvc?.staffIds).toEqual(
      expect.arrayContaining(["staff_lena", "staff_clara"]),
    );
    expect(createdSvc?.staffIds).not.toContain("staff_emma");

    // =========================================================================
    // TEST 1, 4 & PHASE 4: Open Calendar -> Create Appointment & Verify New Service
    // =========================================================================
    await page.goto("/kalender");
    await expect(page.getByTestId("calendar-board")).toBeVisible();
    await page.getByTestId("calendar-date").fill("2026-11-11"); // Wednesday
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();

    await page.getByRole("button", { name: "Termin erstellen" }).click();
    const bookingDialog = page.getByTestId("booking-form");
    await expect(bookingDialog).toBeVisible();

    // Open categorized service selector and search for the newly created service
    await page.getByTestId("booking-service").click();
    await expect(page.getByTestId("booking-service-list")).toBeVisible();
    await page.getByTestId("booking-service-search").fill(serviceName);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-create-appointment-service-selector.png"),
      fullPage: false,
    });

    await page
      .getByTestId("booking-service-list")
      .getByRole("option", { name: new RegExp(serviceName) })
      .click();

    // Verify Duration (60 Min.) and Price (48,00 €) populate automatically
    await expect(page.getByTestId("booking-duration")).toHaveValue("60 Min.");
    await expect(bookingDialog).toContainText("48,00 €");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-selected-service-populated-defaults.png"),
      fullPage: false,
    });

    // Verify only eligible employees (Lena Berger, Clara Hartmann) appear in Employee selector
    await page.getByTestId("booking-employee").click();
    const empList = page.getByTestId("booking-employee-list");
    await expect(empList).toBeVisible();
    await expect(empList).toContainText("Lena Berger");
    await expect(empList).toContainText("Clara Hartmann");
    await expect(empList).not.toContainText("Emma Wolf");
    await empList.getByRole("option", { name: "Lena Berger" }).click();

    // Complete a fictional booking at 15:00 on 2026-11-11
    await page.getByTestId("booking-start").click();
    await page.getByTestId("booking-start-list").getByRole("option", { name: "15:00" }).click();
    await page.getByTestId("booking-customer-add").click();
    await page.getByTestId("booking-customer-name").fill(customerName);
    await page.getByTestId("booking-save").click();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin gespeichert.");

    // Verify booking persists after refresh
    await page.reload();
    await page.getByTestId("calendar-date").fill("2026-11-11");
    await expect(page.getByTestId("column-staff_lena")).toBeVisible();
    const bookedCard = page.getByRole("button", { name: new RegExp(customerName) });
    await expect(bookedCard).toBeVisible();
    await expect(bookedCard).toContainText("15:00 - 16:00");
    await expect(bookedCard).toContainText(serviceName);

    // =========================================================================
    // TEST 5: Backend Rejects Ineligible Employee / Service Combination
    // =========================================================================
    const ineligibleRes = await page.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_emma", // Emma Wolf is NOT eligible for this service
        customerId: "cust_demo_klara",
        serviceId: createdSvc!.id,
        date: "2026-11-11",
        start: "14:00",
      },
    });
    expect(ineligibleRes.status()).toBe(422);
    const ineligibleJson = (await ineligibleRes.json()) as { code?: string };
    expect(ineligibleJson.code).toBe("ineligible");

    // =========================================================================
    // TEST 2, 3, 4, 6 & 10: Update Service in Second Tab While Create Appointment Open
    // =========================================================================
    // Keep Create Appointment modal open in `page` while editing service in `settingsPage`
    await page.getByRole("button", { name: "Termin erstellen" }).click();
    await expect(page.getByTestId("booking-form")).toBeVisible();

    const settingsPage = await context.newPage();
    await settingsPage.setViewportSize({ width: 1440, height: 900 });
    await settingsPage.goto("/einstellungen");
    await settingsPage.getByTestId("settings-nav-services").click();
    await settingsPage.getByTestId("service-category-bar-Maniküre").click();
    await settingsPage.getByTestId(`settings-service-edit-${serviceName}`).click();
    await expect(settingsPage.getByTestId("service-editor-modal")).toBeVisible();

    // Update Duration -> 75 Min., Price -> 59,00 €, and remove Clara Hartmann (leave only Lena Berger)
    await settingsPage.getByTestId("service-modal-price").fill("59,00");
    await settingsPage.getByTestId("service-modal-duration").selectOption("75");
    await settingsPage.getByTestId("service-modal-staff-Clara Hartmann").uncheck();

    await settingsPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-service-editor-update.png"),
      fullPage: false,
    });

    await settingsPage.getByTestId("service-modal-save").click();
    await expect(settingsPage.getByTestId("service-editor-modal")).toBeHidden();

    // Return to already-open Create Appointment modal in `page` and open service selector
    await page.bringToFront();
    await page.getByTestId("booking-service").click();
    await page.getByTestId("booking-service-search").fill(serviceName);
    await expect(page.getByTestId("booking-service-list")).toContainText("75 Min.");
    await expect(page.getByTestId("booking-service-list")).toContainText("59,00 €");

    await page
      .getByTestId("booking-service-list")
      .getByRole("option", { name: new RegExp(serviceName) })
      .click();

    // Verify updated duration (75 Min.) and updated price (59,00 €) populate in new booking form
    await expect(page.getByTestId("booking-duration")).toHaveValue("75 Min.");
    await expect(page.getByTestId("booking-form")).toContainText("59,00 €");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-updated-service-in-create-appointment.png"),
      fullPage: false,
    });

    // Verify Clara Hartmann is no longer in the eligible employee dropdown
    await page.getByTestId("booking-employee").click();
    await expect(page.getByTestId("booking-employee-list")).toContainText("Lena Berger");
    await expect(page.getByTestId("booking-employee-list")).not.toContainText("Clara Hartmann");
    await page.getByTestId("booking-employee").click();
    await page.getByTestId("booking-close").click();

    // TEST 6: Verify existing booked appointment snapshot remained unchanged (60 Min., 48,00 €, 15:00 - 16:00)
    await expect(bookedCard).toContainText("15:00 - 16:00");
    await bookedCard.click();
    const detailPopover = page.getByTestId("appointment-dialog");
    await expect(detailPopover).toBeVisible();
    await expect(detailPopover).toContainText("60 Min.");
    await page.getByTestId("appointment-edit-open").click();
    await expect(page.getByTestId("appointment-edit-modal")).toContainText("48,00 €");
    await page.getByTestId("appointment-edit-close").click();

    // =========================================================================
    // TEST 7 & 8: Deactivate Service -> Removed from New Bookings, Intact in History
    // =========================================================================
    await settingsPage.bringToFront();
    await settingsPage.getByTestId(`settings-service-edit-${serviceName}`).click();
    await settingsPage.getByTestId("service-modal-deactivate-btn").click();
    await expect(settingsPage.getByTestId("services-settings-feedback")).toContainText(
      "deaktiviert",
    );
    await expect(
      settingsPage.getByTestId(`settings-service-inactive-badge-${serviceName}`),
    ).toBeVisible();
    await settingsPage.close();

    // Verify deactivated service is no longer selectable in Create Appointment
    await page.bringToFront();
    await page.getByRole("button", { name: "Termin erstellen" }).click();
    await page.getByTestId("booking-service").click();
    await page.getByTestId("booking-service-search").fill(serviceName);
    await expect(page.getByTestId("booking-service-list")).toContainText("Keine Treffer.");
    await page.getByTestId("booking-service").click();
    await page.getByTestId("booking-close").click();

    // Verify existing appointment on Calendar remains intact after service deactivation
    await expect(bookedCard).toBeVisible();
    await expect(bookedCard).toContainText(serviceName);

    // =========================================================================
    // TEST 9: Salon Switching Respects Catalog Scoping (Jeannie vs Juliet)
    // =========================================================================
    const julietServicesRes = await page.request.get("/api/services?salonId=salon_juliet");
    expect(julietServicesRes.ok()).toBeTruthy();
    const julietBody = (await julietServicesRes.json()) as {
      services: { name: string }[];
    };
    expect(julietBody.services.some((s) => s.name === serviceName)).toBe(false);

    // Clean up test appointment so calendar state stays clean
    await bookedCard.click();
    await page.getByTestId("appointment-cancel").click();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin storniert.");
  });
});
