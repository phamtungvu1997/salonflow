import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const updateSettingsSchema = z.object({
  salonId: z.string().min(1),
  salonName: z.string().trim().min(2).max(160).optional(),
  language: z.string().trim().min(2).max(20).optional(),
  currency: z.string().trim().min(2).max(10).optional(),
  timeZone: z.string().trim().min(3).max(64).optional(),
  weekStart: z.enum(["monday", "sunday"]).optional(),
  timeFormat: z.enum(["24h", "12h"]).optional(),
  ipRestrictionEnabled: z.boolean().optional(),
  ipWhitelist: z.string().max(1000).optional(),
  postalCode: z.string().max(20).optional(),
  houseNumber: z.string().max(20).optional(),
  addressLine: z.string().max(160).optional(),
  city: z.string().max(120).optional(),
  phone: z.string().max(64).optional(),
  notificationEmail: z.string().max(160).optional(),
  billingEmail: z.string().max(160).optional(),
  smsSender: z.string().max(32).optional(),
  smsNotificationPhone: z.string().max(64).optional(),
  facebookHandle: z.string().max(120).optional(),
  instagramHandle: z.string().max(120).optional(),
  slotIntervalMinutes: z.number().int().min(5).max(60).optional(),
  appointmentColorMode: z.enum(["category", "employee"]).optional(),
  hideUnscheduledStaff: z.boolean().optional(),
  endBufferEnabled: z.boolean().optional(),
  allowOnlineCancel: z.boolean().optional(),
  onlineCancelLeadHours: z.number().int().min(0).max(168).optional(),
  allowOnlineReschedule: z.boolean().optional(),
  onlineRescheduleLeadHours: z.number().int().min(0).max(168).optional(),
  noShowEmailPrompt: z.boolean().optional(),
  emailReminderEnabled: z.boolean().optional(),
  emailReminderLeadHours: z.number().int().min(1).max(168).optional(),
  customerLabels: z.array(z.string().trim().min(1).max(64)).max(10).optional(),
  customFields: z.array(z.string().trim().min(1).max(64)).max(10).optional(),
  onlineBookingEnabled: z.boolean().optional(),
  onlineAllowStaffChoice: z.boolean().optional(),
  onlineShowPrice: z.boolean().optional(),
  onlineShowDuration: z.boolean().optional(),
  onlineIntervalMinutes: z.number().int().min(15).max(120).optional(),
  onlineAdvanceMonths: z.number().int().min(1).max(24).optional(),
  onlineWidgetColor: z.string().max(20).optional(),
  onlineWidgetLanguage: z.string().max(20).optional(),
  onlineBookingOption: z.enum(["bookings", "requests"]).optional(),
  onlineCustomerScope: z.enum(["all", "existing"]).optional(),
  onlineStaffChoiceRequired: z.boolean().optional(),
  onlineStaffFirstStep: z.boolean().optional(),
  onlineAssignInOrder: z.boolean().optional(),
  onlineAllowMultiService: z.boolean().optional(),
  onlineHighlightTopServices: z.boolean().optional(),
  onlineTopServiceIds: z.array(z.string().max(120)).max(9).optional(),
  onlineMinNoticeMinutes: z.number().int().min(0).max(10080).optional(),
  onlinePreventGaps: z.boolean().optional(),
  onlineAllowWaitlist: z.boolean().optional(),
  onlineRequestAddress: z.boolean().optional(),
  onlineRequestBirthDate: z.boolean().optional(),
  onlineAllowNewsletter: z.boolean().optional(),
  onlineShowTermsLink: z.boolean().optional(),
  onlineShowPrivacyLink: z.boolean().optional(),
  onlineScheduleView: z.enum(["week", "month_week"]).optional(),
  onlineAllowCheckAppointments: z.boolean().optional(),
  onlineShowCustomAlert: z.boolean().optional(),
  onlineCustomAlertText: z.string().max(300).optional(),
  onlineAnalyticsId: z.string().max(64).optional(),
  onlineShareMode: z.enum(["link", "button", "embed"]).optional(),
  onlineButtonPosition: z.enum(["right", "left"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);

    const sql = getSql();
    await sql`
      INSERT INTO salon_settings (salon_id)
      VALUES (${salonId})
      ON CONFLICT (salon_id) DO NOTHING
    `;

    const [salon] = await sql`
      SELECT id, name, city, time_zone AS "timeZone"
      FROM salons
      WHERE id = ${salonId}
    `;

    const [settings] = await sql`
      SELECT
        salon_id AS "salonId",
        language,
        currency,
        time_zone AS "timeZone",
        week_start AS "weekStart",
        time_format AS "timeFormat",
        ip_restriction_enabled AS "ipRestrictionEnabled",
        ip_whitelist AS "ipWhitelist",
        postal_code AS "postalCode",
        house_number AS "houseNumber",
        address_line AS "addressLine",
        city,
        phone,
        notification_email AS "notificationEmail",
        billing_email AS "billingEmail",
        sms_sender AS "smsSender",
        sms_notification_phone AS "smsNotificationPhone",
        facebook_handle AS "facebookHandle",
        instagram_handle AS "instagramHandle",
        slot_interval_minutes AS "slotIntervalMinutes",
        appointment_color_mode AS "appointmentColorMode",
        hide_unscheduled_staff AS "hideUnscheduledStaff",
        end_buffer_enabled AS "endBufferEnabled",
        allow_online_cancel AS "allowOnlineCancel",
        online_cancel_lead_hours AS "onlineCancelLeadHours",
        allow_online_reschedule AS "allowOnlineReschedule",
        online_reschedule_lead_hours AS "onlineRescheduleLeadHours",
        no_show_email_prompt AS "noShowEmailPrompt",
        email_reminder_enabled AS "emailReminderEnabled",
        email_reminder_lead_hours AS "emailReminderLeadHours",
        customer_labels AS "customerLabels",
        custom_fields AS "customFields",
        online_booking_enabled AS "onlineBookingEnabled",
        online_allow_staff_choice AS "onlineAllowStaffChoice",
        online_show_price AS "onlineShowPrice",
        online_show_duration AS "onlineShowDuration",
        online_interval_minutes AS "onlineIntervalMinutes",
        online_advance_months AS "onlineAdvanceMonths",
        online_widget_color AS "onlineWidgetColor",
        online_widget_language AS "onlineWidgetLanguage",
        online_booking_option AS "onlineBookingOption",
        online_customer_scope AS "onlineCustomerScope",
        online_staff_choice_required AS "onlineStaffChoiceRequired",
        online_staff_first_step AS "onlineStaffFirstStep",
        online_assign_in_order AS "onlineAssignInOrder",
        online_allow_multi_service AS "onlineAllowMultiService",
        online_highlight_top_services AS "onlineHighlightTopServices",
        online_top_service_ids AS "onlineTopServiceIds",
        online_min_notice_minutes AS "onlineMinNoticeMinutes",
        online_prevent_gaps AS "onlinePreventGaps",
        online_allow_waitlist AS "onlineAllowWaitlist",
        online_request_address AS "onlineRequestAddress",
        online_request_birth_date AS "onlineRequestBirthDate",
        online_allow_newsletter AS "onlineAllowNewsletter",
        online_show_terms_link AS "onlineShowTermsLink",
        online_show_privacy_link AS "onlineShowPrivacyLink",
        online_schedule_view AS "onlineScheduleView",
        online_allow_check_appointments AS "onlineAllowCheckAppointments",
        online_show_custom_alert AS "onlineShowCustomAlert",
        online_custom_alert_text AS "onlineCustomAlertText",
        online_analytics_id AS "onlineAnalyticsId",
        online_share_mode AS "onlineShareMode",
        online_button_position AS "onlineButtonPosition"
      FROM salon_settings
      WHERE salon_id = ${salonId}
    `;

    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM customers WHERE home_salon_id = ${salonId} OR home_salon_id IS NULL) AS "totalCustomers",
        (SELECT COUNT(*)::int FROM appointments WHERE salon_id = ${salonId} AND status != 'cancelled') AS "totalAppointments",
        (SELECT COUNT(*)::int FROM staff s JOIN staff_salon_assignments a ON a.staff_id = s.id WHERE a.salon_id = ${salonId} AND a.active = true AND s.active = true) AS "activeStaff",
        (SELECT COUNT(*)::int FROM salon_services ss JOIN services sv ON sv.id = ss.service_id WHERE ss.salon_id = ${salonId} AND ss.active = true AND sv.active = true) AS "activeServices"
    `;

    const userAccounts = await sql`
      SELECT
        u.id,
        u.email,
        u.display_name AS "displayName",
        u.status,
        r.role
      FROM users u
      JOIN user_salon_roles r ON r.user_id = u.id
      WHERE r.salon_id = ${salonId}
      ORDER BY
        CASE r.role WHEN 'owner' THEN 1 WHEN 'manager' THEN 2 WHEN 'receptionist' THEN 3 ELSE 4 END,
        u.display_name ASC
    `;

    const activityLogs = await sql`
      SELECT
        aa.id,
        aa.action,
        aa.created_at AS "createdAt",
        COALESCE(u.display_name, 'Inhaber (Jeannie/Juliet)') AS "userName",
        COALESCE(c.display_name, '-') AS "customerName"
      FROM appointment_audit aa
      LEFT JOIN appointments a ON a.id = aa.appointment_id
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN users u ON u.id = aa.actor_user_id
      WHERE a.salon_id = ${salonId} OR a.salon_id IS NULL
      ORDER BY aa.created_at DESC
      LIMIT 25
    `;

    const resources = await sql`
      SELECT
        r.id,
        r.resource_type AS "resourceType",
        r.staff_id AS "staffId",
        COALESCE(s.display_name, r.id) AS "displayName",
        r.active
      FROM resources r
      LEFT JOIN staff s ON s.id = r.staff_id
      WHERE r.active = true
      ORDER BY r.resource_type ASC, s.display_name ASC NULLS LAST
      LIMIT 30
    `;

    return Response.json({
      salon,
      settings,
      stats,
      userAccounts,
      activityLogs,
      resources,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const parsed = updateSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", parsed.error.issues[0]?.message ?? "Ungültige Einstellungen.");
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Salon-Einstellungen.");
    }

    const sql = getSql();
    await sql`
      INSERT INTO salon_settings (salon_id)
      VALUES (${body.salonId})
      ON CONFLICT (salon_id) DO NOTHING
    `;

    if (body.salonName || body.city || body.timeZone) {
      await sql`
        UPDATE salons
        SET
          name = COALESCE(${body.salonName ?? null}, name),
          city = COALESCE(${body.city ?? null}, city),
          time_zone = COALESCE(${body.timeZone ?? null}, time_zone)
        WHERE id = ${body.salonId}
      `;
    }

    const [updated] = await sql`
      UPDATE salon_settings
      SET
        language = COALESCE(${body.language ?? null}, language),
        currency = COALESCE(${body.currency ?? null}, currency),
        time_zone = COALESCE(${body.timeZone ?? null}, time_zone),
        week_start = COALESCE(${body.weekStart ?? null}, week_start),
        time_format = COALESCE(${body.timeFormat ?? null}, time_format),
        ip_restriction_enabled = COALESCE(${body.ipRestrictionEnabled ?? null}, ip_restriction_enabled),
        ip_whitelist = COALESCE(${body.ipWhitelist ?? null}, ip_whitelist),
        postal_code = COALESCE(${body.postalCode ?? null}, postal_code),
        house_number = COALESCE(${body.houseNumber ?? null}, house_number),
        address_line = COALESCE(${body.addressLine ?? null}, address_line),
        city = COALESCE(${body.city ?? null}, city),
        phone = COALESCE(${body.phone ?? null}, phone),
        notification_email = COALESCE(${body.notificationEmail ?? null}, notification_email),
        billing_email = COALESCE(${body.billingEmail ?? null}, billing_email),
        sms_sender = COALESCE(${body.smsSender ?? null}, sms_sender),
        sms_notification_phone = COALESCE(${body.smsNotificationPhone ?? null}, sms_notification_phone),
        facebook_handle = COALESCE(${body.facebookHandle ?? null}, facebook_handle),
        instagram_handle = COALESCE(${body.instagramHandle ?? null}, instagram_handle),
        slot_interval_minutes = COALESCE(${body.slotIntervalMinutes ?? null}, slot_interval_minutes),
        appointment_color_mode = COALESCE(${body.appointmentColorMode ?? null}, appointment_color_mode),
        hide_unscheduled_staff = COALESCE(${body.hideUnscheduledStaff ?? null}, hide_unscheduled_staff),
        end_buffer_enabled = COALESCE(${body.endBufferEnabled ?? null}, end_buffer_enabled),
        allow_online_cancel = COALESCE(${body.allowOnlineCancel ?? null}, allow_online_cancel),
        online_cancel_lead_hours = COALESCE(${body.onlineCancelLeadHours ?? null}, online_cancel_lead_hours),
        allow_online_reschedule = COALESCE(${body.allowOnlineReschedule ?? null}, allow_online_reschedule),
        online_reschedule_lead_hours = COALESCE(${body.onlineRescheduleLeadHours ?? null}, online_reschedule_lead_hours),
        no_show_email_prompt = COALESCE(${body.noShowEmailPrompt ?? null}, no_show_email_prompt),
        email_reminder_enabled = COALESCE(${body.emailReminderEnabled ?? null}, email_reminder_enabled),
        email_reminder_lead_hours = COALESCE(${body.emailReminderLeadHours ?? null}, email_reminder_lead_hours),
        customer_labels = COALESCE(${body.customerLabels ?? null}, customer_labels),
        custom_fields = COALESCE(${body.customFields ?? null}, custom_fields),
        online_booking_enabled = COALESCE(${body.onlineBookingEnabled ?? null}, online_booking_enabled),
        online_allow_staff_choice = COALESCE(${body.onlineAllowStaffChoice ?? null}, online_allow_staff_choice),
        online_show_price = COALESCE(${body.onlineShowPrice ?? null}, online_show_price),
        online_show_duration = COALESCE(${body.onlineShowDuration ?? null}, online_show_duration),
        online_interval_minutes = COALESCE(${body.onlineIntervalMinutes ?? null}, online_interval_minutes),
        online_advance_months = COALESCE(${body.onlineAdvanceMonths ?? null}, online_advance_months),
        online_widget_color = COALESCE(${body.onlineWidgetColor ?? null}, online_widget_color),
        online_widget_language = COALESCE(${body.onlineWidgetLanguage ?? null}, online_widget_language),
        online_booking_option = COALESCE(${body.onlineBookingOption ?? null}, online_booking_option),
        online_customer_scope = COALESCE(${body.onlineCustomerScope ?? null}, online_customer_scope),
        online_staff_choice_required = COALESCE(${body.onlineStaffChoiceRequired ?? null}, online_staff_choice_required),
        online_staff_first_step = COALESCE(${body.onlineStaffFirstStep ?? null}, online_staff_first_step),
        online_assign_in_order = COALESCE(${body.onlineAssignInOrder ?? null}, online_assign_in_order),
        online_allow_multi_service = COALESCE(${body.onlineAllowMultiService ?? null}, online_allow_multi_service),
        online_highlight_top_services = COALESCE(${body.onlineHighlightTopServices ?? null}, online_highlight_top_services),
        online_top_service_ids = COALESCE(${body.onlineTopServiceIds ?? null}, online_top_service_ids),
        online_min_notice_minutes = COALESCE(${body.onlineMinNoticeMinutes ?? null}, online_min_notice_minutes),
        online_prevent_gaps = COALESCE(${body.onlinePreventGaps ?? null}, online_prevent_gaps),
        online_allow_waitlist = COALESCE(${body.onlineAllowWaitlist ?? null}, online_allow_waitlist),
        online_request_address = COALESCE(${body.onlineRequestAddress ?? null}, online_request_address),
        online_request_birth_date = COALESCE(${body.onlineRequestBirthDate ?? null}, online_request_birth_date),
        online_allow_newsletter = COALESCE(${body.onlineAllowNewsletter ?? null}, online_allow_newsletter),
        online_show_terms_link = COALESCE(${body.onlineShowTermsLink ?? null}, online_show_terms_link),
        online_show_privacy_link = COALESCE(${body.onlineShowPrivacyLink ?? null}, online_show_privacy_link),
        online_schedule_view = COALESCE(${body.onlineScheduleView ?? null}, online_schedule_view),
        online_allow_check_appointments = COALESCE(${body.onlineAllowCheckAppointments ?? null}, online_allow_check_appointments),
        online_show_custom_alert = COALESCE(${body.onlineShowCustomAlert ?? null}, online_show_custom_alert),
        online_custom_alert_text = COALESCE(${body.onlineCustomAlertText ?? null}, online_custom_alert_text),
        online_analytics_id = COALESCE(${body.onlineAnalyticsId ?? null}, online_analytics_id),
        online_share_mode = COALESCE(${body.onlineShareMode ?? null}, online_share_mode),
        online_button_position = COALESCE(${body.onlineButtonPosition ?? null}, online_button_position),
        updated_at = now()
      WHERE salon_id = ${body.salonId}
      RETURNING
        salon_id AS "salonId",
        language,
        currency,
        time_zone AS "timeZone",
        week_start AS "weekStart",
        time_format AS "timeFormat",
        ip_restriction_enabled AS "ipRestrictionEnabled",
        ip_whitelist AS "ipWhitelist",
        postal_code AS "postalCode",
        house_number AS "houseNumber",
        address_line AS "addressLine",
        city,
        phone,
        notification_email AS "notificationEmail",
        billing_email AS "billingEmail",
        sms_sender AS "smsSender",
        sms_notification_phone AS "smsNotificationPhone",
        facebook_handle AS "facebookHandle",
        instagram_handle AS "instagramHandle",
        slot_interval_minutes AS "slotIntervalMinutes",
        appointment_color_mode AS "appointmentColorMode",
        hide_unscheduled_staff AS "hideUnscheduledStaff",
        end_buffer_enabled AS "endBufferEnabled",
        allow_online_cancel AS "allowOnlineCancel",
        online_cancel_lead_hours AS "onlineCancelLeadHours",
        allow_online_reschedule AS "allowOnlineReschedule",
        online_reschedule_lead_hours AS "onlineRescheduleLeadHours",
        no_show_email_prompt AS "noShowEmailPrompt",
        email_reminder_enabled AS "emailReminderEnabled",
        email_reminder_lead_hours AS "emailReminderLeadHours",
        customer_labels AS "customerLabels",
        custom_fields AS "customFields",
        online_booking_enabled AS "onlineBookingEnabled",
        online_allow_staff_choice AS "onlineAllowStaffChoice",
        online_show_price AS "onlineShowPrice",
        online_show_duration AS "onlineShowDuration",
        online_interval_minutes AS "onlineIntervalMinutes",
        online_advance_months AS "onlineAdvanceMonths",
        online_widget_color AS "onlineWidgetColor",
        online_widget_language AS "onlineWidgetLanguage",
        online_booking_option AS "onlineBookingOption",
        online_customer_scope AS "onlineCustomerScope",
        online_staff_choice_required AS "onlineStaffChoiceRequired",
        online_staff_first_step AS "onlineStaffFirstStep",
        online_assign_in_order AS "onlineAssignInOrder",
        online_allow_multi_service AS "onlineAllowMultiService",
        online_highlight_top_services AS "onlineHighlightTopServices",
        online_top_service_ids AS "onlineTopServiceIds",
        online_min_notice_minutes AS "onlineMinNoticeMinutes",
        online_prevent_gaps AS "onlinePreventGaps",
        online_allow_waitlist AS "onlineAllowWaitlist",
        online_request_address AS "onlineRequestAddress",
        online_request_birth_date AS "onlineRequestBirthDate",
        online_allow_newsletter AS "onlineAllowNewsletter",
        online_show_terms_link AS "onlineShowTermsLink",
        online_show_privacy_link AS "onlineShowPrivacyLink",
        online_schedule_view AS "onlineScheduleView",
        online_allow_check_appointments AS "onlineAllowCheckAppointments",
        online_show_custom_alert AS "onlineShowCustomAlert",
        online_custom_alert_text AS "onlineCustomAlertText",
        online_analytics_id AS "onlineAnalyticsId",
        online_share_mode AS "onlineShareMode",
        online_button_position AS "onlineButtonPosition"
    `;

    return Response.json({ settings: updated });
  } catch (error) {
    return apiError(error);
  }
}
