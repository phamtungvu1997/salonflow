import { getSessionUser, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import {
  authorizeCalendarEventsAccess,
  listOutboxEventsAfter,
  pollCalendarEvents,
  type CalendarInvalidationEvent,
} from "@/server/outbox";
import { BookingError } from "@/server/time";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Stay under the hosted function limit. The local dev server can hold a stream much longer. */
export const maxDuration = 30;

const SSE_POLL_MS = 2_000;
const SSE_HEARTBEAT_MS = 15_000;
/** Re-check session + salon membership periodically (SF-044 mid-stream revoke). */
const SSE_REVALIDATE_EVERY_TICKS = 8; // ~16s at SSE_POLL_MS
/**
 * Local streams stay open for a fresh auth check. Hosted functions are killed
 * at the platform limit if a stream outlives it, which surfaces as a runtime
 * error and can block the rest of the calendar. Close those early and let the
 * client poll.
 */
const SSE_MAX_DURATION_MS = process.env.VERCEL === "1" ? 20_000 : 15 * 60 * 1000;

function wantsStream(request: Request, mode: string | null): boolean {
  if (mode === "poll") return false;
  if (mode === "sse" || mode === "stream") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/event-stream");
}

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId");
    const cursor = url.searchParams.get("cursor");
    const mode = url.searchParams.get("mode");
    if (!salonId) throw new BookingError(422, "invalid", "salonId fehlt.");
    const scopedSalonId: string = salonId;
    authorizeCalendarEventsAccess(user, scopedSalonId);

    const sql = getSql();

    if (!wantsStream(request, mode)) {
      const result = await pollCalendarEvents(sql, user, {
        salonId: scopedSalonId,
        after: cursor,
      });
      return Response.json({
        events: result.events,
        cursor: result.nextCursor,
      });
    }

    const encoder = new TextEncoder();
    let closed = false;
    let lastCursor: string = cursor && /^\d+$/.test(cursor) ? cursor : "0";
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let heartbeatHandle: ReturnType<typeof setInterval> | null = null;
    let maxDurationHandle: ReturnType<typeof setTimeout> | null = null;
    let flushTicks = 0;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const cleanup = () => {
          closed = true;
          if (pollHandle) clearInterval(pollHandle);
          if (heartbeatHandle) clearInterval(heartbeatHandle);
          if (maxDurationHandle) clearTimeout(maxDurationHandle);
          pollHandle = null;
          heartbeatHandle = null;
          maxDurationHandle = null;
        };

        const push = (chunk: string) => {
          if (closed) return;
          controller.enqueue(encoder.encode(chunk));
        };

        const closeStream = (reason: "forbidden" | "expired" | "poll" | "abort") => {
          if (closed) return;
          if (reason === "forbidden" || reason === "expired" || reason === "poll") {
            push(encodeSse("error", { code: reason }));
          }
          cleanup();
          try {
            controller.close();
          } catch {
            // already closed
          }
        };

        // Initial cursor bootstrap so clients can reconnect without a full replay when empty.
        if (lastCursor === "0") {
          const latest = await sql<{ sequence_id: string | number | bigint }[]>`
            SELECT sequence_id FROM outbox_events
            WHERE salon_id = ${scopedSalonId}
            ORDER BY sequence_id DESC
            LIMIT 1
          `;
          if (latest[0]) {
            lastCursor = String(latest[0].sequence_id);
          }
        }
        // sync:true tells clients to refetch after tip bootstrap (cold-start catch-up).
        push(encodeSse("cursor", { cursor: lastCursor, sync: true }));

        async function revalidateAccess() {
          const current = await getSessionUser();
          authorizeCalendarEventsAccess(current, scopedSalonId);
        }

        async function flushNewEvents() {
          if (closed) return;
          flushTicks += 1;
          if (flushTicks === 1 || flushTicks % SSE_REVALIDATE_EVERY_TICKS === 0) {
            try {
              await revalidateAccess();
            } catch {
              closeStream("forbidden");
              return;
            }
          }
          const events = await listOutboxEventsAfter(sql, scopedSalonId, lastCursor, 100);
          for (const event of events) {
            push(encodeSse("calendar.invalidate", event as CalendarInvalidationEvent));
            lastCursor = event.cursor;
          }
        }

        await flushNewEvents();
        pollHandle = setInterval(() => {
          void flushNewEvents().catch((error) => {
            console.error("SSE outbox poll failed", error);
          });
        }, SSE_POLL_MS);
        heartbeatHandle = setInterval(() => {
          push(`: heartbeat ${Date.now()}\n\n`);
        }, SSE_HEARTBEAT_MS);
        maxDurationHandle = setTimeout(() => {
          closeStream(process.env.VERCEL === "1" ? "poll" : "expired");
        }, SSE_MAX_DURATION_MS);

        request.signal.addEventListener("abort", () => {
          closeStream("abort");
        });
      },
      cancel() {
        closed = true;
        if (pollHandle) clearInterval(pollHandle);
        if (heartbeatHandle) clearInterval(heartbeatHandle);
        if (maxDurationHandle) clearTimeout(maxDurationHandle);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
