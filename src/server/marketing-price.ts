import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

export type PriceAdjustmentKind = "catalog" | "dynamic" | "last_minute" | "discount_code";

export type MarketingPriceSettings = {
  lastMinuteEnabled: boolean;
  lastMinutePercent: number;
  lastMinuteHours: number;
  dynamicPricingEnabled: boolean;
};

export type PriceWindow = {
  changeType: "discount" | "increase";
  percentage: number;
  startsAt: Date;
  endsAt: Date;
};

export type DiscountCodeRule = {
  percentage: number;
  enabled: boolean;
  validFrom: string;
  expirationMode: "never" | "1_month" | "3_months" | "date";
  limitTotalUses: boolean;
  usedCount: number;
};

export type QuotedPrice = {
  catalogCents: number;
  priceCents: number;
  labels: string[];
};

export function applyPercent(
  cents: number,
  percentage: number,
  direction: "discount" | "increase",
): number {
  const delta = Math.round((cents * percentage) / 100);
  const next = direction === "discount" ? cents - delta : cents + delta;
  return Math.max(0, next);
}

export function codeStillValid(code: DiscountCodeRule, onDate: string): boolean {
  if (!code.enabled) return false;
  if (code.validFrom && onDate < code.validFrom.slice(0, 10)) return false;
  if (code.limitTotalUses && code.usedCount >= 1) return false;
  if (code.expirationMode === "never" || code.expirationMode === "date") return true;
  const [year, month, day] = code.validFrom.slice(0, 10).split("-").map(Number);
  const expires = new Date(Date.UTC(year, month - 1, day));
  expires.setUTCMonth(expires.getUTCMonth() + (code.expirationMode === "1_month" ? 1 : 3));
  const expiry = expires.toISOString().slice(0, 10);
  return onDate <= expiry;
}

export function quotePrice(input: {
  catalogCents: number;
  slotStart: Date;
  now: Date;
  settings: MarketingPriceSettings;
  windows: PriceWindow[];
  code?: DiscountCodeRule | null;
  slotDate: string;
}): QuotedPrice {
  let price = input.catalogCents;
  const labels: string[] = [];
  const window = input.settings.dynamicPricingEnabled
    ? input.windows.find(
        (rule) => input.slotStart >= rule.startsAt && input.slotStart < rule.endsAt,
      )
    : undefined;
  if (window) {
    price = applyPercent(price, window.percentage, window.changeType);
    labels.push(
      window.changeType === "discount"
        ? `Zeitfenster −${window.percentage}%`
        : `Zeitfenster +${window.percentage}%`,
    );
  } else if (input.settings.lastMinuteEnabled) {
    const hours = (input.slotStart.getTime() - input.now.getTime()) / 3_600_000;
    if (hours >= 0 && hours <= input.settings.lastMinuteHours) {
      price = applyPercent(price, input.settings.lastMinutePercent, "discount");
      labels.push(`Last-Minute −${input.settings.lastMinutePercent}%`);
    }
  }
  if (input.code && codeStillValid(input.code, input.slotDate)) {
    price = applyPercent(price, input.code.percentage, "discount");
    labels.push(`Rabattcode −${input.code.percentage}%`);
  }
  return { catalogCents: input.catalogCents, priceCents: price, labels };
}

export async function quoteOnlineServicePrice(
  sql: Db,
  input: {
    salonId: string;
    catalogCents: number;
    slotStart: Date;
    slotDate: string;
    discountCode?: string;
    now?: Date;
  },
): Promise<QuotedPrice & { codeId: string | null }> {
  const now = input.now ?? new Date();
  const [settings] = await sql<{
    last_minute_enabled: boolean;
    last_minute_percent: number;
    last_minute_hours: number;
    dynamic_pricing_enabled: boolean;
  }[]>`
    SELECT last_minute_enabled, last_minute_percent, last_minute_hours, dynamic_pricing_enabled
    FROM salon_marketing_settings
    WHERE salon_id = ${input.salonId}
  `;
  const windows = await sql<{
    change_type: "discount" | "increase";
    percentage: number;
    starts_at: Date;
    ends_at: Date;
  }[]>`
    SELECT change_type, percentage, starts_at, ends_at
    FROM price_change_rules
    WHERE salon_id = ${input.salonId}
      AND starts_at <= ${input.slotStart}
      AND ends_at > ${input.slotStart}
  `;
  let code: DiscountCodeRule | null = null;
  let codeId: string | null = null;
  const rawCode = input.discountCode?.trim();
  if (rawCode) {
    const [row] = await sql<{
      id: string;
      percentage: number;
      enabled: boolean;
      valid_from: string;
      expiration_mode: DiscountCodeRule["expirationMode"];
      limit_total_uses: boolean;
      used_count: number;
    }[]>`
      SELECT id, percentage, enabled, valid_from::text AS valid_from, expiration_mode,
             limit_total_uses, used_count
      FROM discount_codes
      WHERE salon_id = ${input.salonId} AND upper(code) = upper(${rawCode})
      LIMIT 1
    `;
    if (!row || !codeStillValid(
      {
        percentage: row.percentage,
        enabled: row.enabled,
        validFrom: row.valid_from,
        expirationMode: row.expiration_mode,
        limitTotalUses: row.limit_total_uses,
        usedCount: row.used_count,
      },
      input.slotDate,
    )) {
      throw new BookingError(422, "discount_code", "Dieser Rabattcode ist nicht gültig.");
    }
    code = {
      percentage: row.percentage,
      enabled: row.enabled,
      validFrom: row.valid_from,
      expirationMode: row.expiration_mode,
      limitTotalUses: row.limit_total_uses,
      usedCount: row.used_count,
    };
    codeId = row.id;
  }
  const quoted = quotePrice({
    catalogCents: input.catalogCents,
    slotStart: input.slotStart,
    now,
    settings: {
      lastMinuteEnabled: settings?.last_minute_enabled ?? false,
      lastMinutePercent: settings?.last_minute_percent ?? 0,
      lastMinuteHours: settings?.last_minute_hours ?? 0,
      dynamicPricingEnabled: settings?.dynamic_pricing_enabled ?? false,
    },
    windows: windows.map((row) => ({
      changeType: row.change_type,
      percentage: row.percentage,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    })),
    code,
    slotDate: input.slotDate,
  });
  return { ...quoted, codeId };
}
