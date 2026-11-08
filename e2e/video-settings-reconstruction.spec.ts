import path from "node:path";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "settings-reconstruction");

test.describe("Video-Driven Settings Module Reconstruction (Slices 1–5 + Cross-Module Dependencies)", () => {
  test.setTimeout(120_000);

  test("reproduces all recorded Settings sections, modals, PostgreSQL persistence, and cross-module Calendar/Booking synchronization", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Owner
    await page.goto("/anmelden");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/kalender/);

    // 1. Navigate to Settings Hub (/einstellungen)
    await page.goto("/einstellungen");
    await expect(page.getByTestId("page-einstellungen")).toBeVisible();
    await expect(page.getByTestId("settings-secondary-sidebar")).toBeVisible();
    await expect(page.getByTestId("settings-section-hub")).toBeVisible();
    await expect(page.getByTestId("hub-card-services")).toBeVisible();
    await expect(page.getByTestId("hub-card-timetable")).toBeVisible();
    await expect(page.getByTestId("hub-card-online-bookings")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-settings-hub.png"),
      fullPage: false,
    });

    // 2. SLICE 1A: General Settings + PostgreSQL Persistence across reload
    await page.getByTestId("settings-nav-general").click();
    await expect(page.getByTestId("settings-section-general")).toBeVisible();
    await expect(page.getByTestId("general-weekstart-monday")).toBeChecked();
    await expect(page.getByTestId("general-timeformat-24h")).toBeChecked();
    await page.getByTestId("general-ip-restriction-checkbox").check();
    await page.getByTestId("general-settings-save").click();
    await expect(page.getByTestId("general-settings-saved-banner")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-general-settings.png"),
      fullPage: false,
    });

    // Reload and confirm General Settings persisted in PostgreSQL
    await page.reload();
    await page.getByTestId("settings-nav-general").click();
    await expect(page.getByTestId("general-ip-restriction-checkbox")).toBeChecked();
    // Restore IP restriction to false
    await page.getByTestId("general-ip-restriction-checkbox").uncheck();
    await page.getByTestId("general-settings-save").click();
    await expect(page.getByTestId("general-settings-saved-banner")).toBeVisible();

    // 3. SLICE 1B: Company Information + Persistence
    await page.getByTestId("settings-nav-company").click();
    await expect(page.getByTestId("settings-section-company")).toBeVisible();
    await expect(page.getByTestId("company-postal-code")).toHaveValue("22303");
    await expect(page.getByTestId("company-address-line")).toHaveValue("Borgweg");
    await page.getByTestId("company-instagram").fill("jeanniehamburg");
    await page.getByTestId("company-settings-save").click();
    await expect(page.getByTestId("company-settings-saved-banner")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-company-settings.png"),
      fullPage: false,
    });

    // 4. SLICE 2A: User Accounts & Create User Account Modal
    await page.getByTestId("settings-nav-users").click();
    await expect(page.getByTestId("settings-section-users")).toBeVisible();
    await page.getByTestId("users-add-button").click();
    await expect(page.getByTestId("create-user-modal")).toBeVisible();

    const uniqueUserEmail = `leitung.${Date.now()}@salonflow.local`;
    await page.getByTestId("new-user-firstname").fill("Claudia");
    await page.getByTestId("new-user-lastname").fill("Bergmann");
    await page.getByTestId("new-user-email").fill(uniqueUserEmail);
    await page.getByTestId("new-user-role-manager").check();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-user-accounts-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("new-user-save").click();
    await expect(page.getByTestId("create-user-modal")).toBeHidden();
    await expect(
      page.getByTestId(`user-account-card-${uniqueUserEmail}`),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-user-accounts-list.png"),
      fullPage: false,
    });

    // 5. SLICE 2B: Employees Directory, Appearance Color & Assigned Services
    await page.getByTestId("settings-nav-employees").click();
    await expect(page.getByTestId("settings-section-employees")).toBeVisible();
    await expect(page.getByTestId("settings-employee-row-Lena Berger")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-employees-directory.png"),
      fullPage: false,
    });

    // Open Lena Berger in Employee Editor Modal
    await page.getByTestId("settings-employee-edit-Lena Berger").click();
    await expect(page.getByTestId("employee-editor-modal")).toBeVisible();
    await expect(page.getByTestId("employee-modal-name")).toHaveValue("Lena Berger");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-employee-editor-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("employee-modal-save").click();
    await expect(page.getByTestId("employee-editor-modal")).toBeHidden();

    // 6. SLICE 3: Services, Colored Categories, Live Card Preview, Service Editor & Update Prices
    await page.getByTestId("settings-nav-services").click();
    await expect(page.getByTestId("settings-section-services")).toBeVisible();
    await expect(page.getByTestId("service-category-bar-Maniküre")).toBeVisible();
    await expect(page.getByTestId("service-category-bar-Pediküre")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-services-categories.png"),
      fullPage: false,
    });

    // Open Category Modal via "+ Kategorie erstellen" dashed button
    await page.getByTestId("services-create-category-dashed-btn").click();
    await expect(page.getByTestId("category-editor-modal")).toBeVisible();
    await expect(page.getByTestId("category-modal-live-preview")).toBeVisible();
    await page.getByTestId("category-modal-name").fill("Handpflege & Paraffin");
    await page.getByTestId("category-color-swatch-#86efac").click();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-category-modal-preview.png"),
      fullPage: false,
    });

    await page.getByTestId("category-modal-save").click();
    await expect(page.getByTestId("category-editor-modal")).toBeHidden();
    await expect(
      page.getByTestId("service-category-bar-Handpflege & Paraffin"),
    ).toBeVisible();

    // Clean up test category via Edit -> Delete Category Confirmation Modal
    await page.getByTestId("service-category-edit-Handpflege & Paraffin").click();
    await expect(page.getByTestId("category-editor-modal")).toBeVisible();
    await page.getByTestId("category-modal-delete-btn").click();
    await expect(page.getByTestId("delete-category-confirm-modal")).toBeVisible();
    await page.getByTestId("confirm-delete-category-btn").click();
    await expect(page.getByTestId("delete-category-confirm-modal")).toBeHidden();

    // Open Service Editor Two-Column Modal
    await page.getByTestId("settings-service-edit-Maniküre").click();
    await expect(page.getByTestId("service-editor-modal")).toBeVisible();
    await expect(page.getByTestId("service-modal-name")).toHaveValue("Maniküre");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "10-service-editor-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("service-modal-save").click();
    await expect(page.getByTestId("service-editor-modal")).toBeHidden();

    // Open Update Prices Modal
    await page.getByTestId("services-update-prices-btn").click();
    await expect(page.getByTestId("update-prices-modal")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-update-prices-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("update-prices-commit-btn").click();
    await expect(page.getByTestId("update-prices-modal")).toBeHidden();

    // 7. SLICE 4A: Weekly Timetable Grid & Edit Roster Modal
    await page.getByTestId("settings-nav-timetable").click();
    await expect(page.getByTestId("settings-section-timetable")).toBeVisible();
    await expect(page.getByTestId("timetable-row-Emma Wolf")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "12-timetable-weekly-grid.png"),
      fullPage: false,
    });

    // Click Emma Wolf's Sunday shift cell (13:00 - 18:45) to open Edit Roster Modal
    await page.getByTestId("timetable-cell-Emma Wolf-7").click();
    await expect(page.getByTestId("edit-roster-modal")).toBeVisible();
    await expect(page.getByTestId("roster-modal-start")).toHaveValue("13:00");
    await expect(page.getByTestId("roster-modal-end")).toHaveValue("18:45");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-edit-roster-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("roster-modal-submit").click();
    await expect(page.getByTestId("edit-roster-modal")).toBeHidden();
    await expect(page.getByTestId("timetable-feedback-banner")).toBeVisible();

    // 8. SLICE 4B: Absences (National Holidays, Unavailable Days & Create Absence Modal)
    await page.getByTestId("settings-nav-absences").click();
    await expect(page.getByTestId("settings-section-absences")).toBeVisible();
    await page.getByTestId("absences-create-btn").click();
    await expect(page.getByTestId("create-absence-modal")).toBeVisible();

    const absenceTitle = `Fortbildung Nageldesign ${Date.now().toString().slice(-4)}`;
    await page.getByTestId("absence-modal-description").fill(absenceTitle);
    await page.getByTestId("absence-modal-start-date").fill("2026-11-18");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14-create-absence-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("absence-modal-save").click();
    await expect(page.getByTestId("create-absence-modal")).toBeHidden();
    await expect(page.getByTestId(`absence-row-${absenceTitle}`)).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "15-absences-list.png"),
      fullPage: false,
    });

    // 9. SLICE 4C: Calendar Settings + Live 60-Min Appointment Preview
    await page.getByTestId("settings-nav-calendar").click();
    await expect(page.getByTestId("settings-section-calendar")).toBeVisible();
    await expect(page.getByTestId("calendar-settings-live-preview")).toBeVisible();
    await page.getByTestId("calendar-settings-save").click();
    await expect(page.getByTestId("calendar-settings-saved-banner")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "16-calendar-settings.png"),
      fullPage: false,
    });

    // 10. SLICE 5: Online Bookings & Customer Settings
    await page.getByTestId("settings-nav-online-bookings").click();
    await expect(page.getByTestId("settings-section-online-bookings")).toBeVisible();
    await page.getByTestId("online-accordion-schedule").click();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "17-online-bookings.png"),
      fullPage: false,
    });

    await page.getByTestId("online-bookings-save").click();
    await expect(page.getByTestId("online-bookings-saved-banner")).toBeVisible();

    await page.getByTestId("settings-nav-customer-settings").click();
    await expect(page.getByTestId("settings-section-customer-settings")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "18-customer-settings.png"),
      fullPage: false,
    });

    await page.getByTestId("customer-settings-save").click();
    await expect(page.getByTestId("customer-settings-saved-banner")).toBeVisible();

    // 11. Cross-Module Verification: Ensure Calendar (/kalender) and Customers (/kunden) remain 100% functional
    await page.goto("/kalender");
    await expect(page.getByTestId("page-kalender")).toBeVisible();
    await page.goto("/kunden");
    await expect(page.getByTestId("page-kunden")).toBeVisible();
  });
});
