import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SessionUser } from "./auth";
import { createAppointment } from "./booking";
import { closeSql, getSql } from "./db";
import {
  authorizeCalendarEventsAccess,
  listOutboxEventsAfter,
  pollCalendarEvents,
  recordOutbox,
} from "./outbox";
import { BookingError } from "./time";

const salonA = "salon_jeannie";
const salonB = "salon_juliet";
const actor = "user_owner";
const monday = "2026-11-09";

const userSalonA: SessionUser = {
  id: "user_test_events_a",
  email: "events-a@salonflow.example",
  displayName: "Events A",
  salonIds: [salonA],
  defaultSalonId: salonA,
  rolesBySalon: { [salonA]: "receptionist" },
};

const userBothSalons: SessionUser = {
  id: "user_test_events_both",
  email: "events-both@salonflow.example",
  displayName: "Events Both",
  salonIds: [salonA, salonB],
  defaultSalonId: salonA,
  rolesBySalon: { [salonA]: "owner", [salonB]: "owner" },
};

async function makeStaff(salonId: string) {
  const sql = getSql();
  const staffId = `staff_${randomUUID()}`;
  await sql.begin(async (tx) => {
    await tx`INSERT INTO staff (id, display_name, color) VALUES (${staffId}, ${"Test " + staffId.slice(-4)}, '#8fb4a8')`;
    await tx`
      INSERT INTO staff_salon_assignments (id, staff_id, salon_id)
      VALUES (${`asg_${randomUUID()}`}, ${staffId}, ${salonId})
    `;
    await tx`
      INSERT INTO resources (id, resource_type, staff_id)
      VALUES (${`res_${staffId}`}, 'staff', ${staffId})
    `;
    await tx`
      INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
      VALUES (${`shift_${randomUUID()}`}, ${staffId}, ${salonId}, 1, ${9 * 60}, ${18 * 60})
    `;
  });
  return staffId;
}

async function makeService(salonId: string, staffId: string) {
  const sql = getSql();
  const serviceId = `svc_${randomUUID()}`;
  await sql`INSERT INTO services (id, name) VALUES (${serviceId}, 'Maniküre Events')`;
  await sql`
    INSERT INTO salon_services (salon_id, service_id, duration_minutes, price_cents)
    VALUES (${salonId}, ${serviceId}, 60, 3500)
  `;
  await sql`INSERT INTO staff_services (staff_id, service_id) VALUES (${staffId}, ${serviceId})`;
  return serviceId;
}

async function makeCustomer(salonId: string) {
  const sql = getSql();
  const customerId = `cust_${randomUUID()}`;
  await sql`
    INSERT INTO customers (id, display_name, home_salon_id)
    VALUES (${customerId}, 'Klara Beispiel', ${salonId})
  `;
  return customerId;
}

/** True tip cursor — do not use listOutboxEventsAfter(..., limit) as a baseline on large outboxes. */
async function tipCursor(salonId: string): Promise<string> {
  const sql = getSql();
  const rows = await sql<{ max: string | null }[]>`
    SELECT MAX(sequence_id)::text AS max FROM outbox_events WHERE salon_id = ${salonId}
  `;
  return rows[0]?.max ?? "0";
}

describe.skipIf(!process.env.DATABASE_URL)("M12 live calendar outbox / events", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for events integration tests");
    }
  });

  afterAll(async () => {
    await closeSql();
  });

  it("(1) booking create writes a salon-scoped outbox event without customer PII", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const serviceId = await makeService(salonA, staffId);
    const customerId = await makeCustomer(salonA);

    const cursorBefore = await tipCursor(salonA);

    const created = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId,
      serviceId,
      date: monday,
      start: "10:00",
    });

    const events = await listOutboxEventsAfter(sql, salonA, cursorBefore);
    const match = events.find(
      (event) => event.aggregateId === created.appointmentId && event.eventType === "appointment.created",
    );

    expect(match).toBeDefined();
    expect(match).toMatchObject({
      salonId: salonA,
      eventType: "appointment.created",
      aggregateId: created.appointmentId,
    });
    expect(match!.cursor).toMatch(/^\d+$/);
    expect(JSON.stringify(match)).not.toContain(customerId);
    expect(JSON.stringify(match)).not.toContain("Klara");
  });

  it("(2) poll returns salon-scoped events after cursor", async () => {
    const sql = getSql();
    const maxRows = await sql<{ max: string | null }[]>`
      SELECT MAX(sequence_id)::text AS max FROM outbox_events WHERE salon_id = ${salonA}
    `;
    const after = maxRows[0]?.max ?? "0";

    const written = await sql.begin(async (tx) => {
      return recordOutbox(tx, salonA, `agg_${randomUUID()}`, "appointment.rescheduled");
    });

    const polled = await pollCalendarEvents(sql, userSalonA, { salonId: salonA, after });
    expect(polled.events.map((event) => event.cursor)).toContain(written.cursor);
    expect(polled.events.every((event) => event.salonId === salonA)).toBe(true);
    expect(polled.nextCursor).toBe(written.cursor);
  });

  it("(3) other salon events are not leaked", async () => {
    const sql = getSql();
    const maxA = await sql<{ max: string | null }[]>`
      SELECT MAX(sequence_id)::text AS max FROM outbox_events WHERE salon_id = ${salonA}
    `;
    const afterA = maxA[0]?.max ?? "0";

    const foreign = await sql.begin(async (tx) => {
      return recordOutbox(tx, salonB, `agg_${randomUUID()}`, "appointment.cancelled");
    });

    const leaked = await pollCalendarEvents(sql, userSalonA, { salonId: salonA, after: afterA });
    expect(leaked.events.some((event) => event.cursor === foreign.cursor)).toBe(false);
    expect(leaked.events.some((event) => event.salonId === salonB)).toBe(false);

    await expect(
      pollCalendarEvents(sql, userSalonA, { salonId: salonB, after: "0" }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });

    const visibleToOwner = await pollCalendarEvents(sql, userBothSalons, {
      salonId: salonB,
      after: String(Number(foreign.cursor) - 1),
    });
    expect(visibleToOwner.events.some((event) => event.cursor === foreign.cursor)).toBe(true);
  });

  it("(4) unauthenticated poll access is rejected", async () => {
    const sql = getSql();
    await expect(
      pollCalendarEvents(sql, null, { salonId: salonA, after: "0" }),
    ).rejects.toBeInstanceOf(BookingError);
    await expect(
      pollCalendarEvents(sql, null, { salonId: salonA, after: "0" }),
    ).rejects.toMatchObject({ status: 401, code: "auth" });

    expect(() => authorizeCalendarEventsAccess(null, salonA)).toThrow(BookingError);
    try {
      authorizeCalendarEventsAccess(null, salonA);
    } catch (error) {
      expect(error).toMatchObject({ status: 401, code: "auth" });
    }
  });

  it("absence create/delete emit outbox invalidations", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const after = await tipCursor(salonA);
    const absenceId = `abs_${randomUUID()}`;

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO absences (id, staff_id, salon_id, starts_at, ends_at, reason)
        VALUES (
          ${absenceId},
          ${staffId},
          ${salonA},
          ${"2026-11-09T12:00:00.000Z"},
          ${"2026-11-09T13:00:00.000Z"},
          'Pause Test'
        )
      `;
      await recordOutbox(tx, salonA, absenceId, "absence.created");
    });

    await sql.begin(async (tx) => {
      await tx`DELETE FROM absences WHERE id = ${absenceId}`;
      await recordOutbox(tx, salonA, absenceId, "absence.deleted");
    });

    const events = await listOutboxEventsAfter(sql, salonA, after);
    expect(events.some((event) => event.eventType === "absence.created" && event.aggregateId === absenceId)).toBe(
      true,
    );
    expect(events.some((event) => event.eventType === "absence.deleted" && event.aggregateId === absenceId)).toBe(
      true,
    );
  });

  it("calendar-visible chore/note invalidations are emitted on outbox", async () => {
    const sql = getSql();
    const after = await tipCursor(salonA);
    const choreId = `cevt_${randomUUID()}`;
    const noteId = `cevt_${randomUUID()}`;

    await sql.begin(async (tx) => {
      await recordOutbox(tx, salonA, choreId, "calendar_event.chore");
      await recordOutbox(tx, salonA, noteId, "calendar_event.note");
    });

    const events = await listOutboxEventsAfter(sql, salonA, after);
    expect(events.some((e) => e.eventType === "calendar_event.chore" && e.aggregateId === choreId)).toBe(true);
    expect(events.some((e) => e.eventType === "calendar_event.note" && e.aggregateId === noteId)).toBe(true);
  });
});
