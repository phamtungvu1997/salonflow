import { describe, expect, it } from "vitest";

import { coversShift, zonedDateTimeToUtc } from "./time";

describe("Berlin time conversion", () => {
  it("converts winter and summer wall times to UTC", () => {
    expect(zonedDateTimeToUtc("2026-11-07", "10:00").toISOString()).toBe(
      "2026-11-07T09:00:00.000Z",
    );
    expect(zonedDateTimeToUtc("2026-07-07", "10:00").toISOString()).toBe(
      "2026-07-07T08:00:00.000Z",
    );
  });

  it("requires the visit to sit inside one shift", () => {
    expect(coversShift([{ startMinute: 600, endMinute: 720 }], 600, 660)).toBe(true);
    expect(coversShift([{ startMinute: 600, endMinute: 720 }], 750, 810)).toBe(false);
  });
});
