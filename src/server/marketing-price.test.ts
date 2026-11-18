import { describe, expect, it } from "vitest";

import { quotePrice } from "./marketing-price";

const settings = {
  lastMinuteEnabled: true,
  lastMinutePercent: 15,
  lastMinuteHours: 2,
  dynamicPricingEnabled: true,
};

describe("quotePrice", () => {
  it("keeps the catalog price when no rule matches", () => {
    const quoted = quotePrice({
      catalogCents: 4200,
      slotStart: new Date("2026-11-20T10:00:00Z"),
      now: new Date("2026-11-18T10:00:00Z"),
      settings,
      windows: [],
      slotDate: "2026-11-20",
    });
    expect(quoted.priceCents).toBe(4200);
    expect(quoted.labels).toEqual([]);
  });

  it("applies a dynamic window instead of last-minute", () => {
    const start = new Date("2026-11-20T10:00:00Z");
    const quoted = quotePrice({
      catalogCents: 4200,
      slotStart: start,
      now: new Date("2026-11-20T09:00:00Z"),
      settings,
      windows: [
        {
          changeType: "discount",
          percentage: 10,
          startsAt: new Date("2026-11-20T08:00:00Z"),
          endsAt: new Date("2026-11-20T18:00:00Z"),
        },
      ],
      slotDate: "2026-11-20",
    });
    expect(quoted.priceCents).toBe(3780);
    expect(quoted.labels[0]).toContain("Zeitfenster");
  });

  it("applies last-minute when the slot is inside the hour window", () => {
    const start = new Date("2026-11-20T11:00:00Z");
    const quoted = quotePrice({
      catalogCents: 4000,
      slotStart: start,
      now: new Date("2026-11-20T10:00:00Z"),
      settings: { ...settings, dynamicPricingEnabled: false },
      windows: [],
      slotDate: "2026-11-20",
    });
    expect(quoted.priceCents).toBe(3400);
  });

  it("stacks a valid discount code after the catalog price", () => {
    const quoted = quotePrice({
      catalogCents: 4200,
      slotStart: new Date("2026-12-01T10:00:00Z"),
      now: new Date("2026-11-18T10:00:00Z"),
      settings,
      windows: [],
      slotDate: "2026-12-01",
      code: {
        percentage: 20,
        enabled: true,
        validFrom: "2026-11-01",
        expirationMode: "never",
        limitTotalUses: false,
        usedCount: 0,
      },
    });
    expect(quoted.priceCents).toBe(3360);
  });
});
