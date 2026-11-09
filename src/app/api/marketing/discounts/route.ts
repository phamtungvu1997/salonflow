import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createDiscountSchema = z.object({
  salonId: z.string().min(1),
  code: z
    .string()
    .trim()
    .min(2, "Rabattcode muss mindestens 2 Zeichen lang sein.")
    .max(40)
    .transform((v) => v.toUpperCase()),
  discountType: z.enum(["special_events", "holidays", "new_customers", "other"]).default("holidays"),
  percentage: z.number().int().min(1).max(90),
  validFrom: z.string().optional(),
  expirationMode: z.enum(["never", "1_month", "3_months", "date"]).default("never"),
  oneTimePerCustomer: z.boolean().optional(),
  limitTotalUses: z.boolean().optional(),
  specificServicesOnly: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

const patchDiscountSchema = z.object({
  salonId: z.string().min(1),
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  discountType: z.enum(["special_events", "holidays", "new_customers", "other"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createDiscountSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Ungültiger Rabattcode.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Anlegen von Rabattcodes.");
    }

    const sql = getSql();
    const id = `dcode_${crypto.randomUUID()}`;
    const validFrom = body.validFrom || "2026-11-09";

    const [created] = await sql`
      INSERT INTO discount_codes (
        id, salon_id, code, discount_type, percentage, valid_from, expiration_mode,
        one_time_per_customer, limit_total_uses, specific_services_only, used_count, enabled
      ) VALUES (
        ${id},
        ${body.salonId},
        ${body.code},
        ${body.discountType},
        ${body.percentage},
        ${validFrom},
        ${body.expirationMode},
        ${Boolean(body.oneTimePerCustomer)},
        ${Boolean(body.limitTotalUses)},
        ${Boolean(body.specificServicesOnly)},
        0,
        ${body.enabled ?? true}
      )
      ON CONFLICT (salon_id, code) DO UPDATE SET
        discount_type = EXCLUDED.discount_type,
        percentage = EXCLUDED.percentage,
        enabled = EXCLUDED.enabled
      RETURNING
        id,
        salon_id AS "salonId",
        code,
        discount_type AS "discountType",
        percentage,
        valid_from::text AS "validFrom",
        expiration_mode AS "expirationMode",
        one_time_per_customer AS "oneTimePerCustomer",
        limit_total_uses AS "limitTotalUses",
        specific_services_only AS "specificServicesOnly",
        used_count AS "usedCount",
        enabled
    `;

    return Response.json({ discountCode: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const parsed = patchDiscountSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Ungültige Änderung am Rabattcode.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Bearbeiten von Rabattcodes.");
    }

    const sql = getSql();
    const [updated] = await sql`
      UPDATE discount_codes
      SET
        enabled = COALESCE(${body.enabled ?? null}, enabled),
        discount_type = COALESCE(${body.discountType ?? null}, discount_type)
      WHERE id = ${body.id} AND salon_id = ${body.salonId}
      RETURNING
        id,
        code,
        discount_type AS "discountType",
        percentage,
        used_count AS "usedCount",
        enabled
    `;

    return Response.json({ discountCode: updated });
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
      throw new BookingError(422, "invalid", "Rabattcode-ID fehlt.");
    }
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Löschen von Rabattcodes.");
    }

    const sql = getSql();
    await sql`
      DELETE FROM discount_codes
      WHERE id = ${id} AND salon_id = ${salonId}
    `;

    return Response.json({ deleted: true, id });
  } catch (error) {
    return apiError(error);
  }
}
