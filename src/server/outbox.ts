import type { SessionUser } from "./auth";
import { assertSalon } from "./auth";
import type { Db } from "./db";
import { BookingError } from "./time";

export type CalendarInvalidationEvent = {
  salonId: string;
  eventType: string;
  aggregateId: string;
  createdAt: string;
  cursor: string;
};

type OutboxRow = {
  sequence_id: string | number | bigint;
  salon_id: string;
  aggregate_id: string;
  event_type: string;
  created_at: Date | string;
};

function cursorFromSequence(value: string | number | bigint): string {
  return String(value);
}

function mapOutboxRow(row: OutboxRow): CalendarInvalidationEvent {
  const createdAt =
    row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
  return {
    salonId: row.salon_id,
    eventType: row.event_type,
    aggregateId: row.aggregate_id,
    createdAt,
    cursor: cursorFromSequence(row.sequence_id),
  };
}

/** Persist a salon-scoped calendar invalidation inside the caller's transaction. No PII. */
export async function recordOutbox(
  tx: Db,
  salonId: string,
  aggregateId: string,
  eventType: string,
): Promise<CalendarInvalidationEvent> {
  const rows = await tx<OutboxRow[]>`
    INSERT INTO outbox_events (id, salon_id, aggregate_id, event_type)
    VALUES (${`out_${crypto.randomUUID()}`}, ${salonId}, ${aggregateId}, ${eventType})
    RETURNING sequence_id, salon_id, aggregate_id, event_type, created_at
  `;
  const row = rows[0];
  if (!row) {
    throw new BookingError(500, "outbox", "Outbox-Ereignis konnte nicht geschrieben werden.");
  }
  return mapOutboxRow(row);
}

/**
 * Cursor is the outbox `sequence_id` (decimal string). Events with sequence_id > after are returned
 * in ascending order for reconnect replay. Pass null/empty to read from the beginning.
 */
export async function listOutboxEventsAfter(
  sql: Db,
  salonId: string,
  afterCursor: string | null | undefined,
  limit = 100,
): Promise<CalendarInvalidationEvent[]> {
  const after = afterCursor && /^\d+$/.test(afterCursor) ? afterCursor : "0";
  const capped = Math.min(Math.max(limit, 1), 500);
  const rows = await sql<OutboxRow[]>`
    SELECT sequence_id, salon_id, aggregate_id, event_type, created_at
    FROM outbox_events
    WHERE salon_id = ${salonId}
      AND sequence_id > ${after}::bigint
    ORDER BY sequence_id ASC
    LIMIT ${capped}
  `;
  return rows.map(mapOutboxRow);
}

export function authorizeCalendarEventsAccess(user: SessionUser | null, salonId: string): SessionUser {
  if (!user) {
    throw new BookingError(401, "auth", "Bitte anmelden.");
  }
  if (!salonId) {
    throw new BookingError(422, "invalid", "salonId fehlt.");
  }
  assertSalon(user, salonId);
  return user;
}

export async function pollCalendarEvents(
  sql: Db,
  user: SessionUser | null,
  input: { salonId: string; after?: string | null; limit?: number },
): Promise<{ events: CalendarInvalidationEvent[]; nextCursor: string | null }> {
  authorizeCalendarEventsAccess(user, input.salonId);
  const events = await listOutboxEventsAfter(sql, input.salonId, input.after, input.limit ?? 100);
  const nextCursor = events.length > 0 ? events[events.length - 1]!.cursor : input.after ?? null;
  return { events, nextCursor };
}
