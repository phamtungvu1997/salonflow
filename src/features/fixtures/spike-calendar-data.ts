import type {
  CalendarAppointmentView,
  CalendarStaffColumn,
} from "@/features/calendar/adapter/types";

const FIRST_NAMES = [
  "Clara",
  "Nora",
  "Mila",
  "Sofia",
  "Elena",
  "Tina",
  "Jana",
  "Greta",
  "Lara",
  "Nina",
];
const LAST_NAMES = [
  "Berger",
  "Hartmann",
  "Vogel",
  "Keller",
  "Neumann",
  "Schäfer",
  "Krüger",
  "Bauer",
  "Wolf",
  "Jung",
];
const SERVICES = [
  "Maniküre Classic",
  "Gelnägel Neuset",
  "Auffüllen",
  "Shellac",
  "Pediküre",
  "Nail Art",
];
const COLORS = [
  "#c9b6a5",
  "#8fb4a8",
  "#9bb0c7",
  "#d4a5b0",
  "#b7c9a5",
  "#c98697",
  "#a8b5c9",
  "#d2c2a5",
  "#9fc0b4",
  "#c7b0c9",
];

/** Fixed spike day in Europe/Berlin local wall time (synthetic). */
export const SPIKE_DAY = new Date(2026, 10, 7, 0, 0, 0, 0);

export function buildSpikeStaff(count = 20): CalendarStaffColumn[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `spike_staff_${String(index + 1).padStart(2, "0")}`,
    displayName: `Tech ${String(index + 1).padStart(2, "0")}`,
    color: COLORS[index % COLORS.length],
  }));
}

function atMinutes(day: Date, minutesFromMidnight: number): Date {
  const result = new Date(day);
  result.setHours(0, 0, 0, 0);
  result.setMinutes(minutesFromMidnight);
  return result;
}

/**
 * Deterministic ≥250 appointments across 20 staff for calendar A/B spikes.
 * Not persisted. Not a booking engine.
 */
export function buildSpikeAppointments(
  staff: CalendarStaffColumn[],
  targetCount = 250,
): CalendarAppointmentView[] {
  const appointments: CalendarAppointmentView[] = [];
  let sequence = 0;
  const dayStartMinutes = 10 * 60; // 10:00
  const dayEndMinutes = 20 * 60; // 20:00

  while (appointments.length < targetCount) {
    for (const member of staff) {
      if (appointments.length >= targetCount) break;
      const slotIndex = Math.floor(sequence / staff.length);
      const startMinute = dayStartMinutes + (slotIndex % 20) * 30;
      if (startMinute + 45 > dayEndMinutes) {
        sequence += 1;
        continue;
      }
      const duration = 30 + (sequence % 3) * 15;
      const customerName = `${FIRST_NAMES[sequence % FIRST_NAMES.length]} ${
        LAST_NAMES[sequence % LAST_NAMES.length]
      }`;
      const serviceName = SERVICES[sequence % SERVICES.length];
      appointments.push({
        id: `spike_appt_${String(appointments.length + 1).padStart(4, "0")}`,
        staffId: member.id,
        title: customerName,
        serviceName,
        start: atMinutes(SPIKE_DAY, startMinute),
        end: atMinutes(SPIKE_DAY, startMinute + duration),
      });
      sequence += 1;
    }
    if (sequence > targetCount * 4) break;
  }

  return appointments;
}

export const spikeStaff = buildSpikeStaff(20);
export const spikeAppointments = buildSpikeAppointments(spikeStaff, 250);
