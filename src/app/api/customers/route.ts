import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  displayName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId");
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);
    const sql = getSql();
    const customers = query
      ? await sql<{ id: string; display_name: string; phone_normalized: string | null }[]>`
          SELECT id, display_name, phone_normalized FROM customers
          WHERE home_salon_id = ${salonId}
            AND display_name ILIKE ${`%${query}%`}
          ORDER BY display_name
          LIMIT 50
        `
      : await sql<{ id: string; display_name: string; phone_normalized: string | null }[]>`
          SELECT id, display_name, phone_normalized FROM customers
          WHERE home_salon_id = ${salonId}
          ORDER BY created_at DESC
          LIMIT 50
        `;
    return Response.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        displayName: customer.display_name,
        phone: customer.phone_normalized,
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
    if (!parsed.success) throw new BookingError(422, "invalid", "Kundenname fehlt.");
    assertSalon(user, parsed.data.salonId);
    const sql = getSql();
    const customerId = `cust_${crypto.randomUUID()}`;
    await sql`
      INSERT INTO customers (id, display_name, phone_normalized, home_salon_id)
      VALUES (
        ${customerId}, ${parsed.data.displayName}, ${parsed.data.phone ?? null}, ${parsed.data.salonId}
      )
    `;
    return Response.json({ customerId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
