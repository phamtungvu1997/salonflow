import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import {
  createCustomPublicBookingLink,
  ensureDefaultPublicBookingLink,
  listPublicBookingLinks,
  revokePublicBookingLink,
} from "@/server/online-booking";
import { BookingError } from "@/server/time";

export const dynamic = "force-dynamic";

const createLinkSchema = z.object({
  salonId: z.string().min(1),
  name: z.string().trim().max(120).optional(),
  shareFormat: z.enum(["link", "embed"]).default("link"),
  allServices: z.boolean().default(true),
  serviceIds: z.array(z.string().min(1)).default([]),
  allStaff: z.boolean().default(true),
  staffIds: z.array(z.string().min(1)).default([]),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);

    const sql = getSql();
    const defaultLink = await ensureDefaultPublicBookingLink(sql, salonId);
    const links = await listPublicBookingLinks(sql, salonId);

    return Response.json({ defaultLink, links });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createLinkSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Ungültige Widget-Konfiguration.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Online-Buchungslinks.");
    }

    const link = await createCustomPublicBookingLink(getSql(), body);
    return Response.json({ link }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    const id = url.searchParams.get("id");
    if (!id) throw new BookingError(422, "invalid", "Link-ID fehlt.");
    assertSalon(user, salonId);
    if (!canManageSalon(user, salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung.");
    }

    await revokePublicBookingLink(getSql(), salonId, id);
    const links = await listPublicBookingLinks(getSql(), salonId);
    return Response.json({ revoked: true, links });
  } catch (error) {
    return apiError(error);
  }
}
