import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const facilityTypes = ["room", "place", "equipment"] as const;

const writeSchema = z.object({
  salonId: z.string().min(1),
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(80),
  resourceType: z.enum(facilityTypes),
  active: z.boolean().optional(),
});

async function ensureResourceNameColumn() {
  const sql = getSql();
  await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS name text`;
}

async function assertManager(salonId: string) {
  const user = await requireUser();
  assertSalon(user, salonId);
  if (!canManageSalon(user, salonId)) {
    throw new BookingError(403, "forbidden", "Keine Berechtigung zum Ändern der Ressourcen.");
  }
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    await ensureResourceNameColumn();
    const sql = getSql();
    const resources = await sql`
      SELECT
        r.id,
        r.name,
        r.resource_type AS "resourceType",
        r.active,
        (
          SELECT count(*)::int
          FROM resource_allocations ra
          WHERE ra.resource_id = r.id AND ra.active AND ra.end_at > now()
        ) AS "upcomingBookings"
      FROM resources r
      WHERE r.salon_id = ${salonId}
        AND r.staff_id IS NULL
        AND r.resource_type IN ('room', 'place', 'equipment')
      ORDER BY r.active DESC, r.resource_type ASC, r.name ASC
    `;
    return Response.json({ resources });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = writeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Name und Typ sind erforderlich.");
    }
    await assertManager(parsed.data.salonId);
    await ensureResourceNameColumn();
    const sql = getSql();
    const duplicate = await sql<{ id: string }[]>`
      SELECT id FROM resources
      WHERE salon_id = ${parsed.data.salonId}
        AND resource_type = ${parsed.data.resourceType}
        AND lower(name) = lower(${parsed.data.name})
        AND active = true
      LIMIT 1
    `;
    if (duplicate[0]) {
      throw new BookingError(409, "duplicate", "Diese Ressource gibt es in diesem Salon schon.");
    }
    const id = `res_${crypto.randomUUID()}`;
    await sql`
      INSERT INTO resources (id, resource_type, salon_id, name, active)
      VALUES (
        ${id},
        ${parsed.data.resourceType},
        ${parsed.data.salonId},
        ${parsed.data.name},
        true
      )
    `;
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = writeSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Ressource konnte nicht gespeichert werden.");
    }
    await assertManager(parsed.data.salonId);
    await ensureResourceNameColumn();
    const sql = getSql();
    const updated = await sql<{ id: string }[]>`
      UPDATE resources
      SET name = ${parsed.data.name},
          resource_type = ${parsed.data.resourceType},
          active = ${parsed.data.active ?? true}
      WHERE id = ${parsed.data.id}
        AND salon_id = ${parsed.data.salonId}
        AND staff_id IS NULL
        AND resource_type IN ('room', 'place', 'equipment')
      RETURNING id
    `;
    if (!updated[0]) {
      throw new BookingError(404, "not_found", "Ressource nicht gefunden.");
    }
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? "";
    const id = url.searchParams.get("id") ?? "";
    if (!salonId || !id) throw new BookingError(422, "invalid", "Ressource fehlt.");
    await assertManager(salonId);
    const sql = getSql();
    const upcoming = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM resource_allocations
      WHERE resource_id = ${id} AND active AND end_at > now()
    `;
    if ((upcoming[0]?.count ?? 0) > 0) {
      throw new BookingError(
        409,
        "in_use",
        "Diese Ressource hat noch kommende Termine. Verschieben Sie die Termine, bevor Sie sie löschen.",
      );
    }
    const updated = await sql<{ id: string }[]>`
      UPDATE resources
      SET active = false
      WHERE id = ${id}
        AND salon_id = ${salonId}
        AND staff_id IS NULL
      RETURNING id
    `;
    if (!updated[0]) throw new BookingError(404, "not_found", "Ressource nicht gefunden.");
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
