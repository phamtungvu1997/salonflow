import { describe, expect, it } from "vitest";

import {
  APP_LOCALE,
  APP_TIME_ZONE,
  WEEK_STARTS_ON,
  formatEuro,
  formatGermanDate,
  formatGermanTime,
} from "./locale";

describe("locale defaults", () => {
  it("uses German operational defaults", () => {
    expect(APP_LOCALE).toBe("de-DE");
    expect(APP_TIME_ZONE).toBe("Europe/Berlin");
    expect(WEEK_STARTS_ON).toBe(1);
  });

  it("formats dates and currency for de-DE", () => {
    const sample = new Date("2026-11-07T09:30:00+01:00");
    expect(formatGermanDate(sample)).toBe("07.11.2026");
    expect(formatGermanTime(sample)).toMatch(/09:30/);
    expect(formatEuro(6500)).toMatch(/65/);
    expect(formatEuro(6500)).toMatch(/€/);
  });
});
