import { assertSalon, requireUser } from "@/server/auth";
import { dayBounds, listSalonStaffColumns } from "@/server/booking";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError, minutesOfDay } from "@/server/time";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId");
    const date = url.searchParams.get("date");
    if (!salonId || !date) throw new BookingError(422, "invalid", "Salon und Datum fehlen.");
    assertSalon(user, salonId);
    const bounds = dayBounds(date);
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
      customer_name: string;
      service_name: string;
      start_at: Date;
      end_at: Date;
      version: number;
      status: string;
    }[]>`
      SELECT a.id, i.staff_id, c.display_name AS customer_name, i.title_snapshot AS service_name,
             a.start_at, a.end_at, a.version, a.status
      FROM appointments a
      JOIN appointment_services i ON i.appointment_id = a.id AND i.sequence = 1
      JOIN customers c ON c.id = a.customer_id
      WHERE a.salon_id = ${salonId}
        AND a.status <> 'cancelled'
        AND a.start_at < ${bounds.end}
        AND a.end_at > ${bounds.start}
      ORDER BY a.start_at
    `;
    return Response.json({
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
        customerName: appointment.customer_name,
        serviceName: appointment.service_name,
        start: appointment.start_at.toISOString(),
        end: appointment.end_at.toISOString(),
        startMinute: minutesOfDay(appointment.start_at),
        endMinute: minutesOfDay(appointment.end_at),
        version: appointment.version,
        status: appointment.status,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
