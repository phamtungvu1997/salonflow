import {
  addDays,
  BookingError,
  coversShift,
  isoWeekday,
  minutesOfDay,
  zonedDateTimeToUtc,
} from "./time";
import type { Db } from "./db";

type ShiftRow = { start_minute: number; end_minute: number };

function isExclusion(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23P01"
  );
}

async function shiftsFor(
  tx: Db,
  staffId: string,
  salonId: string,
  weekday: number,
): Promise<ShiftRow[]> {
  return tx<ShiftRow[]>`
    SELECT start_minute, end_minute
    FROM weekly_shifts
    WHERE staff_id = ${staffId} AND salon_id = ${salonId} AND iso_weekday = ${weekday}
  `;
}

async function assertBookableWindow(
  tx: Db,
  staffId: string,
  salonId: string,
  start: Date,
  end: Date,
) {
  if (isoWeekday(start) !== isoWeekday(end) || minutesOfDay(end) <= minutesOfDay(start)) {
    throw new BookingError(
      422,
      "outside_shift",
      "Der Termin muss an einem Arbeitstag innerhalb der Schicht liegen.",
    );
  }
  const shifts = await shiftsFor(tx, staffId, salonId, isoWeekday(start));
  if (!coversShift(
    shifts.map((shift) => ({
      startMinute: shift.start_minute,
      endMinute: shift.end_minute,
    })),
    minutesOfDay(start),
    minutesOfDay(end),
  )) {
    throw new BookingError(
      422,
      "outside_shift",
      "Außerhalb der Arbeitszeit oder in einer Pause.",
    );
  }

  const overlappingAbsences = await tx<{ id: string }[]>`
    SELECT id
    FROM absences
    WHERE staff_id = ${staffId}
      AND salon_id = ${salonId}
      AND starts_at < ${end}
      AND ends_at > ${start}
    LIMIT 1
  `;
  if (overlappingAbsences.length > 0) {
    throw new BookingError(
      422,
      "absent",
      "Mitarbeiter ist in diesem Zeitraum als abwesend eingetragen.",
    );
  }
}

export async function listSalonStaffColumns(sql: Db, salonId: string) {
  const staff = await sql<{ id: string; display_name: string; color: string | null }[]>`
    SELECT s.id, s.display_name, s.color
    FROM staff s
    JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${salonId} AND a.active
    WHERE s.active
    ORDER BY s.display_name
  `;
  return staff.map((member) => ({
    id: member.id,
    displayName: member.display_name,
    color: member.color ?? "#8fb4a8",
  }));
}

function requestFingerprint(input: {
  staffId: string;
  customerId: string;
  serviceId: string;
  date: string;
  start: string;
}) {
  return [input.staffId, input.customerId, input.serviceId, input.date, input.start].join("|");
}

async function recordOutbox(
  tx: Db,
  salonId: string,
  aggregateId: string,
  eventType: string,
) {
  await tx`
    INSERT INTO outbox_events (id, salon_id, aggregate_id, event_type)
    VALUES (${`out_${crypto.randomUUID()}`}, ${salonId}, ${aggregateId}, ${eventType})
  `;
}

export async function createAppointment(
  sql: Db,
  actorUserId: string,
  input: {
    salonId: string;
    staffId: string;
    customerId: string;
    serviceId: string;
    date: string;
    start: string;
    notes?: string;
    idempotencyKey?: string;
  },
) {
  try {
    return await sql.begin(async (tx) => {
      const fingerprint = requestFingerprint(input);
      if (input.idempotencyKey) {
        await tx`
          SELECT pg_advisory_xact_lock(hashtextextended(${`${input.salonId}:${input.idempotencyKey}`}, 0))
        `;
        const existing = await tx<{
          appointment_id: string | null;
          request_fingerprint: string | null;
        }[]>`
          SELECT appointment_id, request_fingerprint FROM idempotency_keys
          WHERE key = ${input.idempotencyKey} AND salon_id = ${input.salonId}
        `;
        if (existing[0]?.appointment_id) {
          if (
            existing[0].request_fingerprint &&
            existing[0].request_fingerprint !== fingerprint
          ) {
            throw new BookingError(
              409,
              "idempotency_mismatch",
              "Der Schlüssel gehört zu einer anderen Buchung.",
            );
          }
          return { appointmentId: existing[0].appointment_id, reused: true };
        }
      }

      const assigned = await tx`
        SELECT 1 FROM staff_salon_assignments
        WHERE staff_id = ${input.staffId} AND salon_id = ${input.salonId} AND active
      `;
      if (assigned.length === 0) {
        throw new BookingError(422, "staff_salon", "Mitarbeiter ist diesem Salon nicht zugeordnet.");
      }

      const service = await tx<{
        name: string;
        duration_minutes: number;
        price_cents: number;
      }[]>`
        SELECT s.name, ss.duration_minutes, ss.price_cents
        FROM services s
        JOIN salon_services ss ON ss.service_id = s.id AND ss.salon_id = ${input.salonId} AND ss.active
        JOIN staff_services el ON el.service_id = s.id AND el.staff_id = ${input.staffId}
        WHERE s.id = ${input.serviceId} AND s.active
      `;
      if (!service[0]) {
        throw new BookingError(422, "ineligible", "Leistung ist für diesen Mitarbeiter nicht buchbar.");
      }

      const customer = await tx`
        SELECT 1 FROM customers
        WHERE id = ${input.customerId} AND home_salon_id = ${input.salonId}
      `;
      if (customer.length === 0) {
        throw new BookingError(422, "customer_salon", "Kunde gehört nicht zu diesem Salon.");
      }

      const start = zonedDateTimeToUtc(input.date, input.start);
      const end = new Date(start.getTime() + service[0].duration_minutes * 60_000);
      await assertBookableWindow(tx, input.staffId, input.salonId, start, end);

      const resources = await tx<{ id: string }[]>`
        SELECT id FROM resources
        WHERE staff_id = ${input.staffId} AND resource_type = 'staff'
        FOR UPDATE
      `;
      if (!resources[0]) {
        throw new BookingError(422, "resource", "Keine buchbare Ressource für den Mitarbeiter.");
      }

      const appointmentId = `appt_${crypto.randomUUID()}`;
      const notes = input.notes?.trim() || null;
      await tx`
        INSERT INTO appointments (id, salon_id, customer_id, status, source, version, notes, start_at, end_at)
        VALUES (
          ${appointmentId}, ${input.salonId}, ${input.customerId}, 'booked', 'internal', 1, ${notes}, ${start}, ${end}
        )
      `;
      await tx`
        INSERT INTO appointment_services (
          id, appointment_id, sequence, staff_id, title_snapshot, duration_minutes_snapshot, price_cents_snapshot
        ) VALUES (
          ${`item_${crypto.randomUUID()}`}, ${appointmentId}, 1, ${input.staffId},
          ${service[0].name}, ${service[0].duration_minutes}, ${service[0].price_cents}
        )
      `;
      await tx`
        INSERT INTO resource_allocations (id, resource_id, appointment_id, start_at, end_at, active)
        VALUES (
          ${`alloc_${crypto.randomUUID()}`}, ${resources[0].id}, ${appointmentId}, ${start}, ${end}, true
        )
      `;
      await tx`
        INSERT INTO appointment_audit (id, appointment_id, actor_user_id, action)
        VALUES (${`audit_${crypto.randomUUID()}`}, ${appointmentId}, ${actorUserId}, 'create')
      `;
      if (input.idempotencyKey) {
        await tx`
          INSERT INTO idempotency_keys (key, salon_id, appointment_id, request_fingerprint)
          VALUES (${input.idempotencyKey}, ${input.salonId}, ${appointmentId}, ${fingerprint})
        `;
      }
      await recordOutbox(tx, input.salonId, appointmentId, "appointment.created");
      return { appointmentId, reused: false };
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (isExclusion(error)) {
      throw new BookingError(409, "conflict", "Die Zeit ist bereits belegt.");
    }
    throw error;
  }
}

export async function rescheduleAppointment(
  sql: Db,
  actorUserId: string,
  input: {
    appointmentId: string;
    expectedVersion: number;
    date: string;
    start: string;
    serviceId?: string;
    staffId?: string;
    durationMinutes?: number;
    status?: "booked" | "confirmed" | "arrived" | "in_progress" | "completed" | "no_show";
  },
) {
  try {
    return await sql.begin(async (tx) => {
      const rows = await tx<{
        version: number;
        salon_id: string;
        status: string;
        staff_id: string;
        title_snapshot: string;
        duration_minutes_snapshot: number;
        price_cents_snapshot: number;
      }[]>`
        SELECT a.version, a.salon_id, a.status, i.staff_id,
               i.title_snapshot, i.duration_minutes_snapshot, i.price_cents_snapshot
        FROM appointments a
        JOIN appointment_services i ON i.appointment_id = a.id AND i.sequence = 1
        WHERE a.id = ${input.appointmentId}
        FOR UPDATE
      `;
      const current = rows[0];
      if (!current || current.status === "cancelled") {
        throw new BookingError(404, "missing", "Termin nicht gefunden.");
      }
      if (current.version !== input.expectedVersion) {
        throw new BookingError(409, "version", "Der Termin wurde inzwischen geändert.");
      }

      const nextStaffId = input.staffId || current.staff_id;
      let nextTitle = current.title_snapshot;
      let nextDuration = input.durationMinutes ?? current.duration_minutes_snapshot;
      let nextPriceCents = current.price_cents_snapshot;

      if (input.staffId && input.staffId !== current.staff_id) {
        const assigned = await tx`
          SELECT 1 FROM staff_salon_assignments
          WHERE staff_id = ${nextStaffId} AND salon_id = ${current.salon_id} AND active
        `;
        if (assigned.length === 0) {
          throw new BookingError(422, "staff_salon", "Mitarbeiter ist diesem Salon nicht zugeordnet.");
        }
      }

      if (input.serviceId) {
        const svc = await tx<{
          name: string;
          duration_minutes: number;
          price_cents: number;
        }[]>`
          SELECT s.name, ss.duration_minutes, ss.price_cents
          FROM services s
          JOIN salon_services ss ON ss.service_id = s.id AND ss.salon_id = ${current.salon_id} AND ss.active
          JOIN staff_services el ON el.service_id = s.id AND el.staff_id = ${nextStaffId}
          WHERE s.id = ${input.serviceId} AND s.active
        `;
        if (!svc[0]) {
          throw new BookingError(422, "ineligible", "Leistung ist für diesen Mitarbeiter nicht buchbar.");
        }
        nextTitle = svc[0].name;
        if (input.durationMinutes === undefined) {
          nextDuration = svc[0].duration_minutes;
        }
        nextPriceCents = svc[0].price_cents;
      }

      const start = zonedDateTimeToUtc(input.date, input.start);
      const end = new Date(start.getTime() + nextDuration * 60_000);
      await assertBookableWindow(tx, nextStaffId, current.salon_id, start, end);
      const resources = await tx<{ id: string }[]>`
        SELECT id FROM resources WHERE staff_id = ${nextStaffId} AND resource_type = 'staff' FOR UPDATE
      `;
      if (!resources[0]) {
        throw new BookingError(422, "resource", "Keine buchbare Ressource für den Mitarbeiter.");
      }
      await tx`
        UPDATE resource_allocations SET active = false
        WHERE appointment_id = ${input.appointmentId} AND active
      `;
      await tx`
        INSERT INTO resource_allocations (id, resource_id, appointment_id, start_at, end_at, active)
        VALUES (
          ${`alloc_${crypto.randomUUID()}`}, ${resources[0].id}, ${input.appointmentId}, ${start}, ${end}, true
        )
      `;
      await tx`
        UPDATE appointment_services
        SET staff_id = ${nextStaffId},
            title_snapshot = ${nextTitle},
            duration_minutes_snapshot = ${nextDuration},
            price_cents_snapshot = ${nextPriceCents}
        WHERE appointment_id = ${input.appointmentId} AND sequence = 1
      `;
      const nextStatus = input.status ?? current.status;
      await tx`
        UPDATE appointments
        SET start_at = ${start},
            end_at = ${end},
            status = ${nextStatus},
            version = version + 1,
            updated_at = now()
        WHERE id = ${input.appointmentId}
      `;
      const auditAction =
        input.status === "no_show" && current.status !== "no_show"
          ? "no_show"
          : "reschedule";
      await tx`
        INSERT INTO appointment_audit (id, appointment_id, actor_user_id, action, detail)
        VALUES (${`audit_${crypto.randomUUID()}`}, ${input.appointmentId}, ${actorUserId}, ${auditAction}, ${input.start})
      `;
      await recordOutbox(tx, current.salon_id, input.appointmentId, "appointment.rescheduled");
      return {
        appointmentId: input.appointmentId,
        version: current.version + 1,
        status: nextStatus,
      };
    });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (isExclusion(error)) {
      throw new BookingError(409, "conflict", "Die neue Zeit ist bereits belegt.");
    }
    throw error;
  }
}

export async function markAppointmentNoShow(
  sql: Db,
  actorUserId: string,
  input: { appointmentId: string; expectedVersion: number },
) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ version: number; status: string; salon_id: string }[]>`
      SELECT version, status, salon_id FROM appointments WHERE id = ${input.appointmentId} FOR UPDATE
    `;
    const current = rows[0];
    if (!current || current.status === "cancelled") {
      throw new BookingError(404, "missing", "Termin nicht gefunden.");
    }
    if (current.version !== input.expectedVersion) {
      throw new BookingError(409, "version", "Der Termin wurde inzwischen geändert.");
    }
    // IMPORTANT (Master Architecture V2): no_show retains active resource allocation (does NOT release time)
    await tx`
      UPDATE appointments
      SET status = 'no_show', version = version + 1, updated_at = now()
      WHERE id = ${input.appointmentId}
    `;
    await tx`
      INSERT INTO appointment_audit (id, appointment_id, actor_user_id, action)
      VALUES (${`audit_${crypto.randomUUID()}`}, ${input.appointmentId}, ${actorUserId}, 'no_show')
    `;
    await recordOutbox(tx, current.salon_id, input.appointmentId, "appointment.no_show");
    return {
      appointmentId: input.appointmentId,
      version: current.version + 1,
      status: "no_show" as const,
    };
  });
}

export async function cancelAppointment(
  sql: Db,
  actorUserId: string,
  input: { appointmentId: string; expectedVersion: number },
) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ version: number; status: string; salon_id: string }[]>`
      SELECT version, status, salon_id FROM appointments WHERE id = ${input.appointmentId} FOR UPDATE
    `;
    const current = rows[0];
    if (!current) throw new BookingError(404, "missing", "Termin nicht gefunden.");
    if (current.version !== input.expectedVersion) {
      throw new BookingError(409, "version", "Der Termin wurde inzwischen geändert.");
    }
    await tx`
      UPDATE resource_allocations SET active = false
      WHERE appointment_id = ${input.appointmentId} AND active
    `;
    await tx`
      UPDATE appointments
      SET status = 'cancelled', version = version + 1, updated_at = now()
      WHERE id = ${input.appointmentId}
    `;
    await tx`
      INSERT INTO appointment_audit (id, appointment_id, actor_user_id, action)
      VALUES (${`audit_${crypto.randomUUID()}`}, ${input.appointmentId}, ${actorUserId}, 'cancel')
    `;
    await recordOutbox(tx, current.salon_id, input.appointmentId, "appointment.cancelled");
    return { appointmentId: input.appointmentId, version: current.version + 1 };
  });
}

export function dayBounds(date: string) {
  return {
    start: zonedDateTimeToUtc(date, "00:00"),
    end: zonedDateTimeToUtc(addDays(date, 1), "00:00"),
  };
}
