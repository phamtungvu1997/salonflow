import { describe, expect, it } from "vitest";

import {
  buildSpikeAppointments,
  buildSpikeStaff,
  spikeAppointments,
  spikeStaff,
} from "./spike-calendar-data";

describe("M03 spike fixtures", () => {
  it("builds 20 staff and at least 250 appointments", () => {
    expect(spikeStaff).toHaveLength(20);
    expect(spikeAppointments.length).toBeGreaterThanOrEqual(250);
  });

  it("keeps appointment staff ids within the staff set", () => {
    const staff = buildSpikeStaff(20);
    const appointments = buildSpikeAppointments(staff, 250);
    const ids = new Set(staff.map((s) => s.id));
    for (const appt of appointments) {
      expect(ids.has(appt.staffId)).toBe(true);
      expect(appt.end.getTime()).toBeGreaterThan(appt.start.getTime());
    }
  });
});
