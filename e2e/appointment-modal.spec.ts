import { expect, test } from "@playwright/test";

test("Termin-Dialog, alle Reiter, Kalender-Klammern und Speichern funktionieren", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1024, height: 1022 });
  await page.goto("/anmelden");
  await page.getByTestId("login-email").fill("empfang.jeannie@salonflow.example");
  await page.getByTestId("login-password").fill("salonflow-dev");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("calendar-board")).toBeVisible();
  await page.getByTestId("calendar-date").fill("2026-11-09");
  await expect(page.getByTestId("column-staff_lena")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/calendar-dashboard.png" });
  await page.setViewportSize({ width: 1024, height: 1022 });

  const leftover = page.getByRole("button", { name: /Klara Beispiel/ }).filter({ hasText: "16:30" });
  if (await leftover.count()) {
    await leftover.click();
    await page.getByTestId("appointment-cancel").click();
    await expect(page.getByTestId("calendar-message")).toHaveText("Termin storniert.");
  }

  const opener = page.getByRole("button", { name: "Termin erstellen" });
  await opener.click();
  const dialog = page.getByTestId("booking-form");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("role", "dialog");

  // 1. Clicking anywhere on the Datum bracket opens the calendar popover
  await page.getByTestId("booking-date-trigger").click();
  await expect(page.getByTestId("booking-date-calendar")).toBeVisible();
  await page.getByTestId("booking-date-trigger").click();

  // 2. Clicking on the Uhrzeit bracket opens the time list
  await page.getByTestId("booking-start").click();
  await expect(page.getByTestId("booking-start-list")).toBeVisible();
  await page.getByTestId("booking-start-list").getByRole("option", { name: "09:00" }).click();

  // 3. Clicking on the Dauer bracket opens the duration list
  await page.getByTestId("booking-duration-select").click();
  await expect(page.getByTestId("booking-duration-select-list")).toBeVisible();
  await page.getByTestId("booking-duration-select").click();

  // 4. Switch through Absence, Chore, and Note tabs and capture screenshots
  await page.getByTestId("booking-tab-absence").click();
  await expect(page.getByRole("heading", { name: "Abwesenheit erstellen" })).toBeVisible();
  await expect(page.getByTestId("tab-panel-absence")).toBeVisible();
  await page.getByTestId("event-start-date-trigger").click();
  await expect(page.getByTestId("event-start-date-calendar")).toBeVisible();
  await page.getByTestId("event-start-date-trigger").click();
  await page.screenshot({ path: "test-results/modal-absence.png" });

  await page.getByTestId("booking-tab-chore").click();
  await expect(page.getByRole("heading", { name: "Aufgabe erstellen" })).toBeVisible();
  await expect(page.getByTestId("tab-panel-chore")).toBeVisible();
  await page.screenshot({ path: "test-results/modal-chore.png" });

  await page.getByTestId("booking-tab-note").click();
  await expect(page.getByRole("heading", { name: "Notiz erstellen" })).toBeVisible();
  await expect(page.getByTestId("tab-panel-note")).toBeVisible();
  await page.screenshot({ path: "test-results/modal-note.png" });

  // Save a note and verify it persists
  await page.getByTestId("event-description").fill("Team-Briefing um 08:45");
  await page.getByTestId("event-save").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Notiz gespeichert.");
  await expect(page.getByTestId("calendar-events-bar")).toContainText("Team-Briefing um 08:45");

  // Reopen modal for Appointment workflow
  await page.getByRole("button", { name: "Clara Hartmann 16:30" }).click();
  await page.getByTestId("booking-service").click();
  await page.getByRole("option", { name: "Maniküre 45 Min.", exact: true }).click();
  await expect(page.getByTestId("booking-duration")).toHaveValue("45 Min.");

  await page.getByTestId("booking-customer-search").fill("Klara Beispiel");
  await page.getByTestId("booking-form").getByRole("button", { name: "Klara Beispiel", exact: true }).click();
  await page.getByTestId("booking-save").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Termin gespeichert.");
  await page.reload();
  const card = page.getByRole("button", { name: /Klara Beispiel/ }).filter({ hasText: "16:30" });
  await expect(card).toBeVisible();

  // Conflict check
  await page.getByRole("button", { name: "Clara Hartmann 17:15" }).click();
  await page.getByTestId("booking-service").click();
  await page.getByRole("option", { name: "Maniküre 45 Min.", exact: true }).click();
  await page.getByTestId("booking-start").fill("16:30");
  await page.getByTestId("booking-customer-search").fill("Nora Hartmann");
  await page.getByTestId("booking-form").getByRole("button", { name: "Nora Hartmann", exact: true }).click();
  await page.getByTestId("booking-save").click();
  await expect(page.getByTestId("booking-error")).toHaveText("Die Zeit ist bereits belegt.");
  await page.keyboard.press("Escape");

  await card.click();
  await page.getByTestId("appointment-cancel").click();
  await expect(page.getByTestId("calendar-message")).toHaveText("Termin storniert.");
});
