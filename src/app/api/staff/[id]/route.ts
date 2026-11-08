import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const updateStaffSchema = z.object({
  salonId: z.string().min(1),
  displayName: z.string().trim().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(64).optional(),
  gender: z.enum(["female", "male", "unknown"]).optional(),
  bookableOnline: z.boolean().optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = updateStaffSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Mitarbeiterdaten.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Bearbeiten von Mitarbeitern.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      const assigned = await tx`
        SELECT 1 FROM staff_salon_assignments
        WHERE staff_id = ${id} AND salon_id = ${body.salonId}
      `;
      if (assigned.length === 0) {
        throw new BookingError(404, "missing", "Mitarbeiter nicht in diesem Salon gefunden.");
      }

      await tx`
        UPDATE staff
        SET
          display_name = COALESCE(${body.displayName ?? null}, display_name),
          color = COALESCE(${body.color ?? null}, color),
          email = CASE WHEN ${body.email !== undefined} THEN ${body.email || null} ELSE email END,
          phone = CASE WHEN ${body.phone !== undefined} THEN ${body.phone || null} ELSE phone END,
          gender = COALESCE(${body.gender ?? null}, gender),
          bookable_online = COALESCE(${body.bookableOnline ?? null}, bookable_online),
          active = COALESCE(${body.active ?? null}, active)
        WHERE id = ${id}
      `;

      if (body.active !== undefined) {
        await tx`
          UPDATE staff_salon_assignments
          SET active = ${body.active}
          WHERE staff_id = ${id} AND salon_id = ${body.salonId}
        `;
      }

      if (body.serviceIds !== undefined) {
        await tx`
          DELETE FROM staff_services
          WHERE staff_id = ${id}
            AND service_id IN (
              SELECT service_id FROM salon_services WHERE salon_id = ${body.salonId}
            )
        `;
        for (const serviceId of body.serviceIds) {
          await tx`
            INSERT INTO staff_services (staff_id, service_id)
            VALUES (${id}, ${serviceId})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    });

    return Response.json({ ok: true, staffId: id });
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
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Deaktivieren von Mitarbeitern.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      await tx`
        UPDATE staff_salon_assignments
        SET active = false
        WHERE staff_id = ${id} AND salon_id = ${salonId}
      `;
    });

    return Response.json({ deleted: true, staffId: id });
  } catch (error) {
    return apiError(error);
  }
}
