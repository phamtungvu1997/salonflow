import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const updateServiceSchema = z.object({
  salonId: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  categoryId: z.string().min(1).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  priceCents: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
  staffIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = updateServiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Leistungsdaten.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Bearbeiten von Leistungen.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      if (body.name !== undefined || body.categoryId !== undefined) {
        await tx`
          UPDATE services
          SET
            name = COALESCE(${body.name ?? null}, name),
            category_id = CASE WHEN ${body.categoryId !== undefined} THEN ${body.categoryId ?? null} ELSE category_id END
          WHERE id = ${id}
        `;
      }

      await tx`
        UPDATE salon_services
        SET
          duration_minutes = COALESCE(${body.durationMinutes ?? null}, duration_minutes),
          price_cents = COALESCE(${body.priceCents ?? null}, price_cents),
          active = COALESCE(${body.active ?? null}, active)
        WHERE salon_id = ${body.salonId} AND service_id = ${id}
      `;

      if (body.staffIds !== undefined) {
        await tx`
          DELETE FROM staff_services
          WHERE service_id = ${id}
            AND staff_id IN (
              SELECT staff_id FROM staff_salon_assignments WHERE salon_id = ${body.salonId}
            )
        `;
        for (const staffId of body.staffIds) {
          await tx`
            INSERT INTO staff_services (staff_id, service_id)
            VALUES (${staffId}, ${id})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    });

    return Response.json({ ok: true, serviceId: id });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Deaktivieren von Leistungen.");
    }

    const sql = getSql();
    await sql`
      UPDATE salon_services
      SET active = false
      WHERE salon_id = ${salonId} AND service_id = ${id}
    `;

    return Response.json({ deleted: true, serviceId: id });
  } catch (error) {
    return apiError(error);
  }
}
