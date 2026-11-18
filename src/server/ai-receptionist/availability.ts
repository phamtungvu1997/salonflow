import { dayBounds } from "@/server/booking";
import type { Db } from "@/server/db";
import {
  APP_TIME_ZONE,
  BookingError,
  isoWeekday,
  zonedDateTimeToUtc,
} from "@/server/time";

import type { AvailableSlotOption, CatalogService, CatalogStaff } from "./types";

function formatMinutesLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function berlinTodayStr(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function loadSalonCatalog(
  sql: Db,
  salonId: string,
): Promise<{ services: CatalogService[]; staff: CatalogStaff[] }> {
  const staffRows = await sql<{
    id: string;
    display_name: string;
    color: string;
  }[]>`
    SELECT s.id, s.display_name, COALESCE(s.color, '#94a3b8') AS color
    FROM staff s
    JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${salonId} AND a.active
    WHERE s.active
    ORDER BY s.display_name
  `;

  const serviceRows = await sql<{
    id: string;
    name: string;
    category_id: string | null;
    category_name: string | null;
    duration_minutes: number;
    price_cents: number;
  }[]>`
    SELECT
      sv.id,
      sv.name,
      sv.category_id,
      sc.name AS category_name,
      ss.duration_minutes,
      ss.price_cents
    FROM services sv
    JOIN salon_services ss ON ss.service_id = sv.id AND ss.salon_id = ${salonId} AND ss.active
    LEFT JOIN service_categories sc ON sc.id = sv.category_id
    WHERE sv.active
    ORDER BY COALESCE(sc.sort_order, 999), sv.name
  `;

  const eligibility = await sql<{ staff_id: string; service_id: string }[]>`
    SELECT el.staff_id, el.service_id
    FROM staff_services el
    JOIN staff_salon_assignments a
      ON a.staff_id = el.staff_id AND a.salon_id = ${salonId} AND a.active
  `;

  const byService = new Map<string, string[]>();
  for (const row of eligibility) {
    const list = byService.get(row.service_id) ?? [];
    list.push(row.staff_id);
    byService.set(row.service_id, list);
  }

  const staffIds = new Set(staffRows.map((s) => s.id));
  return {
    staff: staffRows.map((s) => ({
      id: s.id,
      displayName: s.display_name,
      color: s.color,
    })),
    services: serviceRows.map((sv) => ({
      id: sv.id,
      name: sv.name,
      categoryId: sv.category_id,
      categoryName: sv.category_name ?? "Leistungen",
      durationMinutes: sv.duration_minutes,
      priceCents: sv.price_cents,
      eligibleStaffIds: (byService.get(sv.id) ?? []).filter((id) => staffIds.has(id)),
    })),
  };
}

export async function queryInternalAvailability(
  sql: Db,
  input: {
    salonId: string;
    serviceId: string;
    date: string;
    staffId?: string | null;
    intervalMinutes?: number;
    minNoticeMinutes?: number;
    now?: Date;
  },
): Promise<{
  date: string;
  durationMinutes: number;
  slots: AvailableSlotOption[];
  service: CatalogService;
  staff: CatalogStaff[];
}> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new BookingError(422, "invalid_date", "Ungültiges Datum.");
  }

  const { services, staff } = await loadSalonCatalog(sql, input.salonId);
  const service = services.find((sv) => sv.id === input.serviceId);
  if (!service) {
    throw new BookingError(422, "service_not_found", "Leistung nicht gefunden.");
  }

  let candidateStaff = staff.filter((st) => service.eligibleStaffIds.includes(st.id));
  if (input.staffId && input.staffId !== "any") {
    const chosen = candidateStaff.find((st) => st.id === input.staffId);
    if (!chosen) {
      throw new BookingError(
        422,
        "staff_not_allowed",
        "Diese Mitarbeiterin ist für die gewählte Leistung nicht verfügbar.",
      );
    }
    candidateStaff = [chosen];
  }

  const now = input.now ?? new Date();
  const todayStr = berlinTodayStr(now);
  if (input.date < todayStr) {
    return {
      date: input.date,
      durationMinutes: service.durationMinutes,
      slots: [],
      service,
      staff: candidateStaff,
    };
  }

  const candidateIds = candidateStaff.map((s) => s.id);
  if (candidateIds.length === 0) {
    return {
      date: input.date,
      durationMinutes: service.durationMinutes,
      slots: [],
      service,
      staff: candidateStaff,
    };
  }

  const weekday = isoWeekday(zonedDateTimeToUtc(input.date, "12:00"));
  const bounds = dayBounds(input.date);

  const shifts = await sql<{
    staff_id: string;
    start_minute: number;
    end_minute: number;
  }[]>`
    SELECT staff_id, start_minute, end_minute
    FROM weekly_shifts
    WHERE salon_id = ${input.salonId}
      AND iso_weekday = ${weekday}
      AND staff_id = ANY(${candidateIds})
  `;

  const allocations = await sql<{
    staff_id: string;
    start_at: Date;
    end_at: Date;
  }[]>`
    SELECT r.staff_id, ra.start_at, ra.end_at
    FROM resource_allocations ra
    JOIN resources r ON r.id = ra.resource_id
    WHERE ra.active = true
      AND r.staff_id = ANY(${candidateIds})
      AND ra.start_at < ${bounds.end}
      AND ra.end_at > ${bounds.start}
  `;

  const absences = await sql<{
    staff_id: string;
    starts_at: Date;
    ends_at: Date;
  }[]>`
    SELECT staff_id, starts_at, ends_at
    FROM absences
    WHERE staff_id = ANY(${candidateIds})
      AND starts_at < ${bounds.end}
      AND ends_at > ${bounds.start}
  `;

  const step = Math.max(15, Math.min(120, input.intervalMinutes ?? 15));
  const duration = service.durationMinutes;
  const minNotice = input.minNoticeMinutes ?? 0;
  const minStartInstantMs = now.getTime() + minNotice * 60_000;

  const slots: AvailableSlotOption[] = [];
  for (let startMin = 8 * 60; startMin + duration <= 20 * 60; startMin += step) {
    const endMin = startMin + duration;
    const startLabel = formatMinutesLabel(startMin);
    const endLabel = formatMinutesLabel(endMin);

    let slotStartUtc: Date;
    let slotEndUtc: Date;
    try {
      slotStartUtc = zonedDateTimeToUtc(input.date, startLabel);
      slotEndUtc = zonedDateTimeToUtc(input.date, endLabel);
    } catch {
      continue;
    }

    if (slotStartUtc.getTime() < minStartInstantMs) continue;

    const freeStaffIds: string[] = [];
    for (const member of candidateStaff) {
      const memberShifts = shifts.filter((sh) => sh.staff_id === member.id);
      const insideShift = memberShifts.some(
        (sh) => startMin >= sh.start_minute && endMin <= sh.end_minute,
      );
      if (!insideShift) continue;

      const hasAbsence = absences.some(
        (ab) =>
          ab.staff_id === member.id &&
          ab.starts_at < slotEndUtc &&
          ab.ends_at > slotStartUtc,
      );
      if (hasAbsence) continue;

      const hasAlloc = allocations.some(
        (al) =>
          al.staff_id === member.id &&
          al.start_at < slotEndUtc &&
          al.end_at > slotStartUtc,
      );
      if (hasAlloc) continue;

      freeStaffIds.push(member.id);
    }

    if (freeStaffIds.length > 0) {
      slots.push({
        start: startLabel,
        end: endLabel,
        startMinute: startMin,
        endMinute: endMin,
        availableStaffIds: freeStaffIds,
      });
    }
  }

  return {
    date: input.date,
    durationMinutes: duration,
    slots,
    service,
    staff: candidateStaff,
  };
}
