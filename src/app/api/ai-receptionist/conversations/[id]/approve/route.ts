import { requireUser } from "@/server/auth";
import { approveBooking } from "@/server/ai-receptionist";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const conversation = await approveBooking(getSql(), {
      conversationId: id,
      actorUserId: user.id,
    });
    return Response.json({ conversation });
  } catch (error) {
    return apiError(error);
  }
}
