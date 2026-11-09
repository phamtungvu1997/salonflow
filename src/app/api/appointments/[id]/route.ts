import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { markAppointmentNoShow, rescheduleAppointment } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { APP_TIME_ZONE, BookingError } from "@/server/time";

const bodySchema = z.object({
  expectedVersion: z.number().int(),
  date: z.string().optional(),
  start: z.string().optional(),
  serviceId: z.string().optional(),
  staffId: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z
    .enum(["booked", "confirmed", "arrived", "in_progress", "completed", "no_show"])
    .optional(),
});

function formatHistoryDateTime(instant: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(instant);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const sql = getSql();
    const rows = await sql<{
      id: string;
      salon_id: string;
      customer_id: string;
      customer_name: string;
      customer_first_name: string | null;
      customer_last_name: string | null;
      customer_phone: string | null;
      customer_email: string | null;
      customer_labels: string[] | null;
      status: string;
      source: string;
      version: number;
      notes: string | null;
      start_at: Date;
      end_at: Date;
      created_at: Date;
      staff_id: string;
      staff_name: string;
      service_name: string;
      duration_minutes: number;
      price_cents: number;
    }[]>`
      SELECT a.id, a.salon_id, c.id AS customer_id,
             c.display_name AS customer_name,
             c.first_name AS customer_first_name,
             c.last_name AS customer_last_name,
             c.phone_normalized AS customer_phone,
             c.email AS customer_email,
             c.labels AS customer_labels,
             a.status, a.source, a.version, a.notes,
             a.start_at, a.end_at, a.created_at,
             i.staff_id, st.display_name AS staff_name,
             i.title_snapshot AS service_name,
             i.duration_minutes_snapshot AS duration_minutes,
             i.price_cents_snapshot AS price_cents
      FROM appointments a
      JOIN appointment_services i ON i.appointment_id = a.id AND i.sequence = 1
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN staff st ON st.id = i.staff_id
      WHERE a.id = ${id}
    `;
    const appt = rows[0];
    if (!appt) throw new BookingError(404, "missing", "Termin nicht gefunden.");
    assertSalon(user, appt.salon_id);

    const audits = await sql<{
      id: string;
      action: string;
      detail: string | null;
      created_at: Date;
    }[]>`
      SELECT id, action, detail, created_at
      FROM appointment_audit
      WHERE appointment_id = ${id}
      ORDER BY created_at DESC
    `;

    const startFormatted = formatHistoryDateTime(appt.start_at);
    const createdFormatted = formatHistoryDateTime(appt.created_at);
    const emailDisplay = appt.customer_email || "kundin@beispiel.de";

    const historyItems = [
      ...audits.map((entry) => {
        const ts = formatHistoryDateTime(entry.created_at);
        if (entry.action === "reschedule") {
          return {
            id: entry.id,
            title: `Termin bearbeitet / verschoben (${entry.detail || startFormatted})`,
            timestamp: ts,
          };
        }
        if (entry.action === "no_show") {
          return {
            id: entry.id,
            title: "Termin als Nicht erschienen markiert",
            timestamp: ts,
          };
        }
        if (entry.action === "cancel") {
          return {
            id: entry.id,
            title: "Termin storniert",
            timestamp: ts,
          };
        }
        return {
          id: entry.id,
          title: `Termin erstellt für ${startFormatted}`,
          timestamp: ts,
        };
      }),
      {
        id: `rem_${appt.id}`,
        title: `Terminerinnerung gesendet an ${emailDisplay}`,
        timestamp: startFormatted,
      },
      {
        id: `conf_${appt.id}`,
        title: `Terminbestätigung gesendet an ${emailDisplay}`,
        timestamp: createdFormatted,
      },
    ];

    return Response.json({
      appointment: {
        id: appt.id,
        salonId: appt.salon_id,
        customerId: appt.customer_id,
        customerName: appt.customer_name,
        customerFirstName: appt.customer_first_name,
        customerLastName: appt.customer_last_name,
        customerPhone: appt.customer_phone,
        customerEmail: appt.customer_email,
        customerLabels: appt.customer_labels ?? [],
        status: appt.status,
        source: appt.source,
        version: appt.version,
        notes: appt.notes,
        staffId: appt.staff_id,
        staffName: appt.staff_name,
        serviceName: appt.service_name,
        durationMinutes: appt.duration_minutes,
        priceCents: appt.price_cents,
      },
      history: historyItems,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Änderungsdaten unvollständig.");
    const sql = getSql();
    const rows = await sql<{ salon_id: string }[]>`
      SELECT salon_id FROM appointments WHERE id = ${id}
    `;
    if (!rows[0]) throw new BookingError(404, "missing", "Termin nicht gefunden.");
    assertSalon(user, rows[0].salon_id);

    const data = parsed.data;

    // Pure status update to no_show (without rescheduling)
    if (
      data.status === "no_show" &&
      !data.date &&
      !data.start &&
      !data.serviceId &&
      !data.staffId &&
      data.durationMinutes === undefined
    ) {
      const result = await markAppointmentNoShow(sql, user.id, {
        appointmentId: id,
        expectedVersion: data.expectedVersion,
      });
      if (data.notes !== undefined) {
        await sql`
          UPDATE appointments SET notes = ${data.notes || null} WHERE id = ${id}
        `;
      }
      return Response.json(result);
    }

    if (!data.date || !data.start) {
      throw new BookingError(422, "invalid", "Datum und Uhrzeit fehlen.");
    }

    const result = await rescheduleAppointment(sql, user.id, {
      appointmentId: id,
      expectedVersion: data.expectedVersion,
      date: data.date,
      start: data.start,
      serviceId: data.serviceId,
      staffId: data.staffId,
      durationMinutes: data.durationMinutes,
      status: data.status,
    });
    if (data.notes !== undefined) {
      await sql`
        UPDATE appointments SET notes = ${data.notes || null} WHERE id = ${id}
      `;
    }
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
