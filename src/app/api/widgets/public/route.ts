import { z } from "zod";

import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";
import { loadWidgets } from "@/server/widgets";

const feedbackSchema = z.object({
  salonId: z.string().min(1),
  kind: z.literal("feedback"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

const giftSchema = z.object({
  salonId: z.string().min(1),
  kind: z.literal("gift"),
  amountCents: z.number().int().min(500).max(50000),
  buyerName: z.string().trim().min(1).max(80),
  buyerEmail: z.string().trim().email(),
  recipientName: z.string().trim().min(1).max(80),
});

export async function GET(request: Request) {
  try {
    const salonId = new URL(request.url).searchParams.get("salonId") ?? "";
    if (!salonId) throw new BookingError(422, "invalid", "Salon fehlt.");
    const sql = getSql();
    const widgets = await loadWidgets(sql, salonId);
    const services = await sql<{ name: string; category: string; minutes: number; cents: number }[]>`
      SELECT sv.name, COALESCE(sc.name, 'Leistungen') AS category,
             ss.duration_minutes AS minutes, ss.price_cents AS cents
      FROM salon_services ss
      JOIN services sv ON sv.id = ss.service_id AND sv.active
      LEFT JOIN service_categories sc ON sc.id = sv.category_id
      WHERE ss.salon_id = ${salonId} AND ss.active
      ORDER BY COALESCE(sc.sort_order, 0), sv.name
    `;
    const [salon] = await sql<{ name: string; city: string; email: string }[]>`
      SELECT s.name, s.city, COALESCE(st.notification_email, '') AS email
      FROM salons s
      LEFT JOIN salon_settings st ON st.salon_id = s.id
      WHERE s.id = ${salonId}
    `;
    if (!salon) throw new BookingError(404, "missing", "Salon nicht gefunden.");
    return Response.json({
      salon,
      services,
      site: widgets.site,
      priceWidget: widgets.priceWidget,
      feedback: widgets.feedback,
      gift: widgets.gift,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sql = getSql();
    if (body?.kind === "feedback") {
      const parsed = feedbackSchema.safeParse(body);
      if (!parsed.success) throw new BookingError(422, "invalid", "Bewertung ist ungültig.");
      await loadWidgets(sql, parsed.data.salonId);
      await sql`
        INSERT INTO widget_feedback (id, salon_id, rating, comment)
        VALUES (${`fb_${crypto.randomUUID()}`}, ${parsed.data.salonId}, ${parsed.data.rating}, ${parsed.data.comment ?? null})
      `;
      return Response.json({ saved: true }, { status: 201 });
    }
    const parsed = giftSchema.safeParse(body);
    if (!parsed.success) throw new BookingError(422, "invalid", "Gutscheinwunsch ist ungültig.");
    await loadWidgets(sql, parsed.data.salonId);
    await sql`
      INSERT INTO widget_gift_requests (
        id, salon_id, amount_cents, buyer_name, buyer_email, recipient_name, status
      ) VALUES (
        ${`gift_${crypto.randomUUID()}`}, ${parsed.data.salonId}, ${parsed.data.amountCents},
        ${parsed.data.buyerName}, ${parsed.data.buyerEmail}, ${parsed.data.recipientName}, 'pending'
      )
    `;
    return Response.json({ saved: true, paid: false }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
