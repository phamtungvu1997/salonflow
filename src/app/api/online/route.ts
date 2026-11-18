import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { loadOnlineDesk, saveGoogleRequest, saveOnlineProfile } from "@/server/online-presence";
import { BookingError } from "@/server/time";

const postSchema = z.object({
  salonId: z.string().min(1),
  action: z.enum(["profile", "google"]),
  description: z.string().max(800).optional(),
  instagram: z.string().max(80).optional(),
  facebook: z.string().max(80).optional(),
  googleRequested: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    return Response.json(await loadOnlineDesk(getSql(), salonId));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Die Online-Angaben sind unvollständig.");
    assertSalon(user, parsed.data.salonId);
    if (!canManageSalon(user, parsed.data.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Online.");
    }
    const sql = getSql();
    const desk =
      parsed.data.action === "google"
        ? await saveGoogleRequest(sql, parsed.data.salonId, Boolean(parsed.data.googleRequested))
        : await saveOnlineProfile(sql, {
            salonId: parsed.data.salonId,
            description: parsed.data.description?.trim() ?? "",
            instagram: parsed.data.instagram?.trim() ?? "",
            facebook: parsed.data.facebook?.trim() ?? "",
          });
    return Response.json(desk);
  } catch (error) {
    return apiError(error);
  }
}
