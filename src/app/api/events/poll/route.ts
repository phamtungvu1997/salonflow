import { requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { pollCalendarEvents } from "@/server/outbox";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/poll?salonId=&after=&limit=
 * Cursor polling fallback / reconnect replay for salon-scoped calendar invalidations.
 * Cursor is outbox sequence_id (decimal string). Payloads contain no customer PII.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    const after = url.searchParams.get("after");
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 100;

    const result = await pollCalendarEvents(getSql(), user, {
      salonId,
      after,
      limit: Number.isFinite(limit) ? limit : 100,
    });

    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
