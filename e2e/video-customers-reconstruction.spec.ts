import { expect, test } from "@playwright/test";

test("Video-Ablauf Kundenmodul: Verzeichnis, Suche, Filter, Kontextmenü, Formular, Profil, Termine & Kundengruppen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1560, height: 980 });

  await page.goto("/anmelden");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/kalender/);

  // Navigate to Kunden via sidebar
  await page.getByTestId("nav-kunden").click();
  await expect(page).toHaveURL(/\/kunden/);
  await expect(page.getByTestId("customer-admin")).toBeVisible();
  await expect(page.getByTestId("customer-open-cust_klara")).toBeVisible();

  // 1. Customer Directory screenshot (00:07 in video)
  await page.screenshot({ path: "test-results/customers-state-1-directory.png" });

  // 2. Customer Search interaction
  const searchInput = page.getByTestId("customer-search-input");
  await searchInput.fill("Klara");
  await expect(page.getByTestId("customer-results-count")).toHaveText("Gefundene Ergebnisse: 1");
  await expect(page.getByTestId("customer-open-cust_klara")).toBeVisible();
  await page.screenshot({ path: "test-results/customers-state-2-search.png" });

  // Clear search and verify full list restores
  await page.getByTestId("customer-search-clear").click();
  await expect(page.getByTestId("customer-results-count")).toHaveText("Gefundene Ergebnisse: 19");
  await expect(page.getByTestId("customer-open-cust_amira")).toBeVisible();

  // 3. Expanded Two-Pane Filter Popover (00:49 - 01:10 in video)
  await page.getByTestId("customer-filter-button").click();
  await expect(page.getByTestId("customer-filter-popover")).toBeVisible();
  await expect(page.getByTestId("customer-filter-subpane")).toBeVisible();
  await page.getByTestId("filter-category-gender").click();
  await page.screenshot({ path: "test-results/customers-state-3-filter-popover.png" });

  // Apply a filter and verify active filter chip appears, then reset
  await page.getByTestId("filter-category-labels").click();
  await page.getByTestId("customer-filter-add").click();
  await expect(page.getByTestId("customer-active-filters")).toContainText("Label: Favorit");
  await page.getByText("Filter zurücksetzen").click();
  await expect(page.getByTestId("customer-active-filters")).toHaveCount(0);

  // 4. Row Context Menu (00:11 in video: Call, Edit, Archive customer)
  await page.getByTestId("customer-row-menu-cust_amira").click();
  await expect(page.getByTestId("customer-row-context-menu")).toBeVisible();
  await expect(page.getByTestId("context-menu-call")).toBeVisible();
  await expect(page.getByTestId("context-menu-edit")).toBeVisible();
  await expect(page.getByTestId("context-menu-archive")).toBeVisible();
  await page.screenshot({ path: "test-results/customers-state-4-row-context-menu.png" });
  // Close context menu by clicking row menu button again
  await page.getByTestId("customer-row-menu-cust_amira").click();

  // 5. Create Customer Modal & required-field validation (00:14 & 01:38 in video)
  await page.getByTestId("customer-create-open").click();
  await expect(page.getByTestId("customer-form-modal")).toBeVisible();
  // Click Save on empty form to verify inline required validation
  await page.getByTestId("customer-create").click();
  await expect(page.getByTestId("customer-first-name-required")).toBeVisible();
  await expect(page.getByTestId("customer-last-name-required")).toBeVisible();
  await page.screenshot({ path: "test-results/customers-state-5-create-modal.png" });

  // 6. Populate Customer Form and Save to PostgreSQL
  await page.getByTestId("customer-name").fill("Valerie");
  await page.getByTestId("customer-last-name").fill("Lindqvist");
  await page.getByTestId("customer-gender-female").check({ force: true });
  await page.getByTestId("customer-birth-date").fill("1995-04-18");
  await page.getByTestId("customer-email").fill("valerie.lindqvist@example.test");
  await page.getByTestId("customer-phone").fill("+49 151 88442211");
  await page.getByTestId("customer-postal-code").fill("22303");
  await page.getByTestId("customer-house-number").fill("16");
  await page.getByTestId("customer-address").fill("Borgweg");
  await page.getByTestId("customer-city").fill("Hamburg");
  await page.getByTestId("customer-label-favorit").click();
  await page
    .getByTestId("customer-additional-info")
    .fill("Bevorzugt Mandelform und milchiges Aufbaugel.");
  await page.screenshot({ path: "test-results/customers-state-6-populated-form.png" });

  await page.getByTestId("customer-create").click();
  await expect(page.getByTestId("customer-form-modal")).toHaveCount(0);
  await expect(page.getByTestId("customer-message")).toContainText("Kundin gespeichert.");
  await expect(
    page.getByRole("button", { name: "Valerie Lindqvist", exact: true }),
  ).toBeVisible();

  // 7. Customer Profile Overview (00:21 & 02:10 in video)
  await page.getByTestId("customer-open-cust_klara").click();
  await expect(page.getByTestId("customer-profile")).toBeVisible();
  await expect(page.getByTestId("profile-customer-name")).toHaveText("Klara Beispiel");
  await expect(page.getByTestId("profile-details-card")).toContainText(
    "klara.beispiel@example.test",
  );
  await expect(page.getByTestId("profile-kpi-appointments")).toContainText("3");
  await expect(page.getByTestId("profile-history-card")).toContainText("Termin erstellt");
  await page.screenshot({ path: "test-results/customers-state-7-profile-overview.png" });

  // 8. Customer Profile Navigation: Appointments tab (00:27 in video) + Edit persistence
  await page.getByTestId("profile-tab-appointments").click();
  await expect(page.getByTestId("profile-appointments-panel")).toBeVisible();
  await expect(page.getByTestId("profile-appointments-panel")).toContainText("Shellac");
  await expect(page.getByTestId("profile-appointments-panel")).toContainText("Lena Berger");
  await page.screenshot({ path: "test-results/customers-state-8-profile-appointments.png" });

  // Edit customer from profile header, save, reload page, and verify persistence
  await page.getByTestId("profile-edit-button").click();
  await expect(page.getByTestId("customer-form-modal")).toBeVisible();
  await page
    .getByTestId("customer-additional-info")
    .fill("Wünscht French Gel-Design und warmen Jasmin-Tee.");
  await page.getByTestId("customer-create").click();
  await expect(page.getByTestId("customer-form-modal")).toHaveCount(0);
  await page.getByTestId("profile-tab-overview").click();
  await expect(page.getByTestId("profile-notes-card")).toContainText(
    "Wünscht French Gel-Design und warmen Jasmin-Tee.",
  );

  // Back to directory
  await page.getByTestId("profile-back-button").click();
  await expect(page.getByTestId("customer-list")).toBeVisible();

  // 9. Customer Groups tab (01:58 - 02:05 in video)
  await page.getByTestId("customers-tab-groups").click();
  await expect(page.getByTestId("customer-groups-panel")).toBeVisible();
  await expect(page.getByTestId("segment-first-visit")).toBeVisible();
  await expect(page.getByTestId("segment-lapsing")).toBeVisible();
  await expect(page.locator("[data-testid='customer-groups-panel'] tbody tr")).toHaveCount(1);
  await page.screenshot({ path: "test-results/customers-state-9-groups.png" });

  // Verify newly created customer "Valerie Lindqvist" is selectable in Calendar Create Appointment modal
  await page.getByTestId("nav-kalender").click();
  await expect(page).toHaveURL(/\/kalender/);
  await expect(page.getByTestId("column-staff_lena")).toBeVisible();
  await page.getByRole("button", { name: "Termin erstellen" }).click();
  await expect(page.getByTestId("booking-form")).toBeVisible();
  await page.getByTestId("booking-customer-search").fill("Valerie Lindqvist");
  await expect(
    page.getByTestId("booking-form").getByRole("button", { name: "Valerie Lindqvist", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
