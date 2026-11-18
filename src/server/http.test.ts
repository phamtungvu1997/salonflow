import { describe, expect, it } from "vitest";

import { apiError } from "./http";
import { BookingError } from "./time";

describe("booking HTTP errors", () => {
  it("returns HTTP 409 for overlap and stale version", async () => {
    const overlap = apiError(new BookingError(409, "conflict", "Die Zeit ist bereits belegt."));
    const version = apiError(new BookingError(409, "version", "Der Termin wurde inzwischen geändert."));

    expect(overlap.status).toBe(409);
    expect(version.status).toBe(409);
    await expect(overlap.json()).resolves.toEqual({
      error: "Die Zeit ist bereits belegt.",
      code: "conflict",
    });
    await expect(version.json()).resolves.toMatchObject({ code: "version" });
  });
});
