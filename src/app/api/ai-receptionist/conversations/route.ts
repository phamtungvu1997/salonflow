import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { startConversation } from "@/server/ai-receptionist";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  customerId: z.string().min(1),
  channel: z.enum(["whatsapp", "instagram", "tiktok", "email"]).default("whatsapp"),
  commentText: z.string().trim().min(2).max(500).optional(),
  fromEmail: z.string().trim().email().optional(),
  subject: z.string().trim().max(160).optional(),
  emailBody: z.string().trim().min(2).max(4000).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Salon und Kunde sind erforderlich.");
    }
    assertSalon(user, parsed.data.salonId);
    const conversation = await startConversation(getSql(), {
      salonId: parsed.data.salonId,
      customerId: parsed.data.customerId,
      actorUserId: user.id,
      channel: parsed.data.channel,
      commentText: parsed.data.commentText,
      fromEmail: parsed.data.fromEmail,
      subject: parsed.data.subject,
      emailBody: parsed.data.emailBody,
    });
    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
