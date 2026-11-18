import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { listSalonConversations, markOwnerAlertSeen, sendOwnerReply } from "@/server/ai-receptionist";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const seenSchema = z.object({
  salonId: z.string().min(1),
  conversationId: z.string().min(1),
  alertId: z.string().min(1).optional(),
  kind: z.enum(["nail_quote", "complaint"]).optional(),
  quoteEuros: z.number().positive().max(800).optional(),
  note: z.string().trim().max(400).optional(),
  complaintChoice: z.enum(["apology", "rebook", "goodwill", "callback"]).optional(),
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
    if (parsed.data.kind) {
      const conversation = await sendOwnerReply(getSql(), {
        salonId: parsed.data.salonId,
        conversationId: parsed.data.conversationId,
        kind: parsed.data.kind,
        quoteEuros: parsed.data.quoteEuros,
        note: parsed.data.note,
        complaintChoice: parsed.data.complaintChoice,
      });
      return Response.json({ conversation });
    }
    if (!parsed.data.alertId) {
      throw new BookingError(422, "invalid", "Hinweis konnte nicht geschlossen werden.");
    }
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
