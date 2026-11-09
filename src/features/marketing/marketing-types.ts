export type MarketingTabId =
  | "insights"
  | "waiting-list"
  | "discounts"
  | "email"
  | "filters"
  | "rebook-reminder";

export interface MarketingSettingsRecord {
  salonId: string;
  marketingFeatureEnabled: boolean;
  lastMinuteEnabled: boolean;
  lastMinutePercent: number;
  lastMinuteHours: number;
  dynamicPricingEnabled: boolean;
  rebookReminderEnabled: boolean;
  rebookReminderServiceIds: string[];
  waitingListEnabled: boolean;
}

export interface MarketingInsightsMetrics {
  totalBookings: number;
  repeatCustomerBookings: number;
  totalDiscountCodeUses: number;
  activeDiscountCodesCount: number;
  activePriceChangeRulesCount: number;
  waitingListSubscribersCount: number;
  externalDeliveryDisabled: boolean;
}

export type DiscountCodeType = "special_events" | "holidays" | "new_customers" | "other";

export interface DiscountCodeRecord {
  id: string;
  salonId: string;
  code: string;
  discountType: DiscountCodeType;
  percentage: number;
  validFrom: string;
  expirationMode: "never" | "1_month" | "3_months" | "date";
  oneTimePerCustomer: boolean;
  limitTotalUses: boolean;
  specificServicesOnly: boolean;
  usedCount: number;
  enabled: boolean;
}

export interface PriceChangeRuleRecord {
  id: string;
  salonId: string;
  changeType: "discount" | "increase";
  percentage: number;
  startDate: string;
  endDate: string;
  startMinute: number;
  endMinute: number;
  startsAt: string;
  endsAt: string;
  repeatEnabled: boolean;
  repeatFrequency: string;
}

export interface WaitingListEntryRecord {
  id: string;
  salonId: string;
  customerId: string | null;
  customerName: string;
  serviceId: string | null;
  serviceName: string;
  durationMinutes: number;
  staffId: string | null;
  staffName: string;
  dateMode: "specific_date" | "weekdays";
  preferredDate: string;
  note: string | null;
  notificationSent: boolean;
}

export interface MarketingFilterGroupRecord {
  id: string;
  salonId: string;
  name: string;
  filtersUsed: number;
  criteriaLabel: string;
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountCodeType, string> = {
  special_events: "Besondere Anlässe",
  holidays: "Feiertage",
  new_customers: "Neukundinnen",
  other: "Sonstiges",
};

export const MARKETING_TABS: { id: MarketingTabId; label: string }[] = [
  { id: "insights", label: "Einblicke" },
  { id: "waiting-list", label: "Warteliste" },
  { id: "discounts", label: "Rabatte" },
  { id: "email", label: "E-Mail" },
  { id: "filters", label: "Filtergruppen" },
  { id: "rebook-reminder", label: "Wiederbuchungs-Erinnerung" },
];

export function formatMinutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
