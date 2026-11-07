import { expect, test } from "@playwright/test";

const routes = [
  { path: "/kalender", testId: "page-kalender", label: "Kalender" },
  { path: "/kunden", testId: "page-kunden", label: "Kunden" },
  { path: "/mitarbeiter", testId: "page-mitarbeiter", label: "Mitarbeiter" },
  { path: "/leistungen", testId: "page-leistungen", label: "Leistungen" },
  { path: "/einstellungen", testId: "page-einstellungen", label: "Einstellungen" },
] as const;

test.describe("Hauptnavigation", () => {
  test("leitet Startseite auf Kalender um", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/kalender$/);
    await expect(page.getByTestId("page-kalender")).toBeVisible();
  });

  for (const route of routes) {
    test(`öffnet ${route.label}`, async ({ page }) => {
      await page.goto("/kalender");
      await page.getByTestId(`nav-${route.path.replace("/", "")}`).click();
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await expect(page.getByTestId(route.testId)).toBeVisible();
      await expect(page.getByTestId("placeholder-notice")).toBeVisible();
    });
  }

  test("kann Seitenleiste einklappen", async ({ page }) => {
    await page.goto("/kalender");
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await page.getByTestId("sidebar-toggle").click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  });

  test("Salon-Umschalter und Kalender-Toolbar sind sichtbar", async ({
    page,
  }) => {
    await page.goto("/kalender");
    await expect(page.getByTestId("salon-selector")).toBeVisible();
    await expect(page.getByTestId("calendar-toolbar")).toBeVisible();
    await expect(page.getByTestId("calendar-day-grid")).toBeVisible();
    await page.getByTestId("salon-selector").selectOption("salon_juliet");
    await expect(page.getByTestId("salon-selector")).toHaveValue("salon_juliet");
  });
});
