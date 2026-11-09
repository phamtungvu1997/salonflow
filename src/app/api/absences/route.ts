import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { addDays, BookingError, zonedDateTimeToUtc } from "@/server/time";

const GERMAN_NATIONAL_HOLIDAYS_2026 = [
  { id: "hol_neujahr", description: "Neujahr", date: "01-01-2026" },
  { id: "hol_karfreitag", description: "Karfreitag", date: "03-04-2026" },
  { id: "hol_ostermontag", description: "Ostermontag", date: "06-04-2026" },
  { id: "hol_tag_der_arbeit", description: "Tag der Arbeit", date: "01-05-2026" },
  { id: "hol_himmelfahrt", description: "Christi Himmelfahrt", date: "14-05-2026" },
  { id: "hol_pfingstmontag", description: "Pfingstmontag", date: "25-05-2026" },
  { id: "hol_einheit", description: "Tag der Deutschen Einheit", date: "03-10-2026" },
  { id: "hol_reformationstag", description: "Reformationstag (Hamburg)", date: "31-10-2026" },
  { id: "hol_weihnachten_1", description: "1. Weihnachtstag", date: "25-12-2026" },
  { id: "hol_weihnachten_2", description: "2. Weihnachtstag", date: "26-12-2026" },
];

const createAbsenceSchema = z.object({
  salonId: z.string().min(1),
  description: z.string().trim().min(1, "Beschreibung erforderlich.").max(300),
  appliesTo: z.enum(["company", "employee"]),
  staffId: z.string().optional(),
  startDate: z.string().min(8),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);

    const sql = getSql();
    const absences = await sql`
      SELECT
        a.id,
        a.staff_id AS "staffId",
        COALESCE(s.display_name, 'Gesamter Salon') AS "staffName",
        s.color AS "staffColor",
        a.starts_at AS "startsAt",
        a.ends_at AS "endsAt",
        a.reason AS "description"
      FROM absences a
      LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.salon_id = ${salonId}
      ORDER BY a.starts_at DESC
    `;

    return Response.json({
      nationalHolidays: GERMAN_NATIONAL_HOLIDAYS_2026,
      absences,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createAbsenceSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Abwesenheit.");
    }
    const data = parsed.data;
    assertSalon(user, data.salonId);
    if (!canManageSalon(user, data.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Verwalten von Abwesenheiten.");
    }

    const allDay = Boolean(data.allDay);
    const startTime = allDay ? "08:00" : data.startTime || "09:00";
    const endDate = data.endDate || data.startDate;
    const endTime = allDay ? "20:00" : data.endTime || "18:00";

    const startsAt = zonedDateTimeToUtc(data.startDate, startTime);
    let endsAt = zonedDateTimeToUtc(endDate, endTime);
    if (endsAt <= startsAt) {
      if (allDay) {
        endsAt = zonedDateTimeToUtc(addDays(data.startDate, 1), "08:00");
      } else {
        throw new BookingError(422, "invalid_range", "Endzeit muss nach der Startzeit liegen.");
      }
    }

    const sql = getSql();
    let targetStaffIds: string[] = [];
    if (data.appliesTo === "employee") {
      if (!data.staffId) {
        throw new BookingError(422, "staff_required", "Bitte Mitarbeiterin auswählen.");
      }
      targetStaffIds = [data.staffId];
    } else {
      const staffRows = await sql`
        SELECT s.id
        FROM staff s
        JOIN staff_salon_assignments a ON a.staff_id = s.id
        WHERE a.salon_id = ${data.salonId} AND a.active = true AND s.active = true
      `;
      targetStaffIds = staffRows.map((row) => row.id as string);
    }

    const conflicts = await sql`
      SELECT COUNT(DISTINCT a.id)::int AS "count"
      FROM appointments a
      JOIN appointment_services i ON i.appointment_id = a.id
      WHERE a.salon_id = ${data.salonId}
        AND a.status <> 'cancelled'
        AND i.staff_id = ANY(${targetStaffIds})
        AND a.start_at < ${endsAt}
        AND a.end_at > ${startsAt}
    `;
    const conflictingAppointmentsCount = Number(conflicts[0]?.count ?? 0);

    const createdIds: string[] = [];
    await sql.begin(async (tx) => {
      for (const staffId of targetStaffIds) {
        const absenceId = `abs_${crypto.randomUUID()}`;
        createdIds.push(absenceId);
        await tx`
          INSERT INTO absences (id, staff_id, salon_id, starts_at, ends_at, reason)
          VALUES (${absenceId}, ${staffId}, ${data.salonId}, ${startsAt}, ${endsAt}, ${data.description})
        `;
      }
      await tx`
        INSERT INTO calendar_events (
          id, salon_id, kind, description, applies_to, staff_id, start_at, end_at, all_day, repeat_enabled
        ) VALUES (
          ${`cevt_${crypto.randomUUID()}`},
          ${data.salonId},
          'absence',
          ${data.description},
          ${data.appliesTo},
          ${data.appliesTo === "employee" ? data.staffId ?? null : null},
          ${startsAt},
          ${endsAt},
          ${allDay},
          false
        )
      `;
    });

    return Response.json(
      {
        absenceIds: createdIds,
        conflictingAppointmentsCount,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    if (!id) {
      throw new BookingError(422, "invalid", "Abwesenheits-ID fehlt.");
    }
    assertSalon(user, salonId);

    const sql = getSql();
    const existing = await sql<{
      id: string;
      staff_id: string;
      starts_at: Date;
      ends_at: Date;
      reason: string | null;
    }[]>`
      SELECT id, staff_id, starts_at, ends_at, reason
      FROM absences
      WHERE id = ${id} AND salon_id = ${salonId}
    `;

    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM absences
        WHERE id = ${id} AND salon_id = ${salonId}
      `;
      if (existing[0]) {
        await tx`
          DELETE FROM calendar_events
          WHERE salon_id = ${salonId}
            AND kind = 'absence'
            AND description = ${existing[0].reason ?? ""}
            AND start_at = ${existing[0].starts_at}
            AND end_at = ${existing[0].ends_at}
        `.catch(() => {});
      }
    });

    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
