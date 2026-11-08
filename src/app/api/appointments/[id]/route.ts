import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { rescheduleAppointment } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const bodySchema = z.object({
  expectedVersion: z.number().int(),
  date: z.string(),
  start: z.string(),
  notes: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Änderungsdaten unvollständig.");
    const sql = getSql();
    const rows = await sql<{ salon_id: string }[]>`
      SELECT salon_id FROM appointments WHERE id = ${id}
    `;
    if (!rows[0]) throw new BookingError(404, "missing", "Termin nicht gefunden.");
    assertSalon(user, rows[0].salon_id);
    const result = await rescheduleAppointment(sql, user.id, {
      appointmentId: id,
      expectedVersion: parsed.data.expectedVersion,
      date: parsed.data.date,
      start: parsed.data.start,
    });
    if (parsed.data.notes !== undefined) {
      await sql`
        UPDATE appointments SET notes = ${parsed.data.notes || null} WHERE id = ${id}
      `;
    }
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
