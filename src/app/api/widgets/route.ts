import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";
import { loadWidgets, loyaltyBalance, saveWidgets, type WidgetBundle } from "@/server/widgets";

const patchSchema = z.object({
  salonId: z.string().min(1),
  vat: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(40),
    percent: z.number().min(0).max(30),
    isDefault: z.boolean(),
  })).optional(),
  loyalty: z.object({
    mode: z.enum(["off", "spend", "service"]),
    eurosPerPoint: z.number().min(1).max(500),
  }).optional(),
  invoice: z.object({
    autoGenerate: z.boolean(),
    showDate: z.boolean(),
    header: z.string().max(80),
    footer: z.string().max(400),
  }).optional(),
  site: z.object({
    title: z.string().max(80),
    subtitle: z.string().max(120),
    body: z.string().max(2000),
    domain: z.string().max(120),
  }).optional(),
  priceWidget: z.object({
    width: z.number().min(240).max(1200),
    height: z.number().min(240).max(1600),
    color: z.string().max(20),
  }).optional(),
  feedback: z.object({
    prompt: z.string().max(160),
    color: z.string().max(20),
  }).optional(),
  gift: z.object({
    amounts: z.array(z.number().min(5).max(500)).max(6),
    buttonPosition: z.enum(["left", "right"]),
  }).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    const sql = getSql();
    const widgets = await loadWidgets(sql, salonId);
    const customerId = url.searchParams.get("customerId");
    const points = customerId ? await loyaltyBalance(sql, salonId, customerId) : null;
    const [company] = await sql<{ name: string; email: string }[]>`
      SELECT s.name, COALESCE(st.notification_email, '') AS email
      FROM salons s
      LEFT JOIN salon_settings st ON st.salon_id = s.id
      WHERE s.id = ${salonId}
    `;
    return Response.json({ widgets, points, salonName: company?.name ?? "", contactEmail: company?.email ?? "" });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Widget-Einstellungen sind ungültig.");
    assertSalon(user, parsed.data.salonId);
    if (!canManageSalon(user, parsed.data.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung.");
    }
    const { salonId, ...patch } = parsed.data;
    const widgets = await saveWidgets(getSql(), salonId, patch as Partial<WidgetBundle>);
    return Response.json({ widgets });
  } catch (error) {
    return apiError(error);
  }
}
