import { expect, test } from "@playwright/test";
import path from "node:path";

const shotDir = path.join("test-results", "branding");

test.describe("SalonFlow Branding", () => {
  test("Login zeigt Lockup und Favicon-Metadaten", async ({ page }) => {
    await page.goto("/anmelden");
    const login = page.getByTestId("page-anmelden");
    await expect(login).toBeVisible();
    await expect(login.getByTestId("brand-logo")).toBeVisible();
    await expect(login.getByRole("img", { name: "SalonFlow" })).toBeVisible();
    const favicon = page.locator('link[rel="icon"]').first();
    await expect(favicon).toHaveAttribute("href", /icon|favicon|salonflow-favicon/);
    await page.screenshot({
      path: path.join(shotDir, "login-lockup.png"),
      fullPage: true,
    });
  });

  test("Sidebar expanded und collapsed", async ({ page }) => {
    await page.goto("/anmelden");
    await page.getByTestId("login-email").fill("empfang.jeannie@salonflow.example");
    await page.getByTestId("login-password").fill("salonflow-dev");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("calendar-board")).toBeVisible();

    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByTestId("brand-logo")).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "sidebar-expanded.png"),
      fullPage: true,
    });

    await page.getByTestId("sidebar-toggle").click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect(page.getByTestId("brand-logo")).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "sidebar-collapsed.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 820, height: 1100 });
    await page.screenshot({
      path: path.join(shotDir, "tablet-layout.png"),
      fullPage: true,
    });
  });
});
