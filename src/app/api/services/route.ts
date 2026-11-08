import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(5).max(480),
  priceCents: z.number().int().min(0).max(100000),
  staffIds: z.array(z.string()).min(1),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId");
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);
    const sql = getSql();
    const services = await sql<{
      id: string;
      name: string;
      duration_minutes: number;
      price_cents: number;
    }[]>`
      SELECT s.id, s.name, ss.duration_minutes, ss.price_cents
      FROM services s
      JOIN salon_services ss ON ss.service_id = s.id AND ss.salon_id = ${salonId} AND ss.active
      WHERE s.active
      ORDER BY s.name
    `;
    const eligibility = await sql<{ service_id: string; staff_id: string }[]>`
      SELECT el.service_id, el.staff_id
      FROM staff_services el
      JOIN salon_services ss ON ss.service_id = el.service_id AND ss.salon_id = ${salonId}
    `;
    return Response.json({
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        durationMinutes: service.duration_minutes,
        priceCents: service.price_cents,
        staffIds: eligibility
          .filter((row) => row.service_id === service.id)
          .map((row) => row.staff_id),
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
    if (!parsed.success) throw new BookingError(422, "invalid", "Leistungsdaten unvollständig.");
    assertSalon(user, parsed.data.salonId);
    const sql = getSql();
    const serviceId = `svc_${crypto.randomUUID()}`;
    await sql.begin(async (tx) => {
      await tx`INSERT INTO services (id, name) VALUES (${serviceId}, ${parsed.data.name})`;
      await tx`
        INSERT INTO salon_services (salon_id, service_id, duration_minutes, price_cents)
        VALUES (${parsed.data.salonId}, ${serviceId}, ${parsed.data.durationMinutes}, ${parsed.data.priceCents})
      `;
      for (const staffId of parsed.data.staffIds) {
        const assigned = await tx`
          SELECT 1 FROM staff_salon_assignments
          WHERE staff_id = ${staffId} AND salon_id = ${parsed.data.salonId} AND active
        `;
        if (assigned.length === 0) {
          throw new BookingError(422, "staff_salon", "Mitarbeiter gehört nicht zum Salon.");
        }
        await tx`
          INSERT INTO staff_services (staff_id, service_id) VALUES (${staffId}, ${serviceId})
        `;
      }
    });
    return Response.json({ serviceId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
