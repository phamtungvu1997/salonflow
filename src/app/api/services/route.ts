import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(5).max(480),
  priceCents: z.number().int().min(0).max(100000),
  staffIds: z.array(z.string()).min(1),
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

    const categories = await sql<{
      id: string;
      name: string;
      color: string | null;
      sort_order: number;
    }[]>`
      SELECT id, name, color, sort_order
      FROM service_categories
      WHERE salon_id = ${salonId} OR salon_id IS NULL
      ORDER BY sort_order ASC, name ASC
    `;

    const services = await sql<{
      id: string;
      name: string;
      category_id: string | null;
      category_name: string | null;
      category_color: string | null;
      duration_minutes: number;
      price_cents: number;
      active: boolean;
    }[]>`
      SELECT
        s.id,
        s.name,
        s.category_id,
        c.name AS category_name,
        c.color AS category_color,
        ss.duration_minutes,
        ss.price_cents,
        (s.active AND ss.active) AS active
      FROM services s
      JOIN salon_services ss ON ss.service_id = s.id AND ss.salon_id = ${salonId}
      LEFT JOIN service_categories c ON c.id = s.category_id
      WHERE s.name <> 'Maniküre Test'
        AND (${includeInactive} = true OR (s.active AND ss.active))
      ORDER BY COALESCE(c.sort_order, 999) ASC, (s.active AND ss.active) DESC, s.name ASC
    `;
    const eligibility = await sql<{ service_id: string; staff_id: string }[]>`
      SELECT el.service_id, el.staff_id
      FROM staff_services el
      JOIN salon_services ss ON ss.service_id = el.service_id AND ss.salon_id = ${salonId}
    `;
    return Response.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color ?? "#f9a8d4",
        sortOrder: cat.sort_order ?? 0,
      })),
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        categoryId: service.category_id ?? (categories[0]?.id ?? null),
        categoryName: service.category_name ?? (categories[0]?.name ?? "Allgemein"),
        categoryColor: service.category_color ?? (categories[0]?.color ?? "#f9a8d4"),
        durationMinutes: service.duration_minutes,
        priceCents: service.price_cents,
        active: service.active,
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
      await tx`
        INSERT INTO services (id, category_id, name)
        VALUES (${serviceId}, ${parsed.data.categoryId ?? null}, ${parsed.data.name})
      `;
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
