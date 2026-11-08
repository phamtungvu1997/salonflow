import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { addDays, BookingError, zonedDateTimeToUtc } from "@/server/time";

const createEventSchema = z.object({
  salonId: z.string().min(1),
  kind: z.enum(["absence", "chore", "note"]),
  description: z.string().trim().min(1, "Beschreibung wird benötigt.").max(500),
  appliesTo: z.enum(["company", "employee", "tool"]),
  staffId: z.string().min(1).optional(),
  startDate: z.string(),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().optional(),
  repeatEnabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Eingaben unvollständig.");
    }
    const data = parsed.data;
    assertSalon(user, data.salonId);

    const allDay = data.kind === "note" ? true : Boolean(data.allDay);
    const startTime = allDay ? "08:00" : data.startTime || "09:00";
    const endDate = data.kind === "note" ? data.startDate : data.endDate || data.startDate;
    const endTime = allDay ? "20:00" : data.endTime || "10:00";

    const startAt = zonedDateTimeToUtc(data.startDate, startTime);
    let endAt = zonedDateTimeToUtc(endDate, endTime);
    if (endAt <= startAt) {
      if (allDay) {
        endAt = zonedDateTimeToUtc(addDays(data.startDate, 1), "08:00");
      } else {
        throw new BookingError(422, "invalid_range", "Endzeit muss nach der Startzeit liegen.");
      }
    }

    const sql = getSql();
    let targetStaffId: string | null = null;
    if (data.appliesTo === "employee") {
      if (!data.staffId) {
        throw new BookingError(422, "staff_required", "Bitte Mitarbeiterin auswählen.");
      }
      targetStaffId = data.staffId;
    }

    const eventId = `cevt_${crypto.randomUUID()}`;
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO calendar_events (
          id, salon_id, kind, description, applies_to, staff_id, start_at, end_at, all_day, repeat_enabled
        ) VALUES (
          ${eventId},
          ${data.salonId},
          ${data.kind},
          ${data.description},
          ${data.appliesTo},
          ${targetStaffId},
          ${startAt},
          ${endAt},
          ${allDay},
          ${Boolean(data.repeatEnabled)}
        )
      `;
      if (data.kind === "absence" && targetStaffId) {
        await tx`
          INSERT INTO absences (id, staff_id, salon_id, starts_at, ends_at, reason)
          VALUES (
            ${`abs_${crypto.randomUUID()}`},
            ${targetStaffId},
            ${data.salonId},
            ${startAt},
            ${endAt},
            ${data.description}
          )
        `;
      }
    });

    return Response.json({ eventId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
