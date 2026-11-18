import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { listSalonHolidays, syncHolidayAbsences } from "@/server/holidays";
import { apiError } from "@/server/http";
import { recordOutbox } from "@/server/outbox";
import { BookingError } from "@/server/time";

const writeSchema = z.object({
  salonId: z.string().min(1),
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  enabled: z.boolean().optional(),
});

async function assertManager(salonId: string) {
  const user = await requireUser();
  assertSalon(user, salonId);
  if (!canManageSalon(user, salonId)) {
    throw new BookingError(403, "forbidden", "Keine Berechtigung zum Ändern der Feiertage.");
  }
  return user;
}

export async function POST(request: Request) {
  try {
    const parsed = writeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Name und Datum sind erforderlich.");
    }
    await assertManager(parsed.data.salonId);
    const sql = getSql();
    const id = `hol_${crypto.randomUUID()}`;
    try {
      await sql`
        INSERT INTO salon_holidays (id, salon_id, name, holiday_date, enabled)
        VALUES (
          ${id},
          ${parsed.data.salonId},
          ${parsed.data.name},
          ${parsed.data.date},
          ${parsed.data.enabled ?? true}
        )
      `;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new BookingError(409, "duplicate", "Dieser Feiertag ist für das Datum schon eingetragen.");
      }
      throw error;
    }
    await syncHolidayAbsences(sql, parsed.data.salonId, id);
    return Response.json({ holiday: { id, ...parsed.data, enabled: parsed.data.enabled ?? true } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = writeSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Feiertag konnte nicht gespeichert werden.");
    }
    await assertManager(parsed.data.salonId);
    const sql = getSql();
    const updated = await sql<{ id: string }[]>`
      UPDATE salon_holidays
      SET name = ${parsed.data.name},
          holiday_date = ${parsed.data.date},
          enabled = ${parsed.data.enabled ?? true}
      WHERE id = ${parsed.data.id} AND salon_id = ${parsed.data.salonId}
      RETURNING id
    `;
    if (!updated[0]) {
      throw new BookingError(404, "not_found", "Feiertag nicht gefunden.");
    }
    await syncHolidayAbsences(sql, parsed.data.salonId, parsed.data.id);
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
    if (!salonId || !id) {
      throw new BookingError(422, "invalid", "Feiertag fehlt.");
    }
    await assertManager(salonId);
    const sql = getSql();
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM absences WHERE holiday_id = ${id} AND salon_id = ${salonId}
    `;
    await sql.begin(async (tx) => {
      for (const row of existing) {
        await tx`DELETE FROM absences WHERE id = ${row.id}`;
        await recordOutbox(tx, salonId, row.id, "absence.deleted");
      }
      await tx`DELETE FROM salon_holidays WHERE id = ${id} AND salon_id = ${salonId}`;
    });
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    return Response.json({ nationalHolidays: await listSalonHolidays(getSql(), salonId) });
  } catch (error) {
    return apiError(error);
  }
}
