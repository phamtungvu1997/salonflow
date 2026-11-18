import { describe, expect, it } from "vitest";

import { easterSundayIso, germanHolidaysForYear } from "./holidays";

describe("German holidays", () => {
  it("places the 2026 movable feasts on the Hamburg dates", () => {
    expect(easterSundayIso(2026)).toBe("2026-04-05");
    const names = Object.fromEntries(germanHolidaysForYear(2026).map((row) => [row.name, row.date]));
    expect(names.Karfreitag).toBe("2026-04-03");
    expect(names.Ostermontag).toBe("2026-04-06");
    expect(names["Christi Himmelfahrt"]).toBe("2026-05-14");
    expect(names.Pfingstmontag).toBe("2026-05-25");
    expect(names.Reformationstag).toBe("2026-10-31");
    expect(names.Neujahr).toBe("2026-01-01");
  });
});
