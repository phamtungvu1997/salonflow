import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { cancelAppointment } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const bodySchema = z.object({ expectedVersion: z.number().int() });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Version fehlt.");
    const sql = getSql();
    const rows = await sql<{ salon_id: string }[]>`
      SELECT salon_id FROM appointments WHERE id = ${id}
    `;
    if (!rows[0]) throw new BookingError(404, "missing", "Termin nicht gefunden.");
    assertSalon(user, rows[0].salon_id);
    const result = await cancelAppointment(sql, user.id, {
      appointmentId: id,
      expectedVersion: parsed.data.expectedVersion,
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
