import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  salonId: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(64).optional(),
  gender: z.enum(["female", "male", "unknown"]).optional(),
  bookableOnline: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId");
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);
    const sql = getSql();
    const staff = await sql<{
      id: string;
      display_name: string;
      color: string | null;
      email: string | null;
      phone: string | null;
      gender: string;
      bookable_online: boolean;
      sort_order: number;
      active: boolean;
    }[]>`
      SELECT
        s.id,
        s.display_name,
        s.color,
        s.email,
        s.phone,
        s.gender,
        s.bookable_online,
        s.sort_order,
        (s.active AND a.active) AS active
      FROM staff s
      JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${salonId}
      WHERE s.display_name !~ '^Test '
        AND (${includeInactive} OR (s.active AND a.active))
      ORDER BY s.sort_order ASC, s.display_name ASC
    `;
    const shifts = await sql<{
      staff_id: string;
      iso_weekday: number;
      start_minute: number;
      end_minute: number;
    }[]>`
      SELECT staff_id, iso_weekday, start_minute, end_minute
      FROM weekly_shifts WHERE salon_id = ${salonId}
      ORDER BY iso_weekday ASC
    `;
    const assignedServices = await sql<{
      staff_id: string;
      service_id: string;
    }[]>`
      SELECT el.staff_id, el.service_id
      FROM staff_services el
      JOIN salon_services ss ON ss.service_id = el.service_id AND ss.salon_id = ${salonId} AND ss.active
      JOIN services sv ON sv.id = el.service_id AND sv.active
    `;
    return Response.json({
      staff: staff.map((member) => {
        const memberServices = assignedServices
          .filter((row) => row.staff_id === member.id)
          .map((row) => row.service_id);
        return {
          id: member.id,
          displayName: member.display_name,
          color: member.color ?? "#8fb4a8",
          email: member.email ?? "",
          phone: member.phone ?? "",
          gender: member.gender ?? "unknown",
          bookableOnline: member.bookable_online ?? true,
          sortOrder: member.sort_order ?? 0,
          active: member.active,
          serviceIds: memberServices,
          serviceCount: memberServices.length,
          shifts: shifts
            .filter((shift) => shift.staff_id === member.id)
            .map((shift) => ({
              isoWeekday: shift.iso_weekday,
              startMinute: shift.start_minute,
              endMinute: shift.end_minute,
            })),
        };
      }),
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
    const email = parsed.data.email || null;
    const phone = parsed.data.phone || null;
    const gender = parsed.data.gender ?? "unknown";
    const bookableOnline = parsed.data.bookableOnline ?? true;

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO staff (id, display_name, color, email, phone, gender, bookable_online)
        VALUES (${staffId}, ${parsed.data.displayName}, ${color}, ${email}, ${phone}, ${gender}, ${bookableOnline})
      `;
      await tx`
        INSERT INTO staff_salon_assignments (id, staff_id, salon_id)
        VALUES (${`asg_${crypto.randomUUID()}`}, ${staffId}, ${parsed.data.salonId})
      `;
      await tx`
        INSERT INTO resources (id, resource_type, staff_id)
        VALUES (${`res_${staffId}`}, 'staff', ${staffId})
      `;
      if (parsed.data.serviceIds && parsed.data.serviceIds.length > 0) {
        for (const serviceId of parsed.data.serviceIds) {
          await tx`
            INSERT INTO staff_services (staff_id, service_id)
            VALUES (${staffId}, ${serviceId})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    });
    return Response.json({ staffId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
