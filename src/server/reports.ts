import type { Db } from "@/server/db";
import { addDays, APP_TIME_ZONE, isoWeekday, zonedDateTimeToUtc } from "@/server/time";
import { loadWidgets } from "@/server/widgets";

export type ReportPreset = "today" | "week" | "month" | "year";

export type ReportRow = { label: string; count: number; cents: number };

export type SalonReport = {
  preset: ReportPreset;
  from: string;
  to: string;
  vatPercent: number;
  appointments: number;
  newCustomers: number;
  grossCents: number;
  netCents: number;
  vatCents: number;
  giftRequestCents: number;
  days: ReportRow[];
  months: ReportRow[];
  services: ReportRow[];
  staff: ReportRow[];
};

function berlinToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function rangeFor(preset: ReportPreset, today: string): { from: string; to: string } {
  if (preset === "today") return { from: today, to: addDays(today, 1) };
  if (preset === "week") {
    const monday = addDays(today, 1 - isoWeekday(zonedDateTimeToUtc(today, "12:00")));
    return { from: monday, to: addDays(monday, 7) };
  }
  if (preset === "month") {
    const start = `${today.slice(0, 7)}-01`;
    const [year, month] = start.split("-").map(Number);
    const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return { from: start, to: next };
  }
  const year = today.slice(0, 4);
  return { from: `${year}-01-01`, to: `${Number(year) + 1}-01-01` };
}

function splitVat(grossCents: number, percent: number): { net: number; vat: number } {
  const net = Math.round((grossCents * 100) / (100 + percent));
  return { net, vat: grossCents - net };
}

function berlinDay(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function addCount(map: Map<string, ReportRow>, label: string, cents: number) {
  const current = map.get(label) ?? { label, count: 0, cents: 0 };
  current.count += 1;
  current.cents += cents;
  map.set(label, current);
}

export async function loadSalonReport(
  sql: Db,
  salonId: string,
  preset: ReportPreset,
): Promise<SalonReport> {
  const widgets = await loadWidgets(sql, salonId);
  const vatPercent = widgets.vat.find((rate) => rate.isDefault)?.percent ?? widgets.vat[0]?.percent ?? 19;
  const today = berlinToday();
  const { from, to } = rangeFor(preset, today);
  const fromUtc = zonedDateTimeToUtc(from, "00:00");
  const toUtc = zonedDateTimeToUtc(to, "00:00");

  const lines = await sql<{
    appointment_id: string;
    start_at: Date;
    title_snapshot: string;
    price_cents_snapshot: number;
    display_name: string;
  }[]>`
    SELECT a.id AS appointment_id, a.start_at, i.title_snapshot, i.price_cents_snapshot, s.display_name
    FROM appointments a
    JOIN appointment_services i ON i.appointment_id = a.id
    JOIN staff s ON s.id = i.staff_id
    WHERE a.salon_id = ${salonId}
      AND a.status NOT IN ('cancelled', 'no_show')
      AND a.start_at >= ${fromUtc}
      AND a.start_at < ${toUtc}
  `;

  const [customers] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM customers
    WHERE home_salon_id = ${salonId}
      AND created_at >= ${fromUtc}
      AND created_at < ${toUtc}
  `;

  const [gifts] = await sql<{ cents: number }[]>`
    SELECT COALESCE(sum(amount_cents), 0)::int AS cents
    FROM widget_gift_requests
    WHERE salon_id = ${salonId}
      AND created_at >= ${fromUtc}
      AND created_at < ${toUtc}
  `;

  const appointmentIds = new Set<string>();
  const days = new Map<string, ReportRow>();
  const months = new Map<string, ReportRow>();
  const services = new Map<string, ReportRow>();
  const staff = new Map<string, ReportRow>();
  let grossCents = 0;

  for (const line of lines) {
    appointmentIds.add(line.appointment_id);
    grossCents += line.price_cents_snapshot;
    const day = berlinDay(line.start_at);
    addCount(days, day, line.price_cents_snapshot);
    addCount(months, day.slice(0, 7), line.price_cents_snapshot);
    addCount(services, line.title_snapshot, line.price_cents_snapshot);
    addCount(staff, line.display_name, line.price_cents_snapshot);
  }

  const { net, vat } = splitVat(grossCents, vatPercent);
  const byCents = (rows: ReportRow[]) => rows.sort((a, b) => b.cents - a.cents || a.label.localeCompare(b.label, "de"));

  return {
    preset,
    from,
    to: addDays(to, -1),
    vatPercent,
    appointments: appointmentIds.size,
    newCustomers: customers?.count ?? 0,
    grossCents,
    netCents: net,
    vatCents: vat,
    giftRequestCents: gifts?.cents ?? 0,
    days: [...days.values()].sort((a, b) => a.label.localeCompare(b.label)),
    months: [...months.values()].sort((a, b) => a.label.localeCompare(b.label)),
    services: byCents([...services.values()]),
    staff: byCents([...staff.values()]),
  };
}
