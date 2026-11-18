import { randomBytes, randomUUID } from "node:crypto";

import { createAppointment, dayBounds } from "./booking";
import { quoteOnlineServicePrice } from "./marketing-price";
import type { Db } from "./db";
import { recordOutbox } from "./outbox";
import {
  APP_TIME_ZONE,
  BookingError,
  isoWeekday,
  minutesOfDay,
  zonedDateTimeToUtc,
} from "./time";

export type PublicBookingLinkRecord = {
  id: string;
  token: string;
  salonId: string;
  name: string;
  isDefault: boolean;
  shareFormat: "link" | "embed";
  allServices: boolean;
  serviceIds: string[];
  allStaff: boolean;
  staffIds: string[];
  active: boolean;
  revokedAt: string | null;
  createdAt: string;
};

export type PublicServiceOption = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  durationMinutes: number;
  priceCents: number;
  eligibleStaffIds: string[];
  highlighted: boolean;
};

export type PublicStaffOption = {
  id: string;
  displayName: string;
  color: string;
  sortOrder: number;
  serviceIds: string[];
};

export type PublicBookingRules = {
  salonId: string;
  salonName: string;
  city: string;
  phone: string;
  addressLine: string;
  houseNumber: string;
  postalCode: string;
  enabled: boolean;
  language: string;
  bookingOption: "bookings" | "requests";
  customerScope: "all" | "existing";
  allowStaffChoice: boolean;
  staffChoiceRequired: boolean;
  staffFirstStep: boolean;
  assignInOrder: boolean;
  showPrice: boolean;
  showDuration: boolean;
  allowMultiService: boolean;
  highlightTopServices: boolean;
  topServiceIds: string[];
  intervalMinutes: number;
  minNoticeMinutes: number;
  advanceMonths: number;
  preventGaps: boolean;
  allowWaitlist: boolean;
  requestAddress: boolean;
  requestBirthDate: boolean;
  allowNewsletter: boolean;
  showTermsLink: boolean;
  showPrivacyLink: boolean;
  widgetColor: string;
  scheduleView: "week" | "month_week";
  allowCheckAppointments: boolean;
  showCustomAlert: boolean;
  customAlertText: string;
  shareMode: "link" | "button" | "embed";
  buttonPosition: "right" | "left";
};

function generateOpaqueToken(): string {
  return `sfb_${randomBytes(12).toString("base64url")}`;
}

export function formatMinutesLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function berlinTodayStr(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addMonthsIso(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m! - 1) + months, d!));
  return dt.toISOString().slice(0, 10);
}

function mapLinkRow(row: {
  id: string;
  token: string;
  salon_id: string;
  name: string;
  is_default: boolean;
  share_format: string;
  all_services: boolean;
  service_ids: string[] | null;
  all_staff: boolean;
  staff_ids: string[] | null;
  active: boolean;
  revoked_at: Date | string | null;
  created_at: Date | string;
}): PublicBookingLinkRecord {
  return {
    id: row.id,
    token: row.token,
    salonId: row.salon_id,
    name: row.name,
    isDefault: row.is_default,
    shareFormat: row.share_format === "embed" ? "embed" : "link",
    allServices: row.all_services,
    serviceIds: row.service_ids ?? [],
    allStaff: row.all_staff,
    staffIds: row.staff_ids ?? [],
    active: row.active,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function ensureDefaultPublicBookingLink(
  sql: Db,
  salonId: string,
): Promise<PublicBookingLinkRecord> {
  const existing = await sql<{
    id: string;
    token: string;
    salon_id: string;
    name: string;
    is_default: boolean;
    share_format: string;
    all_services: boolean;
    service_ids: string[] | null;
    all_staff: boolean;
    staff_ids: string[] | null;
    active: boolean;
    revoked_at: Date | string | null;
    created_at: Date | string;
  }[]>`
    SELECT id, token, salon_id, name, is_default, share_format,
           all_services, service_ids, all_staff, staff_ids, active, revoked_at, created_at
    FROM public_booking_links
    WHERE salon_id = ${salonId} AND is_default = true AND active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;
  if (existing[0]) return mapLinkRow(existing[0]);

  const id = `pbl_${randomUUID()}`;
  const token = generateOpaqueToken();
  const inserted = await sql<{
    id: string;
    token: string;
    salon_id: string;
    name: string;
    is_default: boolean;
    share_format: string;
    all_services: boolean;
    service_ids: string[] | null;
    all_staff: boolean;
    staff_ids: string[] | null;
    active: boolean;
    revoked_at: Date | string | null;
    created_at: Date | string;
  }[]>`
    INSERT INTO public_booking_links (
      id, token, salon_id, name, is_default, share_format, all_services, service_ids, all_staff, staff_ids, active
    ) VALUES (
      ${id}, ${token}, ${salonId}, 'Standard-Buchungslink', true, 'link', true, ARRAY[]::text[], true, ARRAY[]::text[], true
    )
    RETURNING id, token, salon_id, name, is_default, share_format,
              all_services, service_ids, all_staff, staff_ids, active, revoked_at, created_at
  `;
  return mapLinkRow(inserted[0]!);
}

export async function listPublicBookingLinks(
  sql: Db,
  salonId: string,
): Promise<PublicBookingLinkRecord[]> {
  await ensureDefaultPublicBookingLink(sql, salonId);
  const rows = await sql<{
    id: string;
    token: string;
    salon_id: string;
    name: string;
    is_default: boolean;
    share_format: string;
    all_services: boolean;
    service_ids: string[] | null;
    all_staff: boolean;
    staff_ids: string[] | null;
    active: boolean;
    revoked_at: Date | string | null;
    created_at: Date | string;
  }[]>`
    SELECT id, token, salon_id, name, is_default, share_format,
           all_services, service_ids, all_staff, staff_ids, active, revoked_at, created_at
    FROM public_booking_links
    WHERE salon_id = ${salonId}
    ORDER BY is_default DESC, created_at DESC
    LIMIT 50
  `;
  return rows.map(mapLinkRow);
}

export async function createCustomPublicBookingLink(
  sql: Db,
  input: {
    salonId: string;
    name?: string;
    shareFormat: "link" | "embed";
    allServices: boolean;
    serviceIds: string[];
    allStaff: boolean;
    staffIds: string[];
  },
): Promise<PublicBookingLinkRecord> {
  if (!input.allServices && input.serviceIds.length === 0) {
    throw new BookingError(422, "services_required", "Bitte mindestens eine Leistung auswählen.");
  }
  if (!input.allStaff && input.staffIds.length === 0) {
    throw new BookingError(422, "staff_required", "Bitte mindestens eine Mitarbeiterin auswählen.");
  }

  // Validate selected services belong to salon and are active.
  if (!input.allServices) {
    const validSvc = await sql<{ service_id: string }[]>`
      SELECT ss.service_id
      FROM salon_services ss
      JOIN services sv ON sv.id = ss.service_id
      WHERE ss.salon_id = ${input.salonId}
        AND ss.active = true
        AND sv.active = true
        AND ss.service_id = ANY(${input.serviceIds})
    `;
    if (validSvc.length !== new Set(input.serviceIds).size) {
      throw new BookingError(422, "invalid_service", "Ungültige oder deaktivierte Leistung in der Auswahl.");
    }
  }

  // Validate selected employees belong to salon and are active.
  if (!input.allStaff) {
    const validStaff = await sql<{ staff_id: string }[]>`
      SELECT a.staff_id
      FROM staff_salon_assignments a
      JOIN staff s ON s.id = a.staff_id
      WHERE a.salon_id = ${input.salonId}
        AND a.active = true
        AND s.active = true
        AND a.staff_id = ANY(${input.staffIds})
    `;
    if (validStaff.length !== new Set(input.staffIds).size) {
      throw new BookingError(422, "invalid_staff", "Ungültige oder inaktive Mitarbeiterin in der Auswahl.");
    }
  }

  const id = `pbl_${randomUUID()}`;
  const token = generateOpaqueToken();
  const label =
    input.name?.trim() ||
    (input.allServices && input.allStaff
      ? "Alle Leistungen & Mitarbeiter"
      : `Gefiltertes Widget (${input.allServices ? "Alle" : input.serviceIds.length} Leistungen · ${input.allStaff ? "Alle" : input.staffIds.length} Mitarbeiter)`);

  const rows = await sql<{
    id: string;
    token: string;
    salon_id: string;
    name: string;
    is_default: boolean;
    share_format: string;
    all_services: boolean;
    service_ids: string[] | null;
    all_staff: boolean;
    staff_ids: string[] | null;
    active: boolean;
    revoked_at: Date | string | null;
    created_at: Date | string;
  }[]>`
    INSERT INTO public_booking_links (
      id, token, salon_id, name, is_default, share_format,
      all_services, service_ids, all_staff, staff_ids, active
    ) VALUES (
      ${id},
      ${token},
      ${input.salonId},
      ${label},
      false,
      ${input.shareFormat},
      ${input.allServices},
      ${input.allServices ? [] : Array.from(new Set(input.serviceIds))},
      ${input.allStaff},
      ${input.allStaff ? [] : Array.from(new Set(input.staffIds))},
      true
    )
    RETURNING id, token, salon_id, name, is_default, share_format,
              all_services, service_ids, all_staff, staff_ids, active, revoked_at, created_at
  `;
  return mapLinkRow(rows[0]!);
}

export async function revokePublicBookingLink(
  sql: Db,
  salonId: string,
  linkId: string,
): Promise<void> {
  const rows = await sql<{ id: string; is_default: boolean }[]>`
    SELECT id, is_default FROM public_booking_links
    WHERE id = ${linkId} AND salon_id = ${salonId}
  `;
  if (!rows[0]) {
    throw new BookingError(404, "missing", "Buchungslink nicht gefunden.");
  }
  await sql`
    UPDATE public_booking_links
    SET active = false, revoked_at = now()
    WHERE id = ${linkId} AND salon_id = ${salonId}
  `;
  if (rows[0].is_default) {
    await ensureDefaultPublicBookingLink(sql, salonId);
  }
}

export async function loadSalonOnlineBookingRules(
  sql: Db,
  salonId: string,
): Promise<PublicBookingRules> {
  await sql`
    INSERT INTO salon_settings (salon_id)
    VALUES (${salonId})
    ON CONFLICT (salon_id) DO NOTHING
  `;
  const rows = await sql<{
    salon_id: string;
    salon_name: string;
    salon_city: string;
    phone: string;
    address_line: string;
    house_number: string;
    postal_code: string;
    online_booking_enabled: boolean;
    online_widget_language: string;
    online_booking_option: string;
    online_customer_scope: string;
    online_allow_staff_choice: boolean;
    online_staff_choice_required: boolean;
    online_staff_first_step: boolean;
    online_assign_in_order: boolean;
    online_show_price: boolean;
    online_show_duration: boolean;
    online_allow_multi_service: boolean;
    online_highlight_top_services: boolean;
    online_top_service_ids: string[] | null;
    online_interval_minutes: number;
    online_min_notice_minutes: number;
    online_advance_months: number;
    online_prevent_gaps: boolean;
    online_allow_waitlist: boolean;
    online_request_address: boolean;
    online_request_birth_date: boolean;
    online_allow_newsletter: boolean;
    online_show_terms_link: boolean;
    online_show_privacy_link: boolean;
    online_widget_color: string;
    online_schedule_view: string;
    online_allow_check_appointments: boolean;
    online_show_custom_alert: boolean;
    online_custom_alert_text: string;
    online_share_mode: string;
    online_button_position: string;
  }[]>`
    SELECT
      s.id AS salon_id,
      s.name AS salon_name,
      s.city AS salon_city,
      st.phone,
      st.address_line,
      st.house_number,
      st.postal_code,
      st.online_booking_enabled,
      st.online_widget_language,
      st.online_booking_option,
      st.online_customer_scope,
      st.online_allow_staff_choice,
      st.online_staff_choice_required,
      st.online_staff_first_step,
      st.online_assign_in_order,
      st.online_show_price,
      st.online_show_duration,
      st.online_allow_multi_service,
      st.online_highlight_top_services,
      st.online_top_service_ids,
      st.online_interval_minutes,
      st.online_min_notice_minutes,
      st.online_advance_months,
      st.online_prevent_gaps,
      st.online_allow_waitlist,
      st.online_request_address,
      st.online_request_birth_date,
      st.online_allow_newsletter,
      st.online_show_terms_link,
      st.online_show_privacy_link,
      st.online_widget_color,
      st.online_schedule_view,
      st.online_allow_check_appointments,
      st.online_show_custom_alert,
      st.online_custom_alert_text,
      st.online_share_mode,
      st.online_button_position
    FROM salons s
    JOIN salon_settings st ON st.salon_id = s.id
    WHERE s.id = ${salonId}
  `;
  const r = rows[0];
  if (!r) throw new BookingError(404, "salon", "Salon nicht gefunden.");
  return {
    salonId: r.salon_id,
    salonName: r.salon_name,
    city: r.salon_city,
    phone: r.phone,
    addressLine: r.address_line,
    houseNumber: r.house_number,
    postalCode: r.postal_code,
    enabled: r.online_booking_enabled,
    language: r.online_widget_language || "de",
    bookingOption: r.online_booking_option === "requests" ? "requests" : "bookings",
    customerScope: r.online_customer_scope === "existing" ? "existing" : "all",
    allowStaffChoice: r.online_allow_staff_choice,
    staffChoiceRequired: r.online_staff_choice_required,
    staffFirstStep: r.online_staff_first_step,
    assignInOrder: r.online_assign_in_order,
    showPrice: r.online_show_price,
    showDuration: r.online_show_duration,
    allowMultiService: r.online_allow_multi_service,
    highlightTopServices: r.online_highlight_top_services,
    topServiceIds: r.online_top_service_ids ?? [],
    intervalMinutes: r.online_interval_minutes || 60,
    minNoticeMinutes: r.online_min_notice_minutes ?? 0,
    advanceMonths: r.online_advance_months || 12,
    preventGaps: r.online_prevent_gaps,
    allowWaitlist: r.online_allow_waitlist,
    requestAddress: r.online_request_address,
    requestBirthDate: r.online_request_birth_date,
    allowNewsletter: r.online_allow_newsletter,
    showTermsLink: r.online_show_terms_link,
    showPrivacyLink: r.online_show_privacy_link,
    widgetColor: r.online_widget_color || "#18202c",
    scheduleView: r.online_schedule_view === "month_week" ? "month_week" : "week",
    allowCheckAppointments: r.online_allow_check_appointments,
    showCustomAlert: r.online_show_custom_alert,
    customAlertText: r.online_custom_alert_text ?? "",
    shareMode:
      r.online_share_mode === "link"
        ? "link"
        : r.online_share_mode === "embed"
          ? "embed"
          : "button",
    buttonPosition: r.online_button_position === "left" ? "left" : "right",
  };
}

export async function resolvePublicBookingCatalog(
  sql: Db,
  token: string,
): Promise<{
  link: PublicBookingLinkRecord;
  rules: PublicBookingRules;
  services: PublicServiceOption[];
  staff: PublicStaffOption[];
}> {
  const linkRows = await sql<{
    id: string;
    token: string;
    salon_id: string;
    name: string;
    is_default: boolean;
    share_format: string;
    all_services: boolean;
    service_ids: string[] | null;
    all_staff: boolean;
    staff_ids: string[] | null;
    active: boolean;
    revoked_at: Date | string | null;
    created_at: Date | string;
  }[]>`
    SELECT id, token, salon_id, name, is_default, share_format,
           all_services, service_ids, all_staff, staff_ids, active, revoked_at, created_at
    FROM public_booking_links
    WHERE token = ${token}
    LIMIT 1
  `;
  const linkRow = linkRows[0];
  if (!linkRow) {
    throw new BookingError(404, "link_not_found", "Dieser Buchungslink ist ungültig.");
  }
  const link = mapLinkRow(linkRow);
  if (!link.active || link.revokedAt) {
    throw new BookingError(410, "link_revoked", "Dieser Buchungslink wurde deaktiviert.");
  }

  const rules = await loadSalonOnlineBookingRules(sql, link.salonId);
  if (!rules.enabled) {
    throw new BookingError(
      403,
      "online_disabled",
      "Online-Buchungen sind für diesen Salon derzeit deaktiviert.",
    );
  }

  // Load active staff assigned to salon and bookable online.
  const staffRows = await sql<{
    id: string;
    display_name: string;
    color: string;
    sort_order: number;
    bookable_online: boolean;
  }[]>`
    SELECT s.id, s.display_name, s.color, COALESCE(s.sort_order, 0) AS sort_order,
           COALESCE(s.bookable_online, true) AS bookable_online
    FROM staff s
    JOIN staff_salon_assignments a ON a.staff_id = s.id AND a.salon_id = ${link.salonId} AND a.active = true
    WHERE s.active = true
      AND COALESCE(s.bookable_online, true) = true
      AND s.display_name NOT LIKE 'Archiv %'
    ORDER BY COALESCE(s.sort_order, 0) ASC, s.display_name ASC
  `;

  const allowedStaffRows = link.allStaff
    ? staffRows
    : staffRows.filter((s) => link.staffIds.includes(s.id));

  const allowedStaffIds = new Set(allowedStaffRows.map((s) => s.id));

  // Load active salon services.
  const svcRows = await sql<{
    id: string;
    name: string;
    category_id: string | null;
    category_name: string | null;
    category_color: string | null;
    duration_minutes: number;
    price_cents: number;
  }[]>`
    SELECT
      sv.id,
      sv.name,
      sv.category_id,
      COALESCE(sc.name, 'Allgemein') AS category_name,
      COALESCE(sc.color, '#f28b82') AS category_color,
      ss.duration_minutes,
      ss.price_cents
    FROM salon_services ss
    JOIN services sv ON sv.id = ss.service_id
    LEFT JOIN service_categories sc ON sc.id = sv.category_id
    WHERE ss.salon_id = ${link.salonId}
      AND ss.active = true
      AND sv.active = true
    ORDER BY COALESCE(sc.sort_order, 0) ASC, sv.name ASC
  `;

  const filteredSvcRows = link.allServices
    ? svcRows
    : svcRows.filter((sv) => link.serviceIds.includes(sv.id));

  const eligRows = await sql<{ staff_id: string; service_id: string }[]>`
    SELECT ss.staff_id, ss.service_id
    FROM staff_services ss
    JOIN staff_salon_assignments a ON a.staff_id = ss.staff_id AND a.salon_id = ${link.salonId} AND a.active = true
  `;

  const eligByService = new Map<string, string[]>();
  const eligByStaff = new Map<string, string[]>();
  for (const row of eligRows) {
    if (!allowedStaffIds.has(row.staff_id)) continue;
    const listSvc = eligByService.get(row.service_id) ?? [];
    listSvc.push(row.staff_id);
    eligByService.set(row.service_id, listSvc);

    const listStaff = eligByStaff.get(row.staff_id) ?? [];
    listStaff.push(row.service_id);
    eligByStaff.set(row.staff_id, listStaff);
  }

  const topSet = new Set(rules.topServiceIds);
  const services: PublicServiceOption[] = filteredSvcRows
    .map((sv) => ({
      id: sv.id,
      name: sv.name,
      categoryId: sv.category_id,
      categoryName: sv.category_name ?? "Allgemein",
      categoryColor: sv.category_color ?? "#f28b82",
      durationMinutes: sv.duration_minutes,
      priceCents: sv.price_cents,
      eligibleStaffIds: eligByService.get(sv.id) ?? [],
      highlighted: rules.highlightTopServices && topSet.has(sv.id),
    }))
    // Only expose services that at least one allowed employee can perform.
    .filter((sv) => sv.eligibleStaffIds.length > 0);

  const validServiceIds = new Set(services.map((sv) => sv.id));
  const staff: PublicStaffOption[] = allowedStaffRows
    .map((st) => ({
      id: st.id,
      displayName: st.display_name,
      color: st.color,
      sortOrder: st.sort_order,
      serviceIds: (eligByStaff.get(st.id) ?? []).filter((id) => validServiceIds.has(id)),
    }))
    .filter((st) => st.serviceIds.length > 0);

  return { link, rules, services, staff };
}

export type PublicAvailableSlot = {
  start: string;
  end: string;
  startMinute: number;
  endMinute: number;
  availableStaffIds: string[];
};

export async function computePublicAvailableSlots(
  sql: Db,
  input: {
    token: string;
    date: string;
    serviceId: string;
    staffId?: string | null;
    now?: Date;
  },
): Promise<{
  date: string;
  intervalMinutes: number;
  durationMinutes: number;
  slots: PublicAvailableSlot[];
}> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new BookingError(422, "invalid_date", "Ungültiges Datum.");
  }

  const { link, rules, services, staff } = await resolvePublicBookingCatalog(sql, input.token);

  const service = services.find((sv) => sv.id === input.serviceId);
  if (!service) {
    throw new BookingError(
      422,
      "service_not_allowed",
      "Diese Leistung ist über diesen Buchungslink nicht buchbar.",
    );
  }

  let candidateStaff = staff.filter((st) => service.eligibleStaffIds.includes(st.id));
  if (input.staffId && input.staffId !== "any") {
    const chosen = candidateStaff.find((st) => st.id === input.staffId);
    if (!chosen) {
      throw new BookingError(
        422,
        "staff_not_allowed",
        "Diese Mitarbeiterin ist für die gewählte Leistung oder diesen Link nicht verfügbar.",
      );
    }
    candidateStaff = [chosen];
  } else if (rules.allowStaffChoice && rules.staffChoiceRequired) {
    throw new BookingError(422, "staff_required", "Bitte wählen Sie eine Mitarbeiterin aus.");
  }

  const now = input.now ?? new Date();
  const todayStr = berlinTodayStr(now);
  const maxDateStr = addMonthsIso(todayStr, rules.advanceMonths || 12);
  if (input.date < todayStr) {
    return {
      date: input.date,
      intervalMinutes: rules.intervalMinutes,
      durationMinutes: service.durationMinutes,
      slots: [],
    };
  }
  if (input.date > maxDateStr) {
    throw new BookingError(
      422,
      "advance_horizon",
      `Termine können maximal ${rules.advanceMonths} Monate im Voraus gebucht werden.`,
    );
  }

  const weekday = isoWeekday(zonedDateTimeToUtc(input.date, "12:00"));
  const bounds = dayBounds(input.date);
  const candidateIds = candidateStaff.map((s) => s.id);
  if (candidateIds.length === 0) {
    return {
      date: input.date,
      intervalMinutes: rules.intervalMinutes,
      durationMinutes: service.durationMinutes,
      slots: [],
    };
  }

  const shifts = await sql<{
    staff_id: string;
    start_minute: number;
    end_minute: number;
  }[]>`
    SELECT staff_id, start_minute, end_minute
    FROM weekly_shifts
    WHERE salon_id = ${link.salonId}
      AND iso_weekday = ${weekday}
      AND staff_id = ANY(${candidateIds})
  `;

  // Cross-salon resource allocations so shared staff cannot be double-booked.
  const allocations = await sql<{
    staff_id: string;
    start_at: Date;
    end_at: Date;
  }[]>`
    SELECT r.staff_id, ra.start_at, ra.end_at
    FROM resource_allocations ra
    JOIN resources r ON r.id = ra.resource_id
    WHERE ra.active = true
      AND r.staff_id = ANY(${candidateIds})
      AND ra.start_at < ${bounds.end}
      AND ra.end_at > ${bounds.start}
  `;

  const absences = await sql<{
    staff_id: string;
    starts_at: Date;
    ends_at: Date;
  }[]>`
    SELECT staff_id, starts_at, ends_at
    FROM absences
    WHERE staff_id = ANY(${candidateIds})
      AND starts_at < ${bounds.end}
      AND ends_at > ${bounds.start}
  `;

  const step = Math.max(15, Math.min(120, rules.intervalMinutes || 60));
  const duration = service.durationMinutes;
  const minStartInstantMs = now.getTime() + (rules.minNoticeMinutes || 0) * 60_000;

  const slots: PublicAvailableSlot[] = [];
  for (let startMin = 8 * 60; startMin + duration <= 20 * 60; startMin += step) {
    const endMin = startMin + duration;
    const startLabel = formatMinutesLabel(startMin);
    const endLabel = formatMinutesLabel(endMin);

    let slotStartUtc: Date;
    let slotEndUtc: Date;
    try {
      slotStartUtc = zonedDateTimeToUtc(input.date, startLabel);
      slotEndUtc = zonedDateTimeToUtc(input.date, endLabel);
    } catch {
      continue;
    }

    if (slotStartUtc.getTime() < minStartInstantMs) {
      continue;
    }

    const freeStaffIds: string[] = [];
    for (const member of candidateStaff) {
      const memberShifts = shifts.filter((sh) => sh.staff_id === member.id);
      const insideShift = memberShifts.some(
        (sh) => startMin >= sh.start_minute && endMin <= sh.end_minute,
      );
      if (!insideShift) continue;

      const hasAbsence = absences.some(
        (ab) =>
          ab.staff_id === member.id &&
          ab.starts_at < slotEndUtc &&
          ab.ends_at > slotStartUtc,
      );
      if (hasAbsence) continue;

      const hasAlloc = allocations.some(
        (al) =>
          al.staff_id === member.id &&
          al.start_at < slotEndUtc &&
          al.end_at > slotStartUtc,
      );
      if (hasAlloc) continue;

      // Optional gap-prevention: prefer slots adjacent to shift bounds or an existing allocation.
      if (rules.preventGaps) {
        const memberAllocs = allocations.filter((al) => al.staff_id === member.id);
        if (memberAllocs.length > 0) {
          const touchesShiftEdge = memberShifts.some(
            (sh) => startMin === sh.start_minute || endMin === sh.end_minute,
          );
          const touchesAllocation = memberAllocs.some((al) => {
            const alStart = minutesOfDay(al.start_at);
            const alEnd = minutesOfDay(al.end_at);
            return startMin === alEnd || endMin === alStart;
          });
          if (!touchesShiftEdge && !touchesAllocation) continue;
        }
      }

      freeStaffIds.push(member.id);
    }

    if (freeStaffIds.length > 0) {
      slots.push({
        start: startLabel,
        end: endLabel,
        startMinute: startMin,
        endMinute: endMin,
        availableStaffIds: freeStaffIds,
      });
    }
  }

  return {
    date: input.date,
    intervalMinutes: step,
    durationMinutes: duration,
    slots,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").slice(0, 32);
}

export async function joinPublicWaitlist(
  sql: Db,
  input: {
    token: string;
    serviceId: string;
    staffId?: string | null;
    date: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes?: string;
    privacyAccepted: boolean;
  },
): Promise<{ id: string }> {
  if (!input.privacyAccepted) {
    throw new BookingError(422, "privacy_required", "Bitte bestätigen Sie die Datenschutzhinweise.");
  }
  const { link, rules, services, staff } = await resolvePublicBookingCatalog(sql, input.token);
  if (!rules.allowWaitlist) {
    throw new BookingError(403, "waitlist_closed", "Die Warteliste ist für Online-Buchungen geschlossen.");
  }
  const service = services.find((item) => item.id === input.serviceId);
  if (!service) {
    throw new BookingError(422, "service_not_allowed", "Diese Leistung ist über diesen Link nicht verfügbar.");
  }
  const member =
    input.staffId && input.staffId !== "any"
      ? staff.find((item) => item.id === input.staffId)
      : undefined;
  const id = `wait_${randomUUID()}`;
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  await sql`
    INSERT INTO waiting_list_entries (
      id, salon_id, customer_name, service_id, service_name,
      duration_minutes, staff_id, staff_name, date_mode, preferred_date, note, notification_sent
    ) VALUES (
      ${id},
      ${link.salonId},
      ${name},
      ${service.id},
      ${service.name},
      ${service.durationMinutes},
      ${member?.id ?? null},
      ${member?.displayName ?? "Keine Präferenz"},
      'specific_date',
      ${input.date},
      ${input.notes?.trim() || `Online-Warteliste ${input.email.trim()}`},
      false
    )
  `;
  return { id };
}

export async function submitPublicBooking(
  sql: Db,
  input: {
    token: string;
    serviceId: string;
    staffId?: string | null;
    date: string;
    start: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine?: string;
    postalCode?: string;
    city?: string;
    birthDate?: string;
    notes?: string;
    discountCode?: string;
    newsletterOptIn?: boolean;
    privacyAccepted: boolean;
    idempotencyKey?: string;
    now?: Date;
  },
): Promise<{
  mode: "confirmed" | "request";
  referenceCode: string;
  appointmentId: string | null;
  requestId: string | null;
  salonName: string;
  serviceName: string;
  staffName: string;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  priceCents: number;
}> {
  if (!input.privacyAccepted) {
    throw new BookingError(
      422,
      "privacy_required",
      "Bitte bestätigen Sie die Datenschutzhinweise.",
    );
  }
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const displayName = `${firstName} ${lastName}`.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone.trim());
  if (!firstName || !lastName || !email || !phone) {
    throw new BookingError(
      422,
      "customer_fields",
      "Vorname, Nachname, E-Mail und Telefonnummer sind erforderlich.",
    );
  }

  const { link, rules, services, staff } = await resolvePublicBookingCatalog(sql, input.token);

  const service = services.find((sv) => sv.id === input.serviceId);
  if (!service) {
    throw new BookingError(
      422,
      "service_not_allowed",
      "Diese Leistung ist über diesen Buchungslink nicht verfügbar.",
    );
  }

  const availability = await computePublicAvailableSlots(sql, {
    token: input.token,
    date: input.date,
    serviceId: input.serviceId,
    staffId: input.staffId,
    now: input.now,
  });

  const matchingSlot = availability.slots.find((sl) => sl.start === input.start);
  if (!matchingSlot || matchingSlot.availableStaffIds.length === 0) {
    throw new BookingError(
      409,
      "conflict",
      "Dieser Zeitpunkt ist leider nicht mehr verfügbar. Bitte wählen Sie eine andere Uhrzeit.",
    );
  }

  let chosenStaffId =
    input.staffId && input.staffId !== "any"
      ? matchingSlot.availableStaffIds.find((id) => id === input.staffId)
      : undefined;
  if (!chosenStaffId && (!input.staffId || input.staffId === "any")) {
    if (rules.assignInOrder) {
      chosenStaffId = matchingSlot.availableStaffIds[0];
    } else {
      const counts = await sql<{ staff_id: string; n: number }[]>`
        SELECT r.staff_id, count(*)::int AS n
        FROM resource_allocations ra
        JOIN resources r ON r.id = ra.resource_id
        WHERE ra.active = true
          AND r.staff_id = ANY(${matchingSlot.availableStaffIds})
          AND ra.start_at >= ${zonedDateTimeToUtc(input.date, "08:00")}
          AND ra.start_at < ${zonedDateTimeToUtc(input.date, "20:00")}
        GROUP BY r.staff_id
      `;
      const load = new Map(counts.map((row) => [row.staff_id, row.n]));
      chosenStaffId = [...matchingSlot.availableStaffIds].sort(
        (a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0),
      )[0];
    }
  }

  if (!chosenStaffId) {
    throw new BookingError(
      409,
      "conflict",
      "Die gewählte Mitarbeiterin ist zu dieser Uhrzeit nicht mehr verfügbar.",
    );
  }

  const chosenStaff = staff.find((st) => st.id === chosenStaffId);
  if (!chosenStaff) {
    throw new BookingError(422, "staff_not_allowed", "Mitarbeiterin nicht verfügbar.");
  }

  // Match or create customer inside the salon without leaking whether a customer existed.
  const existingCustomer = await sql<{ id: string }[]>`
    SELECT id FROM customers
    WHERE home_salon_id = ${link.salonId}
      AND (
        (email IS NOT NULL AND lower(email) = ${email})
        OR (phone_normalized IS NOT NULL AND phone_normalized = ${phone})
      )
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (rules.customerScope === "existing" && !existingCustomer[0]) {
    throw new BookingError(
      403,
      "existing_customers_only",
      "Online-Buchungen sind derzeit nur für registrierte Bestandskundinnen freigeschaltet.",
    );
  }

  const birthDate =
    input.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) ? input.birthDate : null;
  let customerId = existingCustomer[0]?.id;
  if (!customerId) {
    customerId = `cust_${randomUUID()}`;
    await sql`
      INSERT INTO customers (
        id, home_salon_id, display_name, first_name, last_name,
        email, phone_normalized, address_line, postal_code, city, birth_date, newsletter_opt_in
      ) VALUES (
        ${customerId},
        ${link.salonId},
        ${displayName},
        ${firstName},
        ${lastName},
        ${email},
        ${phone},
        ${input.addressLine?.trim() || null},
        ${input.postalCode?.trim() || null},
        ${input.city?.trim() || null},
        ${birthDate},
        ${Boolean(input.newsletterOptIn)}
      )
    `;
  } else if (input.newsletterOptIn || birthDate) {
    await sql`
      UPDATE customers
      SET newsletter_opt_in = newsletter_opt_in OR ${Boolean(input.newsletterOptIn)},
          birth_date = COALESCE(${birthDate}, birth_date)
      WHERE id = ${customerId} AND home_salon_id = ${link.salonId}
    `;
  }

  // Pick a valid salon actor for audit foreign key.
  const actorRows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM user_salon_roles
    WHERE salon_id = ${link.salonId}
    ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END
    LIMIT 1
  `;
  const actorUserId = actorRows[0]?.user_id ?? "user_owner";
  const slotStart = zonedDateTimeToUtc(input.date, input.start);
  const quoted = await quoteOnlineServicePrice(sql, {
    salonId: link.salonId,
    catalogCents: service.priceCents,
    slotStart,
    slotDate: input.date,
    discountCode: input.discountCode,
  });
  const priceNote = quoted.labels.length ? ` [${quoted.labels.join(", ")}]` : "";

  // Booking request mode: store explicit pending request without claiming a confirmed slot.
  if (rules.bookingOption === "requests") {
    const requestId = `pbr_${randomUUID()}`;
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO public_booking_requests (
          id, salon_id, link_id, customer_id, service_id, staff_id,
          requested_date, requested_start, notes, status
        ) VALUES (
          ${requestId},
          ${link.salonId},
          ${link.id},
          ${customerId!},
          ${service.id},
          ${chosenStaff.id},
          ${input.date},
          ${input.start},
          ${`${input.notes?.trim() || ""}${priceNote}`.trim() || null},
          'pending'
        )
      `;
      await recordOutbox(tx, link.salonId, requestId, "booking_request.created");
    });

    return {
      mode: "request",
      referenceCode: `ANF-${requestId.slice(-6).toUpperCase()}`,
      appointmentId: null,
      requestId,
      salonName: rules.salonName,
      serviceName: service.name,
      staffName: chosenStaff.displayName,
      date: input.date,
      start: matchingSlot.start,
      end: matchingSlot.end,
      durationMinutes: service.durationMinutes,
      priceCents: quoted.priceCents,
    };
  }

  // Direct booking mode: delegate to the sole authoritative Booking Engine.
  const notePrefix = `[Online-Buchung]${priceNote}`;
  const combinedNotes = input.notes?.trim()
    ? `${notePrefix} ${input.notes.trim()}`
    : notePrefix;

  if (quoted.codeId) {
    await sql`
      UPDATE discount_codes
      SET used_count = used_count + 1
      WHERE id = ${quoted.codeId} AND salon_id = ${link.salonId}
    `;
  }

  const created = await createAppointment(sql, actorUserId, {
    salonId: link.salonId,
    staffId: chosenStaff.id,
    customerId,
    serviceId: service.id,
    date: input.date,
    start: input.start,
    notes: combinedNotes,
    idempotencyKey: input.idempotencyKey,
    priceCentsOverride: quoted.priceCents,
  });

  const apptId = created.appointmentId ?? "";
  return {
    mode: "confirmed",
    referenceCode: `SF-${apptId.slice(-6).toUpperCase()}`,
    appointmentId: apptId,
    requestId: null,
    salonName: rules.salonName,
    serviceName: service.name,
    staffName: chosenStaff.displayName,
    date: input.date,
    start: matchingSlot.start,
    end: matchingSlot.end,
    durationMinutes: service.durationMinutes,
    priceCents: quoted.priceCents,
  };
}

export type PublicBookingRequestRecord = {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  requestedDate: string;
  requestedStart: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export async function listPublicBookingRequests(
  sql: Db,
  salonId: string,
): Promise<PublicBookingRequestRecord[]> {
  const rows = await sql<{
    id: string;
    salon_id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    service_id: string;
    service_name: string;
    staff_id: string;
    staff_name: string;
    requested_date: string;
    requested_start: string;
    notes: string | null;
    status: string;
    created_at: Date | string;
  }[]>`
    SELECT
      r.id,
      r.salon_id,
      r.customer_id,
      c.display_name AS customer_name,
      c.email AS customer_email,
      c.phone_normalized AS customer_phone,
      r.service_id,
      sv.name AS service_name,
      r.staff_id,
      st.display_name AS staff_name,
      r.requested_date,
      r.requested_start,
      r.notes,
      r.status,
      r.created_at
    FROM public_booking_requests r
    JOIN customers c ON c.id = r.customer_id
    JOIN services sv ON sv.id = r.service_id
    JOIN staff st ON st.id = r.staff_id
    WHERE r.salon_id = ${salonId}
    ORDER BY r.created_at DESC
    LIMIT 40
  `;
  return rows.map((row) => ({
    id: row.id,
    salonId: row.salon_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    staffId: row.staff_id,
    staffName: row.staff_name,
    requestedDate: row.requested_date,
    requestedStart: row.requested_start,
    notes: row.notes,
    status:
      row.status === "approved"
        ? "approved"
        : row.status === "rejected"
          ? "rejected"
          : "pending",
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function decidePublicBookingRequest(
  sql: Db,
  actorUserId: string,
  input: {
    salonId: string;
    requestId: string;
    decision: "approve" | "reject";
  },
): Promise<{ status: "approved" | "rejected"; appointmentId: string | null }> {
  const rows = await sql<{
    id: string;
    salon_id: string;
    customer_id: string;
    service_id: string;
    staff_id: string;
    requested_date: string;
    requested_start: string;
    notes: string | null;
    status: string;
  }[]>`
    SELECT id, salon_id, customer_id, service_id, staff_id, requested_date, requested_start, notes, status
    FROM public_booking_requests
    WHERE id = ${input.requestId} AND salon_id = ${input.salonId}
  `;
  const req = rows[0];
  if (!req) {
    throw new BookingError(404, "missing", "Buchungsanfrage nicht gefunden.");
  }
  if (req.status !== "pending") {
    throw new BookingError(409, "already_decided", "Diese Anfrage wurde bereits bearbeitet.");
  }

  if (input.decision === "reject") {
    await sql`
      UPDATE public_booking_requests
      SET status = 'rejected'
      WHERE id = ${req.id} AND salon_id = ${input.salonId}
    `;
    return { status: "rejected", appointmentId: null };
  }

  // Approve: book through the sole Booking Engine so GiST, shifts, absences, snapshots, and outbox apply.
  const servicePrice = await sql<{ price_cents: number }[]>`
    SELECT price_cents FROM salon_services
    WHERE salon_id = ${req.salon_id} AND service_id = ${req.service_id} AND active
    LIMIT 1
  `;
  const approvedQuote = servicePrice[0]
    ? await quoteOnlineServicePrice(sql, {
        salonId: req.salon_id,
        catalogCents: servicePrice[0].price_cents,
        slotStart: zonedDateTimeToUtc(req.requested_date, req.requested_start),
        slotDate: req.requested_date,
      })
    : null;
  const created = await createAppointment(sql, actorUserId, {
    salonId: req.salon_id,
    staffId: req.staff_id,
    customerId: req.customer_id,
    serviceId: req.service_id,
    date: req.requested_date,
    start: req.requested_start,
    notes: req.notes ? `[Online-Anfrage bestätigt] ${req.notes}` : "[Online-Anfrage bestätigt]",
    idempotencyKey: `approve_${req.id}`,
    priceCentsOverride: approvedQuote?.priceCents,
  });

  await sql`
    UPDATE public_booking_requests
    SET status = 'approved'
    WHERE id = ${req.id} AND salon_id = ${input.salonId}
  `;

  return { status: "approved", appointmentId: created.appointmentId ?? null };
}
