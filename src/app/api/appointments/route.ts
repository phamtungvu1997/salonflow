import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { createAppointment } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  staffId: z.string().min(1),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string(),
  start: z.string(),
  idempotencyKey: z.string().min(8).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Buchungsdaten unvollständig.");
    assertSalon(user, parsed.data.salonId);
    const result = await createAppointment(getSql(), user.id, parsed.data);
    return Response.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
