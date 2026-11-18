import { z } from "zod";

import { CustomerRow, mapCustomerRow } from "@/features/customers/customer-types";
import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const patchSchema = z.object({
  salonId: z.string().min(1),
  displayName: z.string().trim().max(120).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  gender: z.enum(["male", "female", "non_binary", "unknown"]).optional(),
  birthDate: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  phoneLandline: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  houseNumber: z.string().trim().max(20).nullable().optional(),
  addressLine: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).optional(),
  additionalInfo: z.string().trim().max(2000).nullable().optional(),
  invoiceInfo: z.string().trim().max(2000).nullable().optional(),
  appointmentWarning: z.string().trim().max(500).nullable().optional(),
  newsletterOptIn: z.boolean().optional(),
  emailRemindersOptIn: z.boolean().optional(),
  smsRemindersOptIn: z.boolean().optional(),
  birthdayWishesOptIn: z.boolean().optional(),
  feedbackRequestsOptIn: z.boolean().optional(),
  rebookRemindersOptIn: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const salonId = new URL(request.url).searchParams.get("salonId");
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);

    const sql = getSql();
    const rows = await sql<CustomerRow[]>`
      SELECT
        c.id,
        c.display_name,
        c.first_name,
        c.last_name,
        c.gender,
        c.birth_date::text AS birth_date,
        c.phone_normalized,
        c.phone_landline,
        c.email,
        c.postal_code,
        c.house_number,
        c.address_line,
        c.city,
        c.labels,
        c.additional_info,
        c.invoice_info,
        c.appointment_warning,
        c.newsletter_opt_in,
        c.email_reminders_opt_in,
        c.sms_reminders_opt_in,
        c.birthday_wishes_opt_in,
        c.feedback_requests_opt_in,
        c.rebook_reminders_opt_in,
        c.is_blocked,
        c.created_at,
        count(DISTINCT a.id) FILTER (WHERE a.status <> 'cancelled')::int AS appointment_count,
        count(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled')::int AS cancellation_count,
        count(DISTINCT a.id) FILTER (WHERE a.status = 'no_show')::int AS no_show_count,
        coalesce(sum(s.price_cents_snapshot) FILTER (WHERE a.status <> 'cancelled'), 0)::int AS total_spent_cents,
        max(a.start_at)::text AS last_appointment_at,
        bool_or(a.start_at > now() AND a.status <> 'cancelled') AS has_future_appointment,
        array_remove(array_agg(DISTINCT s.staff_id), NULL) AS staff_ids,
        array_remove(array_agg(DISTINCT s.title_snapshot), NULL) AS service_names
      FROM customers c
      LEFT JOIN appointments a
        ON a.customer_id = c.id AND a.salon_id = ${salonId}
      LEFT JOIN appointment_services s
        ON s.appointment_id = a.id
      WHERE c.id = ${id}
        AND c.home_salon_id = ${salonId}
      GROUP BY
        c.id, c.display_name, c.first_name, c.last_name, c.gender, c.birth_date,
        c.phone_normalized, c.phone_landline, c.email, c.postal_code, c.house_number,
        c.address_line, c.city, c.labels, c.additional_info, c.invoice_info,
        c.appointment_warning, c.newsletter_opt_in, c.email_reminders_opt_in,
        c.sms_reminders_opt_in, c.birthday_wishes_opt_in, c.feedback_requests_opt_in,
        c.rebook_reminders_opt_in, c.is_blocked, c.created_at
    `;

    const row = rows[0];
    if (!row) throw new BookingError(404, "not_found", "Kundin nicht gefunden.");

    const customer = mapCustomerRow(row);

    const appointments = await sql<{
      id: string;
      status: string;
      source: string;
      notes: string | null;
      start_at: string;
      end_at: string;
      created_at: string;
      updated_at: string;
      services: string;
      staff_names: string;
      total_price_cents: number;
      total_duration_minutes: number;
    }[]>`
      SELECT
        a.id,
        a.status,
        a.source,
        a.notes,
        a.start_at,
        a.end_at,
        a.created_at,
        a.updated_at,
        coalesce(string_agg(s.title_snapshot, ', ' ORDER BY s.sequence), 'Termin') AS services,
        coalesce(string_agg(DISTINCT st.display_name, ', '), '—') AS staff_names,
        coalesce(sum(s.price_cents_snapshot), 0)::int AS total_price_cents,
        coalesce(sum(s.duration_minutes_snapshot), 0)::int AS total_duration_minutes
      FROM appointments a
      LEFT JOIN appointment_services s ON s.appointment_id = a.id
      LEFT JOIN staff st ON st.id = s.staff_id
      WHERE a.customer_id = ${id}
        AND a.salon_id = ${salonId}
      GROUP BY a.id
      ORDER BY a.start_at DESC
    `;

    type HistoryItem = {
      id: string;
      type: "appointment_cancelled" | "appointment_created" | "customer_created";
      title: string;
      subtitle: string | null;
      timestamp: string;
    };

    const history: HistoryItem[] = [];
    for (const appt of appointments) {
      const startDate = new Date(appt.start_at);
      const formattedStart = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(startDate);

      if (appt.status === "cancelled") {
        history.push({
          id: `hist_cancel_${appt.id}`,
          type: "appointment_cancelled",
          title: `Termin für ${formattedStart} (${appt.services}) wurde storniert`,
          subtitle: customer.email ? `Stornierungsbestätigung für ${customer.email}` : null,
          timestamp: appt.updated_at || appt.created_at,
        });
      }
      history.push({
        id: `hist_create_${appt.id}`,
        type: "appointment_created",
        title: `Termin erstellt für ${formattedStart} (${appt.services} bei ${appt.staff_names})`,
        subtitle: customer.email ? `Terminbestätigung vermerkt (${customer.email})` : null,
        timestamp: appt.created_at,
      });
    }

    history.push({
      id: `hist_cust_${customer.id}`,
      type: "customer_created",
      title: "Kundin angelegt",
      subtitle: customer.displayName,
      timestamp: customer.createdAt,
    });

    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return Response.json({
      customer,
      appointments: appointments.map((a) => ({
        id: a.id,
        status: a.status,
        source: a.source,
        notes: a.notes,
        startAt: a.start_at,
        endAt: a.end_at,
        createdAt: a.created_at,
        services: a.services,
        staffNames: a.staff_names,
        totalPriceCents: Number(a.total_price_cents ?? 0),
        totalDurationMinutes: Number(a.total_duration_minutes ?? 0),
      })),
      history,
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
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Ungültige Kundenangaben.");
    assertSalon(user, parsed.data.salonId);

    const sql = getSql();
    const existingRows = await sql<{
      id: string;
      display_name: string;
      first_name: string | null;
      last_name: string | null;
      gender: string;
      birth_date: string | null;
      phone_normalized: string | null;
      phone_landline: string | null;
      email: string | null;
      postal_code: string | null;
      house_number: string | null;
      address_line: string | null;
      city: string | null;
      labels: string[] | null;
      additional_info: string | null;
      invoice_info: string | null;
      appointment_warning: string | null;
      newsletter_opt_in: boolean;
      email_reminders_opt_in: boolean;
      sms_reminders_opt_in: boolean;
      birthday_wishes_opt_in: boolean;
      feedback_requests_opt_in: boolean;
      rebook_reminders_opt_in: boolean;
      is_blocked: boolean;
    }[]>`
      SELECT
        id, display_name, first_name, last_name, gender, birth_date::text AS birth_date,
        phone_normalized, phone_landline, email, postal_code, house_number, address_line, city,
        labels, additional_info, invoice_info, appointment_warning,
        newsletter_opt_in, email_reminders_opt_in, sms_reminders_opt_in,
        birthday_wishes_opt_in, feedback_requests_opt_in, rebook_reminders_opt_in, is_blocked
      FROM customers
      WHERE id = ${id} AND home_salon_id = ${parsed.data.salonId}
    `;
    const current = existingRows[0];
    if (!current) throw new BookingError(404, "not_found", "Kundin nicht gefunden.");

    const data = parsed.data;
    const nextFirst = data.firstName !== undefined ? data.firstName : (current.first_name ?? "");
    const nextLast = data.lastName !== undefined ? data.lastName : (current.last_name ?? "");
    const combined = [nextFirst, nextLast].filter(Boolean).join(" ").trim();
    const nextDisplayName = (data.displayName || combined || current.display_name).trim();

    if (!nextDisplayName) {
      throw new BookingError(422, "invalid", "Vorname und Nachname sind erforderlich.");
    }

    const nextBirthDate =
      data.birthDate !== undefined
        ? data.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)
          ? data.birthDate
          : null
        : current.birth_date;

    await sql`
      UPDATE customers
      SET
        display_name = ${nextDisplayName},
        first_name = ${nextFirst || null},
        last_name = ${nextLast || null},
        gender = ${data.gender ?? current.gender ?? "unknown"},
        birth_date = ${nextBirthDate},
        phone_normalized = ${data.phone !== undefined ? data.phone || null : current.phone_normalized},
        phone_landline = ${data.phoneLandline !== undefined ? data.phoneLandline || null : current.phone_landline},
        email = ${data.email !== undefined ? data.email || null : current.email},
        postal_code = ${data.postalCode !== undefined ? data.postalCode || null : current.postal_code},
        house_number = ${data.houseNumber !== undefined ? data.houseNumber || null : current.house_number},
        address_line = ${data.addressLine !== undefined ? data.addressLine || null : current.address_line},
        city = ${data.city !== undefined ? data.city || null : current.city},
        labels = ${data.labels !== undefined ? data.labels : (current.labels ?? [])},
        additional_info = ${data.additionalInfo !== undefined ? data.additionalInfo || null : current.additional_info},
        invoice_info = ${data.invoiceInfo !== undefined ? data.invoiceInfo || null : current.invoice_info},
        appointment_warning = ${data.appointmentWarning !== undefined ? data.appointmentWarning || null : current.appointment_warning},
        newsletter_opt_in = ${data.newsletterOptIn !== undefined ? data.newsletterOptIn : current.newsletter_opt_in},
        email_reminders_opt_in = ${data.emailRemindersOptIn !== undefined ? data.emailRemindersOptIn : current.email_reminders_opt_in},
        sms_reminders_opt_in = ${data.smsRemindersOptIn !== undefined ? data.smsRemindersOptIn : current.sms_reminders_opt_in},
        birthday_wishes_opt_in = ${data.birthdayWishesOptIn !== undefined ? data.birthdayWishesOptIn : current.birthday_wishes_opt_in},
        feedback_requests_opt_in = ${data.feedbackRequestsOptIn !== undefined ? data.feedbackRequestsOptIn : current.feedback_requests_opt_in},
        rebook_reminders_opt_in = ${data.rebookRemindersOptIn !== undefined ? data.rebookRemindersOptIn : current.rebook_reminders_opt_in},
        is_blocked = ${data.isBlocked !== undefined ? data.isBlocked : current.is_blocked}
      WHERE id = ${id} AND home_salon_id = ${data.salonId}
    `;

    return Response.json({ customerId: id });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const salonId = new URL(request.url).searchParams.get("salonId");
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);

    const sql = getSql();
    await sql`
      UPDATE customers
      SET archived_at = now()
      WHERE id = ${id} AND home_salon_id = ${salonId}
    `;

    return Response.json({ archived: true, customerId: id });
  } catch (error) {
    return apiError(error);
  }
}
