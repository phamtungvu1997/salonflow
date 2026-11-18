import { expect, test } from "@playwright/test";

test("Buchung bleibt nach dem Neuladen und Storno gibt die Zeit frei", async ({ page }) => {
  const staffName = `Eva ${Date.now()}`;
  const serviceName = `Shellac ${Date.now()}`;
  const customerName = `Klara ${Date.now()}`;

  await page.goto("/anmelden");
  await page.getByTestId("login-email").fill("empfang.jeannie@salonflow.example");
  await page.getByTestId("login-password").fill("salonflow-dev");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("calendar-board")).toBeVisible();

  // Create staff member via Settings -> Employees
  await page.getByTestId("nav-einstellungen").click();
  await page.getByTestId("settings-nav-employees").click();
  await page.getByTestId("settings-new-employee-btn").click();
  await page.getByTestId("employee-modal-name").fill(staffName);
  await page.getByTestId("employee-modal-save").click();
  await expect(page.getByTestId(`settings-employee-row-${staffName}`)).toBeVisible();

  // Set Monday working hours (09:00 - 18:00) via Settings -> Timetable
  await page.getByTestId("settings-nav-timetable").click();
  await page.getByTestId(`timetable-cell-${staffName}-1`).click();
  await page.getByTestId("roster-modal-start").fill("09:00");
  await page.getByTestId("roster-modal-end").fill("18:00");
  await page.getByTestId("roster-modal-submit").click();
  await expect(page.getByTestId("timetable-feedback-banner")).toContainText("gespeichert");

  // Create service and assign staff member via Settings -> Services
  await page.getByTestId("settings-nav-services").click();
  await page.getByTestId("services-create-new-dropdown-btn").click();
  await page.getByTestId("services-menu-add-service").click();
  await page.getByTestId("service-modal-name").fill(serviceName);
  await page.getByTestId("service-modal-duration").selectOption("45");
  await page.getByTestId("service-modal-price").fill("35,00");
  const staffCheckbox = page.getByTestId(`service-modal-staff-${staffName}`);
  if (!(await staffCheckbox.isChecked())) {
    await staffCheckbox.check();
  }
  await page.getByTestId("service-modal-save").click();
  await expect(page.getByTestId("services-settings-feedback")).toContainText(serviceName);

  await page.getByTestId("nav-kalender").click();
  await page.getByTestId("calendar-date").fill("2026-11-09");
  await page.getByRole("button", { name: `${staffName} 10:00` }).click();
  await page.getByTestId("booking-service").click();
  await page.getByRole("option", { name: new RegExp(serviceName) }).click();
  await page.getByTestId("booking-customer-add").click();
  await page.getByTestId("booking-customer-name").fill(customerName);
  await page.getByTestId("booking-save").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Termin gespeichert.");
  await expect(page.getByRole("button", { name: customerName })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: customerName })).toBeVisible();
  await page.getByRole("button", { name: customerName }).click();
  await page.getByTestId("appointment-start").fill("11:00");
  await page.getByTestId("appointment-save").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Termin verschoben.");

  await page.getByRole("button", { name: customerName }).click();
  await page.getByTestId("appointment-cancel").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Termin storniert.");
  await page.reload();
  await expect(page.getByRole("button", { name: customerName })).toHaveCount(0);

  const forbidden = await page.request.get("/api/staff?salonId=salon_juliet");
  expect(forbidden.status()).toBe(403);
});
