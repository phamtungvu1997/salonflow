import type { Db } from "@/server/db";
import { recordOutbox } from "@/server/outbox";
import { addDays, zonedDateTimeToUtc } from "@/server/time";

export type SalonHoliday = {
  id: string;
  name: string;
  date: string;
  enabled: boolean;
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Gregorian Easter Sunday, returned as YYYY-MM-DD. */
export function easterSundayIso(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDate(year, month, day);
}

function shiftIso(date: string, days: number): string {
  return addDays(date, days);
}

/** Statutory holidays for Hamburg, where Jeannie and Juliet operate. */
export function germanHolidaysForYear(year: number): { name: string; date: string }[] {
  const easter = easterSundayIso(year);
  return [
    { name: "Neujahr", date: isoDate(year, 1, 1) },
    { name: "Karfreitag", date: shiftIso(easter, -2) },
    { name: "Ostermontag", date: shiftIso(easter, 1) },
    { name: "Tag der Arbeit", date: isoDate(year, 5, 1) },
    { name: "Christi Himmelfahrt", date: shiftIso(easter, 39) },
    { name: "Pfingstmontag", date: shiftIso(easter, 50) },
    { name: "Tag der Deutschen Einheit", date: isoDate(year, 10, 3) },
    { name: "Reformationstag", date: isoDate(year, 10, 31) },
    { name: "1. Weihnachtstag", date: isoDate(year, 12, 25) },
    { name: "2. Weihnachtstag", date: isoDate(year, 12, 26) },
  ];
}

async function ensureHolidayTable(sql: Db) {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS salon_holidays (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      name text NOT NULL,
      holiday_date date NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      UNIQUE (salon_id, holiday_date, name)
    )
  `);
  await sql.unsafe(`
    ALTER TABLE absences ADD COLUMN IF NOT EXISTS holiday_id text
  `);
}

export async function syncHolidayAbsences(sql: Db, salonId: string, holidayId: string) {
  const rows = await sql<{ name: string; holiday_date: string; enabled: boolean }[]>`
    SELECT name, holiday_date::text AS holiday_date, enabled
    FROM salon_holidays
    WHERE id = ${holidayId} AND salon_id = ${salonId}
  `;
  const holiday = rows[0];
  const existing = await sql<{ id: string }[]>`
    SELECT id FROM absences WHERE holiday_id = ${holidayId} AND salon_id = ${salonId}
  `;

  await sql.begin(async (tx) => {
    for (const row of existing) {
      await tx`DELETE FROM absences WHERE id = ${row.id}`;
      await recordOutbox(tx, salonId, row.id, "absence.deleted");
    }
    if (!holiday?.enabled) return;

    const staff = await tx<{ id: string }[]>`
      SELECT s.id
      FROM staff s
      JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${salonId} AND a.active
      WHERE s.active
    `;
    const startsAt = zonedDateTimeToUtc(holiday.holiday_date, "08:00");
    const endsAt = zonedDateTimeToUtc(holiday.holiday_date, "20:00");
    for (const member of staff) {
      const absenceId = `abs_hol_${holidayId}_${member.id}`;
      await tx`
        INSERT INTO absences (id, staff_id, salon_id, starts_at, ends_at, reason, holiday_id)
        VALUES (
          ${absenceId},
          ${member.id},
          ${salonId},
          ${startsAt},
          ${endsAt},
          ${holiday.name},
          ${holidayId}
        )
        ON CONFLICT (id) DO UPDATE SET
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          reason = EXCLUDED.reason,
          staff_id = EXCLUDED.staff_id
      `;
      await recordOutbox(tx, salonId, absenceId, "absence.created");
    }
  });
}

export async function ensureGermanHolidays(sql: Db, salonId: string, years: number[]) {
  await ensureHolidayTable(sql);
  for (const year of years) {
    for (const holiday of germanHolidaysForYear(year)) {
      const id = `hol_${salonId}_${holiday.date}`;
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO salon_holidays (id, salon_id, name, holiday_date, enabled)
        VALUES (${id}, ${salonId}, ${holiday.name}, ${holiday.date}, true)
        ON CONFLICT (salon_id, holiday_date, name) DO NOTHING
        RETURNING id
      `;
      if (inserted[0]) {
        await syncHolidayAbsences(sql, salonId, inserted[0].id);
      }
    }
  }
}

export async function listSalonHolidays(sql: Db, salonId: string): Promise<SalonHoliday[]> {
  const year = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric" }).format(new Date()),
  );
  await ensureGermanHolidays(sql, salonId, [year, year + 1]);
  const missing = await sql<{ id: string }[]>`
    SELECT h.id
    FROM salon_holidays h
    WHERE h.salon_id = ${salonId}
      AND h.enabled = true
      AND NOT EXISTS (
        SELECT 1 FROM absences a WHERE a.holiday_id = h.id AND a.salon_id = ${salonId}
      )
  `;
  for (const row of missing) {
    await syncHolidayAbsences(sql, salonId, row.id);
  }
  const rows = await sql<{ id: string; name: string; holiday_date: string; enabled: boolean }[]>`
    SELECT id, name, holiday_date::text AS holiday_date, enabled
    FROM salon_holidays
    WHERE salon_id = ${salonId}
    ORDER BY holiday_date, name
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    date: row.holiday_date.slice(0, 10),
    enabled: row.enabled,
  }));
}
