import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const bulkPricesSchema = z.object({
  salonId: z.string().min(1),
  updates: z.array(
    z.object({
      serviceId: z.string().min(1),
      priceCents: z.number().int().min(0).max(100000),
    }),
  ).min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = bulkPricesSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Preisaktualisierung ungültig.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zur Preisaktualisierung.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      for (const item of body.updates) {
        await tx`
          UPDATE salon_services
          SET price_cents = ${item.priceCents}
          WHERE salon_id = ${body.salonId} AND service_id = ${item.serviceId}
        `;
      }
    });

    return Response.json({ ok: true, updatedCount: body.updates.length });
  } catch (error) {
    return apiError(error);
  }
}
