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

  await page.getByTestId("nav-mitarbeiter").click();
  await page.getByTestId("staff-name").fill(staffName);
  await page.getByTestId("staff-create").click();
  await expect(page.getByTestId(`staff-row-${staffName}`)).toBeVisible();
  await page.getByTestId("staff-select").selectOption({ label: staffName });
  await page.getByTestId("shift-start-1").fill("09:00");
  await page.getByTestId("shift-end-1").fill("18:00");
  await page.getByTestId("hours-save").click();
  await expect(page.getByTestId("staff-message")).toContainText("Arbeitszeiten gespeichert");

  await page.getByTestId("nav-leistungen").click();
  await page.getByTestId("service-name").fill(serviceName);
  await page.getByTestId("service-duration").fill("45");
  await page.getByRole("checkbox", { name: staffName }).check();
  await page.getByTestId("service-create").click();
  await expect(page.getByTestId(`service-row-${serviceName}`)).toBeVisible();

  await page.getByTestId("nav-kalender").click();
  await page.getByTestId("calendar-date").fill("2026-11-09");
  await page.getByRole("button", { name: `${staffName} 10:00` }).click();
  await page.getByTestId("booking-customer-name").fill(customerName);
  await page.getByTestId("booking-service").selectOption({ label: `${serviceName} · 45 Min.` });
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
