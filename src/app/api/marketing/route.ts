import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
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

const updateMarketingSettingsSchema = z.object({
  salonId: z.string().min(1),
  marketingFeatureEnabled: z.boolean().optional(),
  lastMinuteEnabled: z.boolean().optional(),
  lastMinutePercent: z.number().int().min(5).max(80).optional(),
  lastMinuteHours: z.number().int().min(1).max(72).optional(),
  dynamicPricingEnabled: z.boolean().optional(),
  rebookReminderEnabled: z.boolean().optional(),
  rebookReminderServiceIds: z.array(z.string()).optional(),
  waitingListEnabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    const period = url.searchParams.get("period") ?? "month";
    assertSalon(user, salonId);

    const sql = getSql();
    await sql`
      INSERT INTO salon_marketing_settings (salon_id)
      VALUES (${salonId})
      ON CONFLICT (salon_id) DO NOTHING
    `;

    const [marketingSettings] = await sql`
      SELECT
        salon_id AS "salonId",
        marketing_feature_enabled AS "marketingFeatureEnabled",
        last_minute_enabled AS "lastMinuteEnabled",
        last_minute_percent AS "lastMinutePercent",
        last_minute_hours AS "lastMinuteHours",
        dynamic_pricing_enabled AS "dynamicPricingEnabled",
        rebook_reminder_enabled AS "rebookReminderEnabled",
        rebook_reminder_service_ids AS "rebookReminderServiceIds",
        waiting_list_enabled AS "waitingListEnabled"
      FROM salon_marketing_settings
      WHERE salon_id = ${salonId}
    `;

    const discountCodes = await sql`
      SELECT
        id,
        salon_id AS "salonId",
        code,
        discount_type AS "discountType",
        percentage,
        valid_from::text AS "validFrom",
        expiration_mode AS "expirationMode",
        one_time_per_customer AS "oneTimePerCustomer",
        limit_total_uses AS "limitTotalUses",
        specific_services_only AS "specificServicesOnly",
        used_count AS "usedCount",
        enabled
      FROM discount_codes
      WHERE salon_id = ${salonId}
      ORDER BY created_at DESC, code ASC
    `;

    const priceChangeRows = await sql<{
      id: string;
      salon_id: string;
      change_type: "discount" | "increase";
      percentage: number;
      starts_at: Date;
      ends_at: Date;
      repeat_enabled: boolean;
      repeat_frequency: string;
    }[]>`
      SELECT
        id,
        salon_id,
        change_type,
        percentage,
        starts_at,
        ends_at,
        repeat_enabled,
        repeat_frequency
      FROM price_change_rules
      WHERE salon_id = ${salonId}
      ORDER BY starts_at ASC
    `;

    const waitingList = await sql`
      SELECT
        id,
        salon_id AS "salonId",
        customer_id AS "customerId",
        customer_name AS "customerName",
        service_id AS "serviceId",
        service_name AS "serviceName",
        duration_minutes AS "durationMinutes",
        staff_id AS "staffId",
        staff_name AS "staffName",
        date_mode AS "dateMode",
        preferred_date AS "preferredDate",
        note,
        notification_sent AS "notificationSent"
      FROM waiting_list_entries
      WHERE salon_id = ${salonId}
      ORDER BY created_at DESC
    `;

    const filterGroups = await sql`
      SELECT
        id,
        salon_id AS "salonId",
        name,
        filters_used AS "filtersUsed",
        criteria_label AS "criteriaLabel"
      FROM marketing_filter_groups
      WHERE salon_id = ${salonId}
      ORDER BY created_at ASC
    `;

    // Real database-backed metrics for Insights (no invented campaign numbers)
    const [bookingMetrics] = await sql<{
      total_bookings: number;
      repeat_customer_bookings: number;
    }[]>`
      SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (
          WHERE customer_id IN (
            SELECT customer_id
            FROM appointments
            WHERE salon_id = ${salonId} AND status <> 'cancelled' AND customer_id IS NOT NULL
            GROUP BY customer_id
            HAVING COUNT(*) >= 2
          )
        )::int AS repeat_customer_bookings
      FROM appointments
      WHERE salon_id = ${salonId}
        AND status <> 'cancelled'
    `;

    const totalDiscountUses = discountCodes.reduce(
      (sum, row) => sum + Number(row.usedCount ?? 0),
      0,
    );

    return Response.json({
      period,
      marketingSettings,
      insights: {
        totalBookings: Number(bookingMetrics?.total_bookings ?? 0),
        repeatCustomerBookings: Number(bookingMetrics?.repeat_customer_bookings ?? 0),
        totalDiscountCodeUses: totalDiscountUses,
        activeDiscountCodesCount: discountCodes.filter((d) => d.enabled).length,
        activePriceChangeRulesCount: priceChangeRows.length,
        waitingListSubscribersCount: waitingList.length,
        externalDeliveryDisabled: true,
      },
      discountCodes,
      priceChangeRules: priceChangeRows.map((rule) => ({
        id: rule.id,
        salonId: rule.salon_id,
        changeType: rule.change_type,
        percentage: rule.percentage,
        startDate: berlinDateStr(rule.starts_at),
        endDate: berlinDateStr(rule.ends_at),
        startMinute: minutesOfDay(rule.starts_at),
        endMinute: minutesOfDay(rule.ends_at),
        startsAt: rule.starts_at.toISOString(),
        endsAt: rule.ends_at.toISOString(),
        repeatEnabled: rule.repeat_enabled,
        repeatFrequency: rule.repeat_frequency,
      })),
      waitingList,
      filterGroups,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const parsed = updateMarketingSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Ungültige Marketing-Einstellungen.",
      );
    }
    const body = parsed.data;
    assertSalon(user, body.salonId);
    if (!canManageSalon(user, body.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Marketing-Einstellungen.");
    }

    const sql = getSql();
    await sql`
      INSERT INTO salon_marketing_settings (salon_id)
      VALUES (${body.salonId})
      ON CONFLICT (salon_id) DO NOTHING
    `;

    const [updated] = await sql`
      UPDATE salon_marketing_settings
      SET
        marketing_feature_enabled = COALESCE(${body.marketingFeatureEnabled ?? null}, marketing_feature_enabled),
        last_minute_enabled = COALESCE(${body.lastMinuteEnabled ?? null}, last_minute_enabled),
        last_minute_percent = COALESCE(${body.lastMinutePercent ?? null}, last_minute_percent),
        last_minute_hours = COALESCE(${body.lastMinuteHours ?? null}, last_minute_hours),
        dynamic_pricing_enabled = COALESCE(${body.dynamicPricingEnabled ?? null}, dynamic_pricing_enabled),
        rebook_reminder_enabled = COALESCE(${body.rebookReminderEnabled ?? null}, rebook_reminder_enabled),
        rebook_reminder_service_ids = COALESCE(${body.rebookReminderServiceIds ?? null}, rebook_reminder_service_ids),
        waiting_list_enabled = COALESCE(${body.waitingListEnabled ?? null}, waiting_list_enabled),
        updated_at = now()
      WHERE salon_id = ${body.salonId}
      RETURNING
        salon_id AS "salonId",
        marketing_feature_enabled AS "marketingFeatureEnabled",
        last_minute_enabled AS "lastMinuteEnabled",
        last_minute_percent AS "lastMinutePercent",
        last_minute_hours AS "lastMinuteHours",
        dynamic_pricing_enabled AS "dynamicPricingEnabled",
        rebook_reminder_enabled AS "rebookReminderEnabled",
        rebook_reminder_service_ids AS "rebookReminderServiceIds",
        waiting_list_enabled AS "waitingListEnabled"
    `;

    return Response.json({ marketingSettings: updated });
  } catch (error) {
    return apiError(error);
  }
}
