import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { listSalonConversations, markOwnerAlertSeen } from "@/server/ai-receptionist";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const seenSchema = z.object({
  salonId: z.string().min(1),
  conversationId: z.string().min(1),
  alertId: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    const conversations = await listSalonConversations(getSql(), salonId);
    return Response.json({ conversations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = seenSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Hinweis konnte nicht geschlossen werden.");
    assertSalon(user, parsed.data.salonId);
    const conversation = await markOwnerAlertSeen(
      getSql(),
      parsed.data.salonId,
      parsed.data.conversationId,
      parsed.data.alertId,
    );
    if (!conversation) throw new BookingError(404, "missing", "Gespräch nicht gefunden.");
    return Response.json({ conversation });
  } catch (error) {
    return apiError(error);
  }
}
