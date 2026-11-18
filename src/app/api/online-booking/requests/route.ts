import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import {
  decidePublicBookingRequest,
  listPublicBookingRequests,
} from "@/server/online-booking";
import { BookingError } from "@/server/time";

export const dynamic = "force-dynamic";

const decideSchema = z.object({
  salonId: z.string().min(1),
  requestId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);

    const requests = await listPublicBookingRequests(getSql(), salonId);
    return Response.json({ requests });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = decideSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Ungültige Entscheidung.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung.");
    }

    const result = await decidePublicBookingRequest(getSql(), user.id, body);
    const requests = await listPublicBookingRequests(getSql(), body.salonId);
    return Response.json({ ...result, requests });
  } catch (error) {
    return apiError(error);
  }
}
