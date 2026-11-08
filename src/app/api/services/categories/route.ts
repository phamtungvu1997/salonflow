import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createCategorySchema = z.object({
  salonId: z.string().min(1),
  name: z.string().trim().min(1, "Kategoriename erforderlich.").max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateCategorySchema = z.object({
  salonId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createCategorySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Kategorie.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Anlegen von Kategorien.");
    }

    const sql = getSql();
    const categoryId = `cat_${crypto.randomUUID()}`;
    const color = body.color ?? "#f9a8d4";

    const [maxRow] = await sql`
      SELECT COALESCE(MAX(sort_order), 0)::int AS "maxOrder"
      FROM service_categories
      WHERE salon_id = ${body.salonId}
    `;
    const sortOrder = Number(maxRow?.maxOrder ?? 0) + 1;

    await sql`
      INSERT INTO service_categories (id, name, color, salon_id, sort_order)
      VALUES (${categoryId}, ${body.name}, ${color}, ${body.salonId}, ${sortOrder})
    `;

    return Response.json(
      {
        category: {
          id: categoryId,
          name: body.name,
          color,
          sortOrder,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const parsed = updateCategorySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Kategorie.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Bearbeiten von Kategorien.");
    }

    const sql = getSql();
    await sql`
      UPDATE service_categories
      SET
        name = COALESCE(${body.name ?? null}, name),
        color = COALESCE(${body.color ?? null}, color)
      WHERE id = ${body.categoryId} AND (salon_id = ${body.salonId} OR salon_id IS NULL)
    `;

    return Response.json({ ok: true, categoryId: body.categoryId });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId");
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    if (!categoryId) {
      throw new BookingError(422, "invalid", "Kategorie-ID fehlt.");
    }
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Löschen von Kategorien.");
    }

    const sql = getSql();
    await sql.begin(async (tx) => {
      await tx`
        UPDATE services SET category_id = NULL WHERE category_id = ${categoryId}
      `;
      await tx`
        DELETE FROM service_categories
        WHERE id = ${categoryId} AND (salon_id = ${salonId} OR salon_id IS NULL)
      `;
    });

    return Response.json({ deleted: true, categoryId });
  } catch (error) {
    return apiError(error);
  }
}
