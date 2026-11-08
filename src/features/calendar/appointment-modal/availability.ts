import { minutesLabel } from "@/features/calendar/calendar-date";

import type { BusyRange, ShiftWindow } from "./types";

export type AvailabilitySlot = {
  start: string;
  end: string;
  startMinute: number;
  free: boolean;
};

/** Read-only suggestions from a shift and existing bookings. The server still decides the write. */
export function availabilitySlots(input: {
  shifts: ShiftWindow[];
  weekday: number;
  durationMinutes: number;
  busy: BusyRange[];
  staffId: string;
}): AvailabilitySlot[] {
  const shift = input.shifts.find((item) => item.isoWeekday === input.weekday);
  if (!shift || input.durationMinutes < 5) return [];
  const slots: AvailabilitySlot[] = [];
  for (let minute = shift.startMinute; minute + input.durationMinutes <= shift.endMinute; minute += 15) {
    const end = minute + input.durationMinutes;
    const free = !input.busy.some(
      (item) => item.staffId === input.staffId && minute < item.endMinute && end > item.startMinute,
    );
    slots.push({
      start: minutesLabel(minute),
      end: minutesLabel(end),
      startMinute: minute,
      free,
    });
  }
  return slots;
}
