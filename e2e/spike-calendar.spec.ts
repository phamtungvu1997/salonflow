import { expect, test } from "@playwright/test";

test.describe("M03 Kalender-Spike", () => {
  test("Spike-Index und Adapter-Routen laden", async ({ page }) => {
    await page.goto("/spike/kalender");
    await expect(page.getByTestId("page-spike-kalender")).toBeVisible();

    await page.goto("/spike/kalender/native");
    await expect(page.getByTestId("page-spike-native")).toBeVisible();
    await expect(page.getByTestId("adapter-native")).toBeVisible();

    await page.goto("/spike/kalender/rbc");
    await expect(page.getByTestId("page-spike-rbc")).toBeVisible();
    await expect(page.getByTestId("adapter-rbc")).toBeVisible();

    await page.goto("/spike/kalender/daypilot");
    await expect(page.getByTestId("page-spike-daypilot")).toBeVisible();
    await expect(page.getByTestId("adapter-daypilot")).toBeVisible();
  });
});
