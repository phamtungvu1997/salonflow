import { expect, test } from "@playwright/test";

test("Video-Ablauf: Sonntag, Tageswechsel, Wochenansicht, Mitarbeiter-Fokus, Popover & Termin bearbeiten", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 960 });

  await page.goto("/anmelden");
  await page.getByTestId("login-email").fill("empfang.jeannie@salonflow.example");
  await page.getByTestId("login-password").fill("salonflow-dev");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("calendar-board")).toBeVisible();

  // State 1: Sunday 2026-11-08 (Emma Wolf shift 13:00-18:45, others hatched, current-time indicator)
  await page.getByTestId("calendar-date").fill("2026-11-08");
  await expect(page.getByTestId("column-staff_emma")).toBeVisible();
  await expect(page.locator("[data-testid^='appointment-']")).toHaveCount(0);
  await expect(page.getByTestId("slot-staff_emma-14:00")).toBeEnabled();
  await expect(page.getByTestId("slot-staff_lena-14:00")).toBeDisabled();
  await page.screenshot({ path: "test-results/video-state-1-sunday.png" });

  // State 2: Navigate to Monday 2026-11-09 via Next Day (>) button
  await page.getByRole("button", { name: "Nächster Tag" }).click();
  await expect(page.getByTestId("appointment-appt_demo_1")).toBeVisible();
  await expect(page.getByTestId("appointment-appt_demo_1")).toContainText("09:00 - 10:00");
  await expect(page.getByTestId("appointment-appt_demo_1")).toContainText("Klara Beispiel");
  await expect(page.getByTestId("appointment-appt_demo_1")).toContainText("Shellac");
  await expect(page.getByTestId("absence-abs_demo_julia_1")).toContainText("ist nicht verfügbar");
  await page.screenshot({ path: "test-results/video-state-2-monday-populated.png" });

  // State 3: Date Picker Popover with KW Week Numbers
  await page.getByTestId("calendar-date-trigger").click();
  await expect(page.getByTestId("calendar-date-calendar")).toBeVisible();
  await expect(page.getByTestId("calendar-date-calendar")).toContainText("KW");
  await page.screenshot({ path: "test-results/video-state-3-datepicker.png" });
  await page.getByTestId("calendar-date-trigger").click();

  // State 4: Multi-week jump menu (>> 1 Woche .. 10 Wochen)
  await page.getByTestId("calendar-jump-bracket").click();
  await expect(page.getByTestId("calendar-jump-menu")).toBeVisible();
  await expect(page.getByTestId("calendar-jump-menu")).toContainText("1 Woche");
  await expect(page.getByTestId("calendar-jump-menu")).toContainText("9 Wochen");
  await page.screenshot({ path: "test-results/video-state-4-jump-menu.png" });
  await page.getByTestId("calendar-jump-bracket").click();

  // State 5: Navigate forward to Wednesday 2026-11-11 & filter to a single employee column
  await page.getByRole("button", { name: "Nächster Tag" }).click();
  await page.getByRole("button", { name: "Nächster Tag" }).click();
  await expect(page.getByTestId("appointment-appt_demo_13")).toBeVisible();

  await page.getByTestId("calendar-employees-bracket").click();
  await page.getByTestId("focus-staff-staff_emma").click();
  await expect(page.getByTestId("column-staff_emma")).toBeVisible();
  await expect(page.getByTestId("column-staff_lena")).toHaveCount(0);
  await page.screenshot({ path: "test-results/video-state-5-single-employee.png" });

  // Restore all employees
  await page.getByTestId("calendar-employees-bracket").click();
  await page.getByTestId("calendar-employees-all").click();
  await page.getByTestId("calendar-employees-bracket").click();
  await expect(page.getByTestId("column-staff_lena")).toBeVisible();

  // State 6: Switch to 7-Day Week View (Woche) and back to Day View (Tag)
  await page.getByTestId("calendar-view-bracket").click();
  await page.getByTestId("calendar-view-week").click();
  await expect(page.getByTestId("calendar-week-grid")).toBeVisible();
  await expect(page.getByTestId("week-day-header-2026-11-09")).toBeVisible();
  await page.screenshot({ path: "test-results/video-state-6-week-view.png" });

  // Click Monday header in Week view to return to Monday Day view
  await page.getByTestId("week-day-header-2026-11-09").click();
  await expect(page.getByTestId("calendar-day-grid")).toBeVisible();

  // State 7: Click Unavailability Block -> Absence Popover (includes Stornieren button)
  await page.getByTestId("absence-abs_demo_julia_1").click();
  await expect(page.getByTestId("absence-popover")).toBeVisible();
  await expect(page.getByTestId("absence-popover")).toContainText(
    "Julia Krüger ist nicht verfügbar",
  );
  await expect(page.getByTestId("absence-cancel")).toBeVisible();
  await expect(page.getByTestId("absence-cancel")).toHaveText("Stornieren");
  await page.screenshot({ path: "test-results/video-state-7-absence-popover.png" });
  await page.getByTestId("absence-popover").getByRole("button", { name: "Schließen" }).click();

  // State 8: Click Customer Appointment -> Floating Detail Popover
  await page.getByTestId("appointment-appt_demo_1").click();
  const detailPopover = page.getByTestId("appointment-dialog");
  await expect(detailPopover).toBeVisible();
  await expect(detailPopover).toContainText("Klara Beispiel");
  await expect(detailPopover).toContainText("Shellac");
  await expect(detailPopover).toContainText("60 Min.");
  await page.screenshot({ path: "test-results/video-state-8-appointment-popover.png" });

  // State 9: Click Pencil (Bearbeiten) -> Full Two-Column Edit Appointment Modal
  await page.getByTestId("appointment-edit-open").click();
  const editModal = page.getByTestId("appointment-edit-modal");
  await expect(editModal).toBeVisible();
  await expect(editModal).toContainText("Termin bearbeiten");
  await expect(editModal).toContainText("Klara Beispiel");
  await expect(editModal).toContainText("42,00 €");
  await page.screenshot({ path: "test-results/video-state-9-edit-modal.png" });
  await page.getByTestId("appointment-edit-close").click();
  await expect(editModal).toHaveCount(0);
});
