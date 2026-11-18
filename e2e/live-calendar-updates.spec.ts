import path from "node:path";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "live-calendar-updates");
const DATE = "2026-11-16"; // Monday — free Lena afternoon slot

test.describe("SalonFlow — M12 Live Calendar Updates (SF-038)", () => {
  test.setTimeout(180_000);

  test("authorized peer calendar refreshes from outbox without manual reload; foreign salon stays isolated", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await pageA.setViewportSize({ width: 1440, height: 900 });
    await pageB.setViewportSize({ width: 1440, height: 900 });

    async function login(page: typeof pageA) {
      await page.goto("/anmelden");
      await page.getByTestId("login-email").fill("owner@salonflow.example");
      await page.getByTestId("login-password").fill("salonflow-dev");
      await page.getByTestId("login-submit").click();
      await expect(page.getByTestId("calendar-board")).toBeVisible();
    }

    await Promise.all([login(pageA), login(pageB)]);

    await pageA.getByTestId("calendar-date").fill(DATE);
    await pageB.getByTestId("calendar-date").fill(DATE);
    await expect(pageA.getByTestId("column-staff_lena")).toBeVisible();
    await expect(pageB.getByTestId("column-staff_lena")).toBeVisible();

    // Wait until live transport is attached on observer calendar.
    await expect(pageA.getByTestId("calendar-board")).toHaveAttribute(
      "data-live-status",
      /(sse|poll)/,
      { timeout: 15_000 },
    );

    const suffix = Date.now().toString().slice(-5);
    const customerName = `Live Peer ${suffix}`;

    const customersRes = await pageB.request.get(
      `/api/customers?salonId=salon_jeannie&q=${encodeURIComponent("Klara Beispiel")}`,
    );
    expect(customersRes.ok()).toBeTruthy();
    const customersBody = (await customersRes.json()) as {
      customers: { id: string; displayName: string }[];
    };
    const klara = customersBody.customers.find((c) => c.displayName === "Klara Beispiel");
    expect(klara).toBeTruthy();

    const servicesRes = await pageB.request.get("/api/services?salonId=salon_jeannie");
    expect(servicesRes.ok()).toBeTruthy();
    const servicesBody = (await servicesRes.json()) as {
      services: { id: string; name: string }[];
    };
    const manicure = servicesBody.services.find((s) => /Maniküre/i.test(s.name));
    expect(manicure).toBeTruthy();

    // Create via Booking Engine API from session B (authoritative write path).
    const createRes = await pageB.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_lena",
        customerId: klara!.id,
        serviceId: manicure!.id,
        date: DATE,
        start: "16:00",
        notes: customerName,
        idempotencyKey: `live_${suffix}`,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()) as { appointmentId: string; version?: number };
    expect(created.appointmentId).toBeTruthy();
    const expectedVersion = created.version ?? 1;

    // Session A must receive invalidation and show the new card without manual reload.
    await expect(pageA.getByRole("button", { name: /Klara Beispiel/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(pageA.getByRole("button", { name: /Klara Beispiel/ })).toContainText("16:00");

    await pageA.screenshot({
      path: path.join(SCREENSHOT_DIR, "sf038-peer-refresh.png"),
      fullPage: false,
    });

    // Salon isolation: Juliet session must not see Jeannie appointment on Juliet board.
    await pageB.getByTestId("salon-selector").selectOption("salon_juliet");
    await expect(pageB.getByTestId("salon-selector")).toHaveValue("salon_juliet");
    await pageB.getByTestId("calendar-date").fill(DATE);
    await expect(pageB.getByTestId("calendar-board")).toBeVisible();
    await expect(pageB.getByRole("button", { name: /Klara Beispiel/ })).toHaveCount(0);

    // Unauthorized poll for a salon outside membership must fail (use receptionist limited to Jeannie).
    const limited = await browser.newContext();
    const limitedPage = await limited.newPage();
    await limitedPage.goto("/anmelden");
    await limitedPage.getByTestId("login-email").fill("empfang.jeannie@salonflow.example");
    await limitedPage.getByTestId("login-password").fill("salonflow-dev");
    await limitedPage.getByTestId("login-submit").click();
    await expect(limitedPage.getByTestId("calendar-board")).toBeVisible();
    const forbidden = await limitedPage.request.get(
      "/api/events?salonId=salon_juliet&mode=poll",
    );
    expect(forbidden.status()).toBe(403);

    // Cleanup created appointment so later suites stay stable.
    await pageA.request.post(`/api/appointments/${created.appointmentId}/cancel`, {
      data: { expectedVersion },
    });

    // Cold-start / late-subscribe catch-up: book while observer is on another salon,
    // then switch back — SSE bootstrap must refetch, not skip the tip event.
    await pageA.getByTestId("salon-selector").selectOption("salon_juliet");
    await expect(pageA.getByTestId("salon-selector")).toHaveValue("salon_juliet");

    const lateSuffix = `${suffix}b`;
    const lateCreate = await pageB.request.post("/api/appointments", {
      data: {
        salonId: "salon_jeannie",
        staffId: "staff_lena",
        customerId: klara!.id,
        serviceId: manicure!.id,
        date: DATE,
        start: "17:00",
        notes: `Late sync ${lateSuffix}`,
        idempotencyKey: `live_late_${lateSuffix}`,
      },
    });
    expect(lateCreate.status()).toBe(201);
    const lateBody = (await lateCreate.json()) as { appointmentId: string; version?: number };

    await pageA.getByTestId("salon-selector").selectOption("salon_jeannie");
    await expect(pageA.getByTestId("salon-selector")).toHaveValue("salon_jeannie");
    await pageA.getByTestId("calendar-date").fill(DATE);
    await expect(pageA.getByRole("button", { name: /Klara Beispiel/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(pageA.getByRole("button", { name: /Klara Beispiel/ })).toContainText("17:00");

    await pageA.screenshot({
      path: path.join(SCREENSHOT_DIR, "sf038-cold-start-catchup.png"),
      fullPage: false,
    });

    await pageA.request.post(`/api/appointments/${lateBody.appointmentId}/cancel`, {
      data: { expectedVersion: lateBody.version ?? 1 },
    });

    await contextA.close();
    await contextB.close();
    await limited.close();
  });
});
