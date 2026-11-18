export const APP_TIME_ZONE = "Europe/Berlin";

export class BookingError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function parseMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new BookingError(422, "invalid_time", "Uhrzeit muss im Format HH:MM sein.");
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new BookingError(422, "invalid_time", "Ungültige Uhrzeit.");
  }
  return hours * 60 + minutes;
}

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone = APP_TIME_ZONE,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BookingError(422, "invalid_date", "Datum muss JJJJ-MM-TT sein.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0);
  const utc = new Date(wall - zoneOffsetMs(new Date(wall), timeZone));
  return new Date(wall - zoneOffsetMs(utc, timeZone));
}

export function isoWeekday(instant: Date, timeZone = APP_TIME_ZONE): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(instant);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const weekday = map[label];
  if (!weekday) throw new BookingError(422, "invalid_date", "Wochentag unbekannt.");
  return weekday;
}

export function minutesOfDay(instant: Date, timeZone = APP_TIME_ZONE): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function coversShift(
  shifts: { startMinute: number; endMinute: number }[],
  startMinute: number,
  endMinute: number,
): boolean {
  return shifts.some(
    (shift) => startMinute >= shift.startMinute && endMinute <= shift.endMinute,
  );
}
