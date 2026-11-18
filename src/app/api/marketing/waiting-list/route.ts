import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createWaitlistSchema = z.object({
  salonId: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().trim().min(1, "Kundin erforderlich.").max(120),
  serviceId: z.string().optional(),
  serviceName: z.string().trim().max(160).optional(),
  durationMinutes: z.number().int().min(0).max(480).optional(),
  staffId: z.string().optional(),
  staffName: z.string().trim().max(120).optional(),
  dateMode: z.enum(["specific_date", "weekdays"]).default("specific_date"),
  preferredDate: z.string().trim().min(1, "Bevorzugtes Datum erforderlich.").max(120),
  note: z.string().trim().max(500).optional(),
});

const createFilterGroupSchema = z.object({
  kind: z.literal("filter_group"),
  salonId: z.string().min(1),
  name: z.string().trim().min(1, "Name der Filtergruppe erforderlich.").max(120),
  criteriaLabel: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const raw = await request.json();

    if (raw && raw.kind === "filter_group") {
      const parsedFilter = createFilterGroupSchema.safeParse(raw);
      if (!parsedFilter.success) {
        throw new BookingError(422, "invalid", "Ungültige Filtergruppe.");
      }
      const fBody = parsedFilter.data;
      assertSalon(user, fBody.salonId);
      if (!canManageSalon(user, fBody.salonId)) {
        throw new BookingError(403, "forbidden", "Keine Berechtigung.");
      }
      const sql = getSql();
      const id = `mfilter_${crypto.randomUUID()}`;
      const [createdGroup] = await sql`
        INSERT INTO marketing_filter_groups (id, salon_id, name, filters_used, criteria_label)
        VALUES (${id}, ${fBody.salonId}, ${fBody.name}, 1, ${fBody.criteriaLabel || "Benutzerdefinierter Filter"})
        RETURNING id, salon_id AS "salonId", name, filters_used AS "filtersUsed", criteria_label AS "criteriaLabel"
      `;
      return Response.json({ filterGroup: createdGroup }, { status: 201 });
    }

    const parsed = createWaitlistSchema.safeParse(raw);
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Ungültiger Wartelisten-Eintrag.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für die Warteliste.");
    }

    const sql = getSql();
    const id = `wait_${crypto.randomUUID()}`;
    const [created] = await sql`
      INSERT INTO waiting_list_entries (
        id, salon_id, customer_id, customer_name, service_id, service_name,
        duration_minutes, staff_id, staff_name, date_mode, preferred_date, note, notification_sent
      ) VALUES (
        ${id},
        ${body.salonId},
        ${body.customerId || null},
        ${body.customerName},
        ${body.serviceId || null},
        ${body.serviceName || "-"},
        ${body.durationMinutes ?? 60},
        ${body.staffId || null},
        ${body.staffName || "Keine Präferenz"},
        ${body.dateMode},
        ${body.preferredDate},
        ${body.note || null},
        false
      )
      RETURNING
        id,
        salon_id AS "salonId",
        customer_id AS "customerId",
        customer_name AS "customerName",
        service_id AS "serviceId",
        service_name AS "serviceName",
        duration_minutes AS "durationMinutes",
        staff_id AS "staffId",
        staff_name AS "staffName",
        date_mode AS "dateMode",
        preferred_date AS "preferredDate",
        note,
        notification_sent AS "notificationSent"
    `;

    return Response.json({ waitingListEntry: created }, { status: 201 });
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
      throw new BookingError(422, "invalid", "Wartelisten-ID fehlt.");
    }
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung.");
    }

    const sql = getSql();
    await sql`
      DELETE FROM waiting_list_entries
      WHERE id = ${id} AND salon_id = ${salonId}
    `;

    return Response.json({ deleted: true, id });
  } catch (error) {
    return apiError(error);
  }
}
