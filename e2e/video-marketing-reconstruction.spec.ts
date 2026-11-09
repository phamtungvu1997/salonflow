import path from "node:path";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "marketing-reconstruction");

test.describe("Video-Driven Marketing Module Reconstruction (Slices A–D + Dynamic Pricing Calendar)", () => {
  test.setTimeout(120_000);

  test("reproduces Insights, Waiting List, Discounts, Dynamic Pricing Calendar, Date/Time Popovers, Repeat & Validation without blocking technician allocations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Owner
    await page.goto("/anmelden");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/kalender/);

    // 1. Navigate to Marketing via primary sidebar
    await page.getByTestId("nav-marketing").click();
    await expect(page).toHaveURL(/\/marketing/);
    await expect(page.getByTestId("page-marketing")).toBeVisible();
    await expect(page.getByTestId("marketing-section-insights")).toBeVisible();
    await expect(page.getByTestId("marketing-welcome-banner")).toBeVisible();

    // Switch period filter (This week -> This year -> This month)
    await page.getByTestId("marketing-period-week").click();
    await page.getByTestId("marketing-period-year").click();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-marketing-insights.png"),
      fullPage: false,
    });

    // 2. Waiting List Tab & New Registration Modal (video 00:06 – 00:14)
    await page.getByTestId("marketing-tab-waiting-list").click();
    await expect(page.getByTestId("marketing-section-waiting-list")).toBeVisible();
    await expect(page.getByTestId("waitlist-row-Klara Beispiel")).toBeVisible();

    // Open cog menu
    await page.getByTestId("waitlist-settings-cog-btn").click();
    await expect(page.getByTestId("waitlist-settings-cog-menu")).toBeVisible();
    await page.getByTestId("waitlist-settings-cog-btn").click();

    // Open New Registration Modal
    await page.getByTestId("waitlist-new-registration-btn").click();
    await expect(page.getByTestId("waitlist-registration-modal")).toBeVisible();
    await page.getByTestId("waitlist-modal-note").fill("Wünscht Nachmittagstermin ab 15 Uhr");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-waiting-list-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("waitlist-modal-save-btn").click();
    await expect(page.getByTestId("waitlist-registration-modal")).toBeHidden();
    await expect(page.getByTestId("waitlist-feedback-banner")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-waiting-list-table.png"),
      fullPage: false,
    });

    // 3. Discounts Tab, Last-Minute Setup Modal & Create Discount Code Modal (video 00:15 – 00:38)
    await page.getByTestId("marketing-tab-discounts").click();
    await expect(page.getByTestId("marketing-section-discounts")).toBeVisible();
    await expect(page.getByTestId("discount-code-row-SPRING15")).toBeVisible();
    await expect(page.getByTestId("discount-code-row-HERBST25")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-discounts-directory.png"),
      fullPage: false,
    });

    // Open Last-Minute Discount Setup Modal
    await page.getByTestId("last-minute-edit-link").click();
    await expect(page.getByTestId("last-minute-setup-modal")).toBeVisible();
    await page.getByTestId("last-minute-percent-select").selectOption("20");
    await page.getByTestId("last-minute-hours-select").selectOption("4");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-last-minute-setup-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("last-minute-apply-btn").click();
    await expect(page.getByTestId("last-minute-setup-modal")).toBeHidden();
    await expect(page.getByTestId("last-minute-status-text")).toContainText("20% Rabatt");

    // Reload and confirm Last-Minute config persisted in PostgreSQL
    await page.reload();
    await page.getByTestId("marketing-tab-discounts").click();
    await expect(page.getByTestId("last-minute-status-text")).toContainText("20% Rabatt");

    // Restore 15% within 2 hours
    await page.getByTestId("last-minute-edit-link").click();
    await page.getByTestId("last-minute-percent-select").selectOption("15");
    await page.getByTestId("last-minute-hours-select").selectOption("2");
    await page.getByTestId("last-minute-apply-btn").click();

    // Open Create Discount Code Modal
    await page.getByTestId("new-discount-code-btn").click();
    await expect(page.getByTestId("create-discount-code-modal")).toBeVisible();
    const customCode = `WINTER${Date.now().toString().slice(-3)}`;
    await page.getByTestId("discount-modal-code-input").fill(customCode);
    await page.getByTestId("discount-modal-percentage-select").selectOption("15");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-create-discount-code-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("discount-modal-save-btn").click();
    await expect(page.getByTestId("create-discount-code-modal")).toBeHidden();
    await expect(page.getByTestId(`discount-code-row-${customCode}`)).toBeVisible();

    // Search discount codes directory
    await page.getByTestId("discount-codes-search").fill(customCode);
    await expect(page.getByTestId(`discount-code-row-${customCode}`)).toBeVisible();
    await page.getByTestId("discount-codes-search").fill("");

    // 4. Dynamic Pricing Calendar Mode (video 00:39 – 00:91)
    await page.getByTestId("dynamic-pricing-go-to-calendar-btn").click();
    await expect(page.getByTestId("dynamic-pricing-calendar-view")).toBeVisible();
    await expect(page.getByTestId("dynamic-pricing-info-banner")).toBeVisible();
    await expect(page.getByTestId("price-change-block-2026-11-09-13")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-dynamic-pricing-calendar-w46.png"),
      fullPage: false,
    });

    // Switch to Week 47 (16 - 22 Nov 2026)
    await page.getByTestId("dynamic-calendar-next-week").click();
    await expect(page.getByTestId("dynamic-calendar-range-label")).toContainText(
      "16. – 22. Nov. 2026",
    );

    // Open Create Price Change Modal
    await page.getByTestId("create-price-change-btn").click();
    await expect(page.getByTestId("price-change-modal")).toBeVisible();

    // Open Date Picker Popover (matching video 00:48 & 00:51)
    await page.getByTestId("price-change-start-date-btn").click();
    await expect(page.getByTestId("price-change-date-popover")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-price-change-date-picker-open.png"),
      fullPage: false,
    });

    await page.getByTestId("date-popover-day-16").click();
    await expect(page.getByTestId("price-change-date-popover")).toBeHidden();

    // Open Dual-Column Time Picker Popover (matching video 00:54)
    await page.getByTestId("price-change-start-time-btn").click();
    await expect(page.getByTestId("price-change-time-popover")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-price-change-time-picker-open.png"),
      fullPage: false,
    });

    await page.getByTestId("time-popover-hour-13").click();
    await page.getByTestId("time-popover-minute-00").click();
    await expect(page.getByTestId("price-change-time-popover")).toBeHidden();

    // Set end time earlier than start time (10:45 < 13:00) to verify validation error (video 00:84)
    await page.getByTestId("price-change-end-time-btn").click();
    await page.getByTestId("time-popover-hour-10").click();
    await page.getByTestId("time-popover-minute-45").click();
    await page.getByTestId("price-change-save-btn").click();
    await expect(page.getByTestId("price-change-validation-error")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "10-price-change-validation-error.png"),
      fullPage: false,
    });

    // Now set valid end time (18:00) and check "Repeat price change"
    await page.getByTestId("price-change-end-time-btn").click();
    await page.getByTestId("time-popover-hour-18").click();
    await page.getByTestId("time-popover-minute-00").click();
    await page.getByTestId("price-change-repeat-checkbox").check();
    await expect(page.getByTestId("price-change-repeat-frequency")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-price-change-repeat-option.png"),
      fullPage: false,
    });

    await page.getByTestId("price-change-save-btn").click();
    await expect(page.getByTestId("price-change-modal")).toBeHidden();
    await expect(page.getByTestId("price-change-toast")).toContainText(
      "Preisänderung erstellt",
    );
    await expect(page.getByTestId("price-change-block-2026-11-16-10")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "12-price-change-created-on-grid.png"),
      fullPage: false,
    });

    // Click the created block on Monday 16-11 to open Edit Price Change Modal & delete it (video 00:69 – 00:72)
    await page.getByTestId("price-change-block-2026-11-16-10").click();
    await expect(page.getByTestId("price-change-modal")).toBeVisible();
    await expect(page.getByTestId("price-change-delete-btn")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-edit-price-change-modal.png"),
      fullPage: false,
    });

    await page.getByTestId("price-change-delete-btn").click();
    await expect(page.getByTestId("price-change-modal")).toBeHidden();
    await expect(page.getByTestId("price-change-toast")).toContainText(
      "Preisänderung gelöscht",
    );

    // Return to Regular View (Marketing workspace)
    await page.getByTestId("dynamic-pricing-regular-view-link").click();
    await expect(page.getByTestId("marketing-section-discounts")).toBeVisible();

    // 5. Email, Filters & Rebook Reminder Tabs (video 00:24 – 00:27)
    await page.getByTestId("marketing-tab-email").click();
    await expect(page.getByTestId("marketing-section-email")).toBeVisible();
    await expect(page.getByTestId("email-gdpr-safety-notice")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14-marketing-email-tab.png"),
      fullPage: false,
    });

    await page.getByTestId("marketing-tab-filters").click();
    await expect(page.getByTestId("marketing-section-filters")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "15-marketing-filters-tab.png"),
      fullPage: false,
    });

    await page.getByTestId("marketing-tab-rebook-reminder").click();
    await expect(page.getByTestId("marketing-section-rebook-reminder")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "16-marketing-rebook-reminder-tab.png"),
      fullPage: false,
    });

    // 6. Cross-Module Verification: Calendar & Customers remain intact
    await page.goto("/kalender");
    await expect(page.getByTestId("page-kalender")).toBeVisible();
    await page.goto("/kunden");
    await expect(page.getByTestId("page-kunden")).toBeVisible();
  });
});
