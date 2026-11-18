import { z } from "zod";

import { requireUser } from "@/server/auth";
import { handleCustomerMessage } from "@/server/ai-receptionist";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const messageSchema = z.object({
  text: z.string().trim().max(2000).optional(),
  nailPhoto: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Nachricht ungültig.");
    }
    const conversation = await handleCustomerMessage(getSql(), {
      conversationId: id,
      text: parsed.data.text ?? "",
      actorUserId: user.id,
      nailPhoto: parsed.data.nailPhoto,
    });
    return Response.json({ conversation });
  } catch (error) {
    return apiError(error);
  }
}
