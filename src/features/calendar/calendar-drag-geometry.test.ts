import { describe, expect, it } from "vitest";

import {
  classifyDropAvailability,
  hasExceededDragThreshold,
  resolveCalendarDropTarget,
} from "./calendar-drag-geometry";

describe("calendar-drag-geometry", () => {
  it("distinguishes click vs drag via activation threshold", () => {
    expect(hasExceededDragThreshold(100, 100, 103, 103)).toBe(false);
    expect(hasExceededDragThreshold(100, 100, 106, 100)).toBe(true);
  });

  it("snaps pointer coordinates accurately to 15-minute slots and target employee column, including scroll offsets", () => {
    // Suppose the grid is scrolled down by 112px (4 rows = 60 minutes), so 08:00 row top is at y=88 instead of y=200
    const metrics = {
      firstSlotTopViewportY: 88,
      gridLeftViewportX: 100,
      gridRightViewportX: 700,
      gridTopViewportY: 140,
      gridBottomViewportY: 800,
      slotRowHeightPx: 28,
      slotIntervalMinutes: 15,
      startHour: 8,
      endHour: 21,
      columns: [
        { staffId: "staff_lena", displayName: "Lena Berger", color: "#f4b6c2", left: 100, right: 250 },
        { staffId: "staff_julia", displayName: "Julia Tran", color: "#d8c4f2", left: 250, right: 400 },
      ],
    };

    // Grabbing 10px from card top, pointer at y = 88 + 16*28 + 10 = 546 -> slot index 16 -> 08:00 + 240m = 12:00
    const target = resolveCalendarDropTarget(310, 546, 10, 60, metrics);
    expect(target).not.toBeNull();
    expect(target?.staffId).toBe("staff_julia");
    expect(target?.startMinute).toBe(12 * 60);
    expect(target?.endMinute).toBe(13 * 60);

    // Pointer outside calendar bounds returns null
    expect(resolveCalendarDropTarget(40, 546, 10, 60, metrics)).toBeNull();
  });

  it("classifies available, soft_unavailable (outside shift / absence), and hard_conflict (overlap / ineligible)", () => {
    const base = {
      appointmentId: "appt_1",
      serviceName: "Spa Maniküre",
      targetStaffId: "staff_julia",
      targetStaffName: "Julia Tran",
      targetStartMinute: 14 * 60,
      targetEndMinute: 15 * 60,
      isoWeekday: 1,
      shifts: [{ isoWeekday: 1, startMinute: 9 * 60, endMinute: 18 * 60 }],
      absences: [{ staffId: "staff_julia", startMinute: 16 * 60, endMinute: 17 * 60, reason: "Pause" }],
      appointments: [
        { id: "appt_2", staffId: "staff_julia", startMinute: 12 * 60, endMinute: 13 * 60, status: "booked" },
      ],
      services: [{ id: "svc_1", name: "Spa Maniküre", staffIds: ["staff_lena", "staff_julia"] }],
    };

    // 1. Available inside shift
    expect(classifyDropAvailability(base)).toEqual({ kind: "available" });

    // 2. Soft unavailable outside shift (19:00–20:00)
    expect(
      classifyDropAvailability({
        ...base,
        targetStartMinute: 19 * 60,
        targetEndMinute: 20 * 60,
      }).kind,
    ).toBe("soft_unavailable");

    // 3. Soft unavailable overlapping absence (16:00–17:00)
    expect(
      classifyDropAvailability({
        ...base,
        targetStartMinute: 16 * 60,
        targetEndMinute: 17 * 60,
      }).kind,
    ).toBe("soft_unavailable");

    // 4. Hard conflict overlapping occupied appointment (12:00–13:00)
    expect(
      classifyDropAvailability({
        ...base,
        targetStartMinute: 12 * 60,
        targetEndMinute: 13 * 60,
      }),
    ).toEqual({
      kind: "hard_conflict",
      reason: "Die neue Zeit ist bereits belegt.",
    });

    // 5. Hard conflict when target employee is ineligible for service
    expect(
      classifyDropAvailability({
        ...base,
        services: [{ id: "svc_1", name: "Spa Maniküre", staffIds: ["staff_lena"] }],
      }).kind,
    ).toBe("hard_conflict");
  });
});
