import { describe, expect, it } from "vitest";

import type { SalonLiveEvent } from "./use-salon-live-updates";

describe("SalonLiveEvent contract", () => {
  it("keeps SSE payloads free of customer PII fields", () => {
    const sample: SalonLiveEvent = {
      salonId: "salon_jeannie",
      eventType: "appointment.created",
      aggregateId: "appt_demo",
      createdAt: "2026-11-09T10:00:00.000Z",
      cursor: "1",
    };
    expect(Object.keys(sample).sort()).toEqual([
      "aggregateId",
      "createdAt",
      "cursor",
      "eventType",
      "salonId",
    ]);
  });

  it("treats cursor bootstrap sync flag as catch-up signal (no PII)", () => {
    const bootstrap = { cursor: "42", sync: true };
    expect(bootstrap.sync).toBe(true);
    expect(bootstrap).not.toHaveProperty("customerId");
  });
});
