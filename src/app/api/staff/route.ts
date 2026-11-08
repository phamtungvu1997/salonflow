import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  salonId: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId");
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);
    const sql = getSql();
    const staff = await sql<{
      id: string;
      display_name: string;
      color: string | null;
    }[]>`
      SELECT s.id, s.display_name, s.color
      FROM staff s
      JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${salonId} AND a.active
      WHERE s.active
      ORDER BY s.display_name
    `;
    const shifts = await sql<{
      staff_id: string;
      iso_weekday: number;
      start_minute: number;
      end_minute: number;
    }[]>`
      SELECT staff_id, iso_weekday, start_minute, end_minute
      FROM weekly_shifts WHERE salon_id = ${salonId}
    `;
    return Response.json({
      staff: staff.map((member) => ({
        id: member.id,
        displayName: member.display_name,
        color: member.color ?? "#8fb4a8",
        shifts: shifts
          .filter((shift) => shift.staff_id === member.id)
          .map((shift) => ({
            isoWeekday: shift.iso_weekday,
            startMinute: shift.start_minute,
            endMinute: shift.end_minute,
          })),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Name und Salon sind erforderlich.");
    assertSalon(user, parsed.data.salonId);
    const sql = getSql();
    const staffId = `staff_${crypto.randomUUID()}`;
    const color = parsed.data.color ?? "#8fb4a8";
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO staff (id, display_name, color) VALUES (${staffId}, ${parsed.data.displayName}, ${color})
      `;
      await tx`
        INSERT INTO staff_salon_assignments (id, staff_id, salon_id)
        VALUES (${`asg_${crypto.randomUUID()}`}, ${staffId}, ${parsed.data.salonId})
      `;
      await tx`
        INSERT INTO resources (id, resource_type, staff_id)
        VALUES (${`res_${staffId}`}, 'staff', ${staffId})
      `;
    });
    return Response.json({ staffId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
