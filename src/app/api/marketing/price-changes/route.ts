import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { APP_TIME_ZONE, BookingError, minutesOfDay, zonedDateTimeToUtc } from "@/server/time";

function berlinDateStr(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

const priceChangeSchema = z.object({
  id: z.string().optional(),
  salonId: z.string().min(1),
  changeType: z.enum(["discount", "increase"]),
  percentage: z.number().int().min(1, "Prozentsatz muss zwischen 1% und 90% liegen.").max(90),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Startdatum."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Startzeit."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Enddatum."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Endzeit."),
  repeatEnabled: z.boolean().optional(),
  repeatFrequency: z.enum(["none", "daily", "weekly"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = priceChangeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Ungültige Preisänderung.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Preisänderungen.");
    }

    const startsAt = zonedDateTimeToUtc(body.startDate, body.startTime);
    const endsAt = zonedDateTimeToUtc(body.endDate, body.endTime);
    if (endsAt <= startsAt) {
      throw new BookingError(
        422,
        "invalid_range",
        "Ungültiger Zeitraum: Endzeitpunkt muss nach dem Startzeitpunkt liegen.",
      );
    }

    const sql = getSql();
    const id = `pcr_${crypto.randomUUID()}`;
    const [created] = await sql<{
      id: string;
      salon_id: string;
      change_type: "discount" | "increase";
      percentage: number;
      starts_at: Date;
      ends_at: Date;
      repeat_enabled: boolean;
      repeat_frequency: string;
    }[]>`
      INSERT INTO price_change_rules (
        id, salon_id, change_type, percentage, starts_at, ends_at, repeat_enabled, repeat_frequency
      ) VALUES (
        ${id},
        ${body.salonId},
        ${body.changeType},
        ${body.percentage},
        ${startsAt},
        ${endsAt},
        ${Boolean(body.repeatEnabled)},
        ${body.repeatFrequency ?? "weekly"}
      )
      RETURNING id, salon_id, change_type, percentage, starts_at, ends_at, repeat_enabled, repeat_frequency
    `;

    return Response.json(
      {
        priceChangeRule: {
          id: created.id,
          salonId: created.salon_id,
          changeType: created.change_type,
          percentage: created.percentage,
          startDate: berlinDateStr(created.starts_at),
          endDate: berlinDateStr(created.ends_at),
          startMinute: minutesOfDay(created.starts_at),
          endMinute: minutesOfDay(created.ends_at),
          startsAt: created.starts_at.toISOString(),
          endsAt: created.ends_at.toISOString(),
          repeatEnabled: created.repeat_enabled,
          repeatFrequency: created.repeat_frequency,
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
    const parsed = priceChangeSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error?.issues[0]?.message ?? "Ungültige Preisänderung.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Preisänderungen.");
    }

    const startsAt = zonedDateTimeToUtc(body.startDate, body.startTime);
    const endsAt = zonedDateTimeToUtc(body.endDate, body.endTime);
    if (endsAt <= startsAt) {
      throw new BookingError(
        422,
        "invalid_range",
        "Ungültiger Zeitraum: Endzeitpunkt muss nach dem Startzeitpunkt liegen.",
      );
    }

    const sql = getSql();
    const [updated] = await sql<{
      id: string;
      salon_id: string;
      change_type: "discount" | "increase";
      percentage: number;
      starts_at: Date;
      ends_at: Date;
      repeat_enabled: boolean;
      repeat_frequency: string;
    }[]>`
      UPDATE price_change_rules
      SET
        change_type = ${body.changeType},
        percentage = ${body.percentage},
        starts_at = ${startsAt},
        ends_at = ${endsAt},
        repeat_enabled = ${Boolean(body.repeatEnabled)},
        repeat_frequency = ${body.repeatFrequency ?? "weekly"}
      WHERE id = ${body.id!} AND salon_id = ${body.salonId}
      RETURNING id, salon_id, change_type, percentage, starts_at, ends_at, repeat_enabled, repeat_frequency
    `;

    if (!updated) {
      throw new BookingError(404, "not_found", "Preisänderung nicht gefunden.");
    }

    return Response.json({
      priceChangeRule: {
        id: updated.id,
        salonId: updated.salon_id,
        changeType: updated.change_type,
        percentage: updated.percentage,
        startDate: berlinDateStr(updated.starts_at),
        endDate: berlinDateStr(updated.ends_at),
        startMinute: minutesOfDay(updated.starts_at),
        endMinute: minutesOfDay(updated.ends_at),
        startsAt: updated.starts_at.toISOString(),
        endsAt: updated.ends_at.toISOString(),
        repeatEnabled: updated.repeat_enabled,
        repeatFrequency: updated.repeat_frequency,
      },
    });
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
      throw new BookingError(422, "invalid", "ID der Preisänderung fehlt.");
    }
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung zum Löschen von Preisänderungen.");
    }

    const sql = getSql();
    await sql`
      DELETE FROM price_change_rules
      WHERE id = ${id} AND salon_id = ${salonId}
    `;

    return Response.json({ deleted: true, id });
  } catch (error) {
    return apiError(error);
  }
}
