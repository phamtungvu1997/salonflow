import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { isoWeekday, minutesOfDay, parseMinutes, BookingError } from "@/server/time";

const bodySchema = z.object({
  salonId: z.string().min(1),
  shifts: z.array(
    z.object({
      isoWeekday: z.number().int().min(1).max(7),
      start: z.string(),
      end: z.string(),
    }),
  ),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Schichtplan ungültig.");
    assertSalon(user, parsed.data.salonId);
    const sql = getSql();
    const normalized = parsed.data.shifts.map((shift) => ({
      isoWeekday: shift.isoWeekday,
      startMinute: parseMinutes(shift.start),
      endMinute: parseMinutes(shift.end),
    }));
    if (normalized.some((shift) => shift.endMinute <= shift.startMinute)) {
      throw new BookingError(422, "invalid", "Schichtende muss nach dem Beginn liegen.");
    }
    await sql.begin(async (tx) => {
      const assigned = await tx`
        SELECT 1 FROM staff_salon_assignments
        WHERE staff_id = ${id} AND salon_id = ${parsed.data.salonId} AND active
      `;
      if (assigned.length === 0) {
        throw new BookingError(404, "missing", "Mitarbeiter nicht in diesem Salon.");
      }
      await tx`
        DELETE FROM weekly_shifts WHERE staff_id = ${id} AND salon_id = ${parsed.data.salonId}
      `;
      for (const shift of normalized) {
        await tx`
          INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
          VALUES (
            ${`shift_${crypto.randomUUID()}`}, ${id}, ${parsed.data.salonId},
            ${shift.isoWeekday}, ${shift.startMinute}, ${shift.endMinute}
          )
        `;
      }
    });
    const upcoming = await sql<{ id: string; start_at: Date; end_at: Date }[]>`
      SELECT a.id, a.start_at, a.end_at
      FROM appointments a
      JOIN appointment_services i ON i.appointment_id = a.id AND i.staff_id = ${id}
      WHERE a.salon_id = ${parsed.data.salonId}
        AND a.status NOT IN ('cancelled')
        AND a.start_at > now()
    `;
    const conflicts = upcoming.filter((appointment) => {
      const weekday = isoWeekday(appointment.start_at);
      const start = minutesOfDay(appointment.start_at);
      const end = minutesOfDay(appointment.end_at);
      return !normalized.some(
        (shift) =>
          shift.isoWeekday === weekday &&
          start >= shift.startMinute &&
          end <= shift.endMinute,
      );
    });
    return Response.json({
      ok: true,
      conflicts: conflicts.map((appointment) => appointment.id),
    });
  } catch (error) {
    return apiError(error);
  }
}
