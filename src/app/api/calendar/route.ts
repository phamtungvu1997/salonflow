import { assertSalon, requireUser } from "@/server/auth";
import { dayBounds, listSalonStaffColumns } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { APP_TIME_ZONE, BookingError, minutesOfDay } from "@/server/time";

function berlinDateStr(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId");
    const date = url.searchParams.get("date");
    const endDate = url.searchParams.get("endDate");
    if (!salonId || !date) throw new BookingError(422, "invalid", "Salon und Datum fehlen.");
    assertSalon(user, salonId);
    const startBounds = dayBounds(date);
    const finishBounds = endDate ? dayBounds(endDate) : startBounds;
    const sql = getSql();
    const staff = await listSalonStaffColumns(sql, salonId);
    const shifts = await sql<{
      staff_id: string;
      iso_weekday: number;
      start_minute: number;
      end_minute: number;
    }[]>`
      SELECT staff_id, iso_weekday, start_minute, end_minute
      FROM weekly_shifts WHERE salon_id = ${salonId}
    `;
    const appointments = await sql<{
      id: string;
      staff_id: string;
      customer_id: string;
      customer_name: string;
      customer_phone: string | null;
      customer_email: string | null;
      service_name: string;
      duration_minutes: number;
      price_cents: number;
      notes: string | null;
      start_at: Date;
      end_at: Date;
      version: number;
      status: string;
    }[]>`
      SELECT a.id, i.staff_id, c.id AS customer_id, c.display_name AS customer_name,
             c.phone_normalized AS customer_phone, c.email AS customer_email,
             i.title_snapshot AS service_name,
             i.duration_minutes_snapshot AS duration_minutes,
             i.price_cents_snapshot AS price_cents,
             a.notes, a.start_at, a.end_at, a.version, a.status
      FROM appointments a
      JOIN appointment_services i ON i.appointment_id = a.id AND i.sequence = 1
      JOIN customers c ON c.id = a.customer_id
      WHERE a.salon_id = ${salonId}
        AND a.status <> 'cancelled'
        AND a.start_at < ${finishBounds.end}
        AND a.end_at > ${startBounds.start}
      ORDER BY a.start_at
    `;
    const absences = await sql<{
      id: string;
      staff_id: string;
      starts_at: Date;
      ends_at: Date;
      reason: string | null;
    }[]>`
      SELECT id, staff_id, starts_at, ends_at, reason
      FROM absences
      WHERE salon_id = ${salonId}
        AND starts_at < ${finishBounds.end}
        AND ends_at > ${startBounds.start}
      ORDER BY starts_at
    `.catch(() => []);
    const events = await sql<{
      id: string;
      kind: "absence" | "chore" | "note";
      description: string;
      applies_to: "company" | "employee" | "tool";
      staff_id: string | null;
      start_at: Date;
      end_at: Date;
      all_day: boolean;
    }[]>`
      SELECT id, kind, description, applies_to, staff_id, start_at, end_at, all_day
      FROM calendar_events
      WHERE salon_id = ${salonId}
        AND start_at < ${finishBounds.end}
        AND end_at > ${startBounds.start}
      ORDER BY start_at
    `.catch(() => []);
    const [settingsRow] = await sql<{
      slot_interval_minutes: number;
      appointment_color_mode: string;
      hide_unscheduled_staff: boolean;
    }[]>`
      SELECT slot_interval_minutes, appointment_color_mode, hide_unscheduled_staff
      FROM salon_settings
      WHERE salon_id = ${salonId}
    `.catch(() => []);
    return Response.json({
      calendarSettings: {
        slotIntervalMinutes: settingsRow?.slot_interval_minutes ?? 15,
        appointmentColorMode: settingsRow?.appointment_color_mode ?? "category",
        hideUnscheduledStaff: settingsRow?.hide_unscheduled_staff ?? false,
      },
      staff: staff.map((member) => ({
        ...member,
        shifts: shifts
          .filter((shift) => shift.staff_id === member.id)
          .map((shift) => ({
            isoWeekday: shift.iso_weekday,
            startMinute: shift.start_minute,
            endMinute: shift.end_minute,
          })),
      })),
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        staffId: appointment.staff_id,
        customerId: appointment.customer_id,
        customerName: appointment.customer_name,
        customerPhone: appointment.customer_phone,
        customerEmail: appointment.customer_email,
        serviceName: appointment.service_name,
        durationMinutes: appointment.duration_minutes,
        priceCents: appointment.price_cents,
        notes: appointment.notes,
        date: berlinDateStr(appointment.start_at),
        start: appointment.start_at.toISOString(),
        end: appointment.end_at.toISOString(),
        startMinute: minutesOfDay(appointment.start_at),
        endMinute: minutesOfDay(appointment.end_at),
        version: appointment.version,
        status: appointment.status,
      })),
      absences: absences.map((absence) => ({
        id: absence.id,
        staffId: absence.staff_id,
        reason: absence.reason || "Abwesenheit",
        date: berlinDateStr(absence.starts_at),
        startMinute: Math.max(8 * 60, minutesOfDay(absence.starts_at)),
        endMinute: Math.min(21 * 60, Math.max(minutesOfDay(absence.starts_at) + 30, minutesOfDay(absence.ends_at))),
      })),
      events: events.map((event) => ({
        id: event.id,
        kind: event.kind,
        description: event.description,
        appliesTo: event.applies_to,
        staffId: event.staff_id,
        allDay: event.all_day,
        date: berlinDateStr(event.start_at),
        startMinute: Math.max(8 * 60, minutesOfDay(event.start_at)),
        endMinute: Math.min(21 * 60, Math.max(minutesOfDay(event.start_at) + 30, minutesOfDay(event.end_at))),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
