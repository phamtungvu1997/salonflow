import { z } from "zod";

import { CustomerRow, mapCustomerRow } from "@/features/customers/customer-types";
import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const createSchema = z.object({
  salonId: z.string().min(1),
  displayName: z.string().trim().max(120).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  gender: z.enum(["male", "female", "non_binary", "unknown"]).optional(),
  birthDate: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  phoneLandline: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  houseNumber: z.string().trim().max(20).optional().or(z.literal("")),
  addressLine: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  labels: z.array(z.string().trim().min(1).max(40)).optional(),
  additionalInfo: z.string().trim().max(2000).optional().or(z.literal("")),
  invoiceInfo: z.string().trim().max(2000).optional().or(z.literal("")),
  appointmentWarning: z.string().trim().max(500).optional().or(z.literal("")),
  newsletterOptIn: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId");
    const query = url.searchParams.get("q")?.trim() ?? "";
    const genderFilter = url.searchParams.get("gender")?.trim() ?? "";
    const labelFilter = url.searchParams.get("label")?.trim() ?? "";
    const newsletterFilter = url.searchParams.get("newsletter")?.trim() ?? "";
    const staffFilter = url.searchParams.get("staffId")?.trim() ?? "";
    const serviceFilter = url.searchParams.get("service")?.trim() ?? "";
    const minNoShows = Number(url.searchParams.get("minNoShows") ?? "0");
    const minAppointments = url.searchParams.get("minAppointments");
    const segment = url.searchParams.get("segment")?.trim() ?? "";

    const like = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
    if (!salonId) throw new BookingError(422, "salon", "Salon fehlt.");
    assertSalon(user, salonId);
    const sql = getSql();

    const rows = await sql<CustomerRow[]>`
      WITH latest_customers AS (
        SELECT DISTINCT ON (lower(c.display_name))
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
          c.created_at
        FROM customers c
        WHERE c.home_salon_id = ${salonId}
          AND c.archived_at IS NULL
          AND c.id <> 'cust_walkin'
          AND lower(c.display_name) <> 'walk-in'
          AND c.display_name !~ '^Klara [0-9]+$'
        ORDER BY lower(c.display_name), c.created_at DESC
      )
      SELECT
        lc.*,
        count(DISTINCT a.id) FILTER (WHERE a.status <> 'cancelled')::int AS appointment_count,
        count(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled')::int AS cancellation_count,
        count(DISTINCT a.id) FILTER (WHERE a.status = 'no_show')::int AS no_show_count,
        coalesce(sum(s.price_cents_snapshot) FILTER (WHERE a.status <> 'cancelled'), 0)::int AS total_spent_cents,
        max(a.start_at)::text AS last_appointment_at,
        bool_or(a.start_at > now() AND a.status <> 'cancelled') AS has_future_appointment,
        array_remove(array_agg(DISTINCT s.staff_id), NULL) AS staff_ids,
        array_remove(array_agg(DISTINCT s.title_snapshot), NULL) AS service_names
      FROM latest_customers lc
      LEFT JOIN appointments a
        ON a.customer_id = lc.id AND a.salon_id = ${salonId}
      LEFT JOIN appointment_services s
        ON s.appointment_id = a.id
      WHERE (
        ${query === ""}
        OR lc.display_name ILIKE ${like}
        OR coalesce(lc.phone_normalized, '') ILIKE ${like}
        OR coalesce(lc.email, '') ILIKE ${like}
        OR coalesce(lc.city, '') ILIKE ${like}
        OR coalesce(lc.address_line, '') ILIKE ${like}
      )
      GROUP BY
        lc.id, lc.display_name, lc.first_name, lc.last_name, lc.gender, lc.birth_date,
        lc.phone_normalized, lc.phone_landline, lc.email, lc.postal_code, lc.house_number,
        lc.address_line, lc.city, lc.labels, lc.additional_info, lc.invoice_info,
        lc.appointment_warning, lc.newsletter_opt_in, lc.email_reminders_opt_in,
        lc.sms_reminders_opt_in, lc.birthday_wishes_opt_in, lc.feedback_requests_opt_in,
        lc.rebook_reminders_opt_in, lc.is_blocked, lc.created_at
      ORDER BY lower(lc.display_name) ASC
      LIMIT 100
    `;

    const allMapped = rows.map(mapCustomerRow);
    const firstVisitCount = allMapped.filter((c) => c.appointmentCount === 1).length;
    const lapsingCount = allMapped.filter((c) => c.appointmentCount >= 2 && !c.hasFutureAppointment).length;

    const filtered = allMapped.filter((c) => {
      if (genderFilter && c.gender !== genderFilter) return false;
      if (labelFilter && !c.labels.some((l) => l.toLowerCase() === labelFilter.toLowerCase())) return false;
      if (newsletterFilter === "yes" && !c.newsletterOptIn) return false;
      if (newsletterFilter === "no" && c.newsletterOptIn) return false;
      if (staffFilter && !c.staffIds.includes(staffFilter)) return false;
      if (serviceFilter && !c.serviceNames.some((s) => s.toLowerCase().includes(serviceFilter.toLowerCase()))) return false;
      if (minNoShows > 0 && c.noShowCount < minNoShows) return false;
      if (minAppointments !== null && minAppointments !== "" && c.appointmentCount < Number(minAppointments)) return false;
      if (segment === "first_visit" && c.appointmentCount !== 1) return false;
      if (segment === "lapsing" && !(c.appointmentCount >= 2 && !c.hasFutureAppointment)) return false;
      return true;
    });

    return Response.json({
      customers: filtered,
      totalCount: filtered.length,
      segments: {
        firstVisitCount,
        lapsingCount,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Kundenangaben sind ungültig.");
    assertSalon(user, parsed.data.salonId);

    const firstName = parsed.data.firstName?.trim() ?? "";
    const lastName = parsed.data.lastName?.trim() ?? "";
    const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const displayName = (parsed.data.displayName?.trim() || combinedName).trim();

    if (!displayName) {
      throw new BookingError(422, "invalid", "Vorname und Nachname sind erforderlich.");
    }

    const parts = displayName.split(/\s+/);
    const resolvedFirst = firstName || parts[0] || displayName;
    const resolvedLast = lastName || parts.slice(1).join(" ") || "";

    const sql = getSql();
    const customerId = `cust_${crypto.randomUUID()}`;
    const birthDateVal = parsed.data.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data.birthDate)
      ? parsed.data.birthDate
      : null;

    await sql`
      INSERT INTO customers (
        id,
        display_name,
        first_name,
        last_name,
        gender,
        birth_date,
        phone_normalized,
        phone_landline,
        email,
        postal_code,
        house_number,
        address_line,
        city,
        labels,
        additional_info,
        invoice_info,
        appointment_warning,
        newsletter_opt_in,
        home_salon_id
      )
      VALUES (
        ${customerId},
        ${displayName},
        ${resolvedFirst},
        ${resolvedLast || null},
        ${parsed.data.gender ?? "unknown"},
        ${birthDateVal},
        ${parsed.data.phone || null},
        ${parsed.data.phoneLandline || null},
        ${parsed.data.email || null},
        ${parsed.data.postalCode || null},
        ${parsed.data.houseNumber || null},
        ${parsed.data.addressLine || null},
        ${parsed.data.city || null},
        ${parsed.data.labels ?? []},
        ${parsed.data.additionalInfo || null},
        ${parsed.data.invoiceInfo || null},
        ${parsed.data.appointmentWarning || null},
        ${parsed.data.newsletterOptIn ?? false},
        ${parsed.data.salonId}
      )
    `;
    return Response.json({ customerId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
