import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cancelAppointment,
  createAppointment,
  listSalonStaffColumns,
  rescheduleAppointment,
} from "./booking";
import { getSql } from "./db";
import { BookingError, zonedDateTimeToUtc } from "./time";

const salonA = "salon_jeannie";
const salonB = "salon_juliet";
const actor = "user_owner";
const monday = "2026-11-09";

async function makeStaff(salonId: string, startMinute = 9 * 60, endMinute = 18 * 60) {
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
      VALUES (${`shift_${randomUUID()}`}, ${staffId}, ${salonId}, 1, ${startMinute}, ${endMinute})
    `;
  });
  return staffId;
}

async function makeService(salonId: string, staffId: string, duration = 60) {
  const sql = getSql();
  const serviceId = `svc_${randomUUID()}`;
  await sql`INSERT INTO services (id, name) VALUES (${serviceId}, 'Maniküre Test')`;
  await sql`
    INSERT INTO salon_services (salon_id, service_id, duration_minutes, price_cents)
    VALUES (${salonId}, ${serviceId}, ${duration}, 3500)
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

async function countAllocations(staffId: string, activeOnly = false) {
  const sql = getSql();
  const rows = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM resource_allocations ra
    JOIN resources r ON r.id = ra.resource_id
    WHERE r.staff_id = ${staffId}
      AND (${activeOnly} = false OR ra.active)
  `;
  return rows[0]?.count ?? 0;
}

function expectHttp409(reason: unknown, code: string) {
  expect(reason).toBeInstanceOf(BookingError);
  expect(reason).toMatchObject({ status: 409, code });
}

describe.skipIf(!process.env.DATABASE_URL)("NS-017 booking engine", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for booking integration tests");
    }
  });

  afterAll(async () => {
    await getSql().end({ timeout: 1 });
  });

  it("IT-01 assigns staff to one salon without creating a login", async () => {
    const sql = getSql();
    const usersBefore = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM users`;
    const staffId = await makeStaff(salonA);
    const columnA = await listSalonStaffColumns(sql, salonA);
    const columnB = await listSalonStaffColumns(sql, salonB);
    const usersAfter = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM users`;

    expect(columnA.map((column) => column.id)).toContain(staffId);
    expect(columnB.map((column) => column.id)).not.toContain(staffId);
    expect(usersAfter[0]?.count).toBe(usersBefore[0]?.count);

    const serviceB = await makeService(salonB, staffId, 30);
    const customerB = await makeCustomer(salonB);
    await sql`DELETE FROM staff_services WHERE staff_id = ${staffId} AND service_id = ${serviceB}`;
    await expect(
      createAppointment(sql, actor, {
        salonId: salonB,
        staffId,
        customerId: customerB,
        serviceId: serviceB,
        date: monday,
        start: "10:00",
      }),
    ).rejects.toMatchObject({ status: 422, code: "staff_salon" });
    expect(await countAllocations(staffId)).toBe(0);
  });

  it("IT-02 creates a login without a bookable staff resource", async () => {
    const sql = getSql();
    const userId = `user_${randomUUID()}`;
    await sql`
      INSERT INTO users (id, email, display_name)
      VALUES (${userId}, ${`${userId}@salonflow.example`}, 'Empfang Test')
    `;
    await sql`
      INSERT INTO user_salon_roles (user_id, salon_id, role)
      VALUES (${userId}, ${salonA}, 'receptionist')
    `;
    const resources = await sql<{ id: string }[]>`
      SELECT r.id
      FROM resources r
      JOIN staff_user_links link ON link.staff_id = r.staff_id
      WHERE link.user_id = ${userId} AND r.resource_type = 'staff' AND r.active
    `;
    expect(resources).toEqual([]);
  });

  it("IT-03 lets only one overlapping cross-salon booking commit", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    await sql`
      INSERT INTO staff_salon_assignments (id, staff_id, salon_id)
      VALUES (${`asg_${randomUUID()}`}, ${staffId}, ${salonB})
    `;
    await sql`
      INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
      VALUES (${`shift_${randomUUID()}`}, ${staffId}, ${salonB}, 1, ${9 * 60}, ${18 * 60})
    `;
    const serviceA = await makeService(salonA, staffId, 60);
    const serviceB = await makeService(salonB, staffId, 60);
    const customerA = await makeCustomer(salonA);
    const customerB = await makeCustomer(salonB);

    const results = await Promise.allSettled([
      createAppointment(sql, actor, {
        salonId: salonA,
        staffId,
        customerId: customerA,
        serviceId: serviceA,
        date: monday,
        start: "10:00",
      }),
      createAppointment(sql, actor, {
        salonId: salonB,
        staffId,
        customerId: customerB,
        serviceId: serviceB,
        date: monday,
        start: "10:30",
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expectHttp409((rejected[0] as PromiseRejectedResult).reason, "conflict");
    expect(await countAllocations(staffId, true)).toBe(1);
  });

  it("IT-04 rejects a booking in the shift gap and writes no allocation", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA, 10 * 60, 12 * 60);
    await sql`
      INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
      VALUES (${`shift_${randomUUID()}`}, ${staffId}, ${salonA}, 1, ${13 * 60}, ${18 * 60})
    `;
    const serviceId = await makeService(salonA, staffId, 30);
    const customerId = await makeCustomer(salonA);

    await expect(
      createAppointment(sql, actor, {
        salonId: salonA,
        staffId,
        customerId,
        serviceId,
        date: monday,
        start: "12:30",
      }),
    ).rejects.toMatchObject({ status: 422, code: "outside_shift" });
    expect(await countAllocations(staffId)).toBe(0);
  });

  it("IT-05 keeps the booked duration after the catalog duration changes", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const serviceId = await makeService(salonA, staffId, 45);
    const firstCustomer = await makeCustomer(salonA);
    const secondCustomer = await makeCustomer(salonA);
    const first = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId: firstCustomer,
      serviceId,
      date: monday,
      start: "10:00",
    });
    await sql`
      UPDATE salon_services
      SET duration_minutes = 60
      WHERE salon_id = ${salonA} AND service_id = ${serviceId}
    `;
    const second = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId: secondCustomer,
      serviceId,
      date: monday,
      start: "12:00",
    });
    const snapshots = await sql<{ appointment_id: string; duration_minutes_snapshot: number }[]>`
      SELECT appointment_id, duration_minutes_snapshot
      FROM appointment_services
      WHERE appointment_id IN (${first.appointmentId}, ${second.appointmentId})
    `;
    const byId = new Map(snapshots.map((row) => [row.appointment_id, row.duration_minutes_snapshot]));
    expect(byId.get(first.appointmentId)).toBe(45);
    expect(byId.get(second.appointmentId)).toBe(60);
  });

  it("IT-06 keeps one appointment when two keys race and the winner is retried", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const serviceId = await makeService(salonA, staffId, 60);
    const customerId = await makeCustomer(salonA);
    const firstKey = randomUUID();
    const secondKey = randomUUID();
    const input = {
      salonId: salonA,
      staffId,
      customerId,
      serviceId,
      date: monday,
      start: "15:00",
    };
    const results = await Promise.allSettled([
      createAppointment(sql, actor, { ...input, idempotencyKey: firstKey }),
      createAppointment(sql, actor, { ...input, idempotencyKey: secondKey }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expectHttp409((rejected[0] as PromiseRejectedResult).reason, "conflict");

    const winnerIndex = results.findIndex((result) => result.status === "fulfilled");
    const winner = (results[winnerIndex] as PromiseFulfilledResult<{ appointmentId: string }>).value;
    const winnerKey = winnerIndex === 0 ? firstKey : secondKey;
    const loserKey = winnerKey === firstKey ? secondKey : firstKey;
    const retryA = await createAppointment(sql, actor, { ...input, idempotencyKey: winnerKey });
    const retryB = await createAppointment(sql, actor, { ...input, idempotencyKey: winnerKey });
    const stored = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM appointments a
      JOIN appointment_services item ON item.appointment_id = a.id
      WHERE item.staff_id = ${staffId} AND a.status <> 'cancelled'
    `;
    expect(stored[0]?.count).toBe(1);
    expect(await countAllocations(staffId, true)).toBe(1);
    expect(retryA).toMatchObject({ appointmentId: winner.appointmentId, reused: true });
    expect(retryB).toMatchObject({ appointmentId: winner.appointmentId, reused: true });
    await expect(
      createAppointment(sql, actor, { ...input, idempotencyKey: loserKey }),
    ).rejects.toMatchObject({ status: 409, code: "conflict" });
  });

  it("IT-07 releases the interval on cancel and keeps the audit trail", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const serviceId = await makeService(salonA, staffId, 60);
    const customerId = await makeCustomer(salonA);
    const created = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId,
      serviceId,
      date: monday,
      start: "16:00",
    });
    await cancelAppointment(sql, actor, {
      appointmentId: created.appointmentId,
      expectedVersion: 1,
    });
    const appointment = await sql<{ status: string }[]>`
      SELECT status FROM appointments WHERE id = ${created.appointmentId}
    `;
    const allocation = await sql<{ active: boolean }[]>`
      SELECT active FROM resource_allocations WHERE appointment_id = ${created.appointmentId}
    `;
    const audit = await sql<{ action: string }[]>`
      SELECT action FROM appointment_audit WHERE appointment_id = ${created.appointmentId} ORDER BY created_at
    `;
    expect(appointment[0]?.status).toBe("cancelled");
    expect(allocation.map((row) => row.active)).toEqual([false]);
    expect(audit.map((row) => row.action)).toEqual(["create", "cancel"]);

    const replacement = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId,
      serviceId,
      date: monday,
      start: "16:00",
    });
    expect(replacement.appointmentId).not.toBe(created.appointmentId);
    expect(await countAllocations(staffId, true)).toBe(1);
  });

  it("IT-08 accepts one version update and rejects the stale retry", async () => {
    const sql = getSql();
    const staffId = await makeStaff(salonA);
    const serviceId = await makeService(salonA, staffId, 60);
    const customerId = await makeCustomer(salonA);
    const created = await createAppointment(sql, actor, {
      salonId: salonA,
      staffId,
      customerId,
      serviceId,
      date: monday,
      start: "10:00",
    });
    const results = await Promise.allSettled([
      rescheduleAppointment(sql, actor, {
        appointmentId: created.appointmentId,
        expectedVersion: 1,
        date: monday,
        start: "11:00",
      }),
      rescheduleAppointment(sql, actor, {
        appointmentId: created.appointmentId,
        expectedVersion: 1,
        date: monday,
        start: "14:00",
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expectHttp409((rejected[0] as PromiseRejectedResult).reason, "version");
    expect((fulfilled[0] as PromiseFulfilledResult<{ version: number }>).value.version).toBe(2);

    const stored = await sql<{ version: number }[]>`
      SELECT version FROM appointments WHERE id = ${created.appointmentId}
    `;
    const active = await sql<{ start_at: Date }[]>`
      SELECT start_at FROM resource_allocations
      WHERE appointment_id = ${created.appointmentId} AND active
    `;
    const winnerStart = results[0].status === "fulfilled" ? "11:00" : "14:00";
    expect(stored[0]?.version).toBe(2);
    expect(active).toHaveLength(1);
    expect(active[0]?.start_at.toISOString()).toBe(zonedDateTimeToUtc(monday, winnerStart).toISOString());
    expect(await countAllocations(staffId, true)).toBe(1);
  });
});
