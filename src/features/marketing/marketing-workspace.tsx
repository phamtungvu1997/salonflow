"use client";

import { useCallback, useEffect, useState } from "react";

import { useSalon } from "@/features/salons/salon-context";

import { MarketingDiscountsSection } from "./discounts-section";
import { DynamicPricingCalendarView } from "./dynamic-pricing-calendar";
import { MarketingInsightsSection } from "./insights-section";
import {
  type DiscountCodeRecord,
  type MarketingFilterGroupRecord,
  type MarketingInsightsMetrics,
  type MarketingSettingsRecord,
  type MarketingTabId,
  type PriceChangeRuleRecord,
  type WaitingListEntryRecord,
  MARKETING_TABS,
} from "./marketing-types";
import {
  EmailMarketingSection,
  FilterGroupsSection,
  RebookReminderSection,
  type SimpleCustomerOption,
  type SimpleServiceOption,
  type SimpleStaffOption,
  WaitingListSection,
} from "./waiting-list-and-tabs";

const DEFAULT_MARKETING_SETTINGS: MarketingSettingsRecord = {
  salonId: "salon_jeannie",
  marketingFeatureEnabled: true,
  lastMinuteEnabled: true,
  lastMinutePercent: 15,
  lastMinuteHours: 2,
  dynamicPricingEnabled: true,
  rebookReminderEnabled: true,
  rebookReminderServiceIds: [
    "svc_mani",
    "svc_mani_classic",
    "svc_pedi",
    "svc_spa_pedi",
    "svc_shellac",
    "svc_shellac_french",
    "svc_biab",
  ],
  waitingListEnabled: true,
};

export function MarketingWorkspace() {
  const { activeSalon } = useSalon();
  const salonId = activeSalon?.id ?? "salon_jeannie";

  const [activeTab, setActiveTab] = useState<MarketingTabId>("insights");
  const [inDynamicCalendarMode, setInDynamicCalendarMode] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const [marketingSettings, setMarketingSettings] = useState<MarketingSettingsRecord>(
    DEFAULT_MARKETING_SETTINGS,
  );
  const [insights, setInsights] = useState<MarketingInsightsMetrics>({
    totalBookings: 0,
    repeatCustomerBookings: 0,
    totalDiscountCodeUses: 0,
    activeDiscountCodesCount: 0,
    activePriceChangeRulesCount: 0,
    waitingListSubscribersCount: 0,
    externalDeliveryDisabled: true,
  });
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeRecord[]>([]);
  const [priceChangeRules, setPriceChangeRules] = useState<PriceChangeRuleRecord[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntryRecord[]>([]);
  const [filterGroups, setFilterGroups] = useState<MarketingFilterGroupRecord[]>([]);

  const [customers, setCustomers] = useState<SimpleCustomerOption[]>([]);
  const [services, setServices] = useState<SimpleServiceOption[]>([]);
  const [staff, setStaff] = useState<SimpleStaffOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMarketingData = useCallback(async () => {
    if (!salonId) return;
    const [mktRes, custRes, svcRes, staffRes] = await Promise.all([
      fetch(
        `/api/marketing?salonId=${encodeURIComponent(salonId)}&period=${encodeURIComponent(period)}`,
      ),
      fetch(`/api/customers?salonId=${encodeURIComponent(salonId)}`),
      fetch(`/api/services?salonId=${encodeURIComponent(salonId)}`),
      fetch(`/api/staff?salonId=${encodeURIComponent(salonId)}`),
    ]);

    if (mktRes.ok) {
      const body = (await mktRes.json()) as {
        marketingSettings?: MarketingSettingsRecord;
        insights?: MarketingInsightsMetrics;
        discountCodes?: DiscountCodeRecord[];
        priceChangeRules?: PriceChangeRuleRecord[];
        waitingList?: WaitingListEntryRecord[];
        filterGroups?: MarketingFilterGroupRecord[];
      };
      if (body.marketingSettings) setMarketingSettings(body.marketingSettings);
      if (body.insights) setInsights(body.insights);
      if (body.discountCodes) setDiscountCodes(body.discountCodes);
      if (body.priceChangeRules) setPriceChangeRules(body.priceChangeRules);
      if (body.waitingList) setWaitingList(body.waitingList);
      if (body.filterGroups) setFilterGroups(body.filterGroups);
    }

    if (custRes.ok) {
      const body = (await custRes.json()) as {
        customers?: { id: string; displayName: string }[];
      };
      if (body.customers) {
        setCustomers(
          body.customers.map((c) => ({ id: c.id, displayName: c.displayName })),
        );
      }
    }

    if (svcRes.ok) {
      const body = (await svcRes.json()) as {
        services?: { id: string; name: string; durationMinutes: number }[];
      };
      if (body.services) {
        setServices(
          body.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
          })),
        );
      }
    }

    if (staffRes.ok) {
      const body = (await staffRes.json()) as {
        staff?: { id: string; displayName: string }[];
      };
      if (body.staff) {
        setStaff(
          body.staff.map((st) => ({ id: st.id, displayName: st.displayName })),
        );
      }
    }

    setLoading(false);
  }, [salonId, period]);

  useEffect(() => {
    void loadMarketingData();
  }, [loadMarketingData]);

  async function saveMarketingSettingsPatch(patch: Partial<MarketingSettingsRecord>) {
    const res = await fetch("/api/marketing", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        salonId,
        ...patch,
      }),
    });
    if (res.ok) {
      const body = (await res.json()) as {
        marketingSettings?: MarketingSettingsRecord;
      };
      if (body.marketingSettings) setMarketingSettings(body.marketingSettings);
      await loadMarketingData();
    }
  }

  return (
    <div
      data-testid="page-marketing"
      className="min-h-[calc(100vh-52px)] bg-[#f4f5f7] p-6 lg:p-8"
    >
      {/* Dynamic Pricing Calendar Mode (Slice C, matching video 00:39 – 00:91) */}
      {inDynamicCalendarMode ? (
        <DynamicPricingCalendarView
          salonId={salonId}
          priceChangeRules={priceChangeRules}
          onRefresh={loadMarketingData}
          onExitToRegularView={() => setInDynamicCalendarMode(false)}
        />
      ) : (
        <div className="space-y-6">
          {/* Marketing Header + Horizontal Sub-Navigation Tabs matching video 00:03 – 00:36 */}
          <div className="border-b border-slate-200 bg-white px-6 pt-5 rounded-t-xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                Vorschau-Modus · Kein externer E-Mail-/SMS-Versand
              </span>
            </div>

            <nav
              data-testid="marketing-tabs-nav"
              aria-label="Marketing-Navigation"
              className="flex flex-wrap gap-6 text-xs font-bold"
            >
              {MARKETING_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`marketing-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 pb-3 transition ${
                      isActive
                        ? "border-[#f28b82] text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
              Marketing-Daten werden geladen…
            </div>
          ) : null}

          {!loading && activeTab === "insights" ? (
            <MarketingInsightsSection
              period={period}
              onChangePeriod={setPeriod}
              insights={insights}
              marketingSettings={marketingSettings}
              onSelectTab={setActiveTab}
            />
          ) : null}

          {!loading && activeTab === "waiting-list" ? (
            <WaitingListSection
              salonId={salonId}
              waitingList={waitingList}
              marketingSettings={marketingSettings}
              customers={customers}
              services={services}
              staff={staff}
              onSaveSettings={saveMarketingSettingsPatch}
              onRefresh={loadMarketingData}
            />
          ) : null}

          {!loading && activeTab === "discounts" ? (
            <MarketingDiscountsSection
              salonId={salonId}
              marketingSettings={marketingSettings}
              discountCodes={discountCodes}
              onSaveSettings={saveMarketingSettingsPatch}
              onRefresh={loadMarketingData}
              onOpenDynamicPricingCalendar={() => setInDynamicCalendarMode(true)}
            />
          ) : null}

          {!loading && activeTab === "email" ? (
            <EmailMarketingSection
              marketingSettings={marketingSettings}
              onSelectRebookTab={() => setActiveTab("rebook-reminder")}
            />
          ) : null}

          {!loading && activeTab === "filters" ? (
            <FilterGroupsSection
              salonId={salonId}
              filterGroups={filterGroups}
              onRefresh={loadMarketingData}
            />
          ) : null}

          {!loading && activeTab === "rebook-reminder" ? (
            <RebookReminderSection
              marketingSettings={marketingSettings}
              insights={insights}
              services={services}
              onSaveSettings={saveMarketingSettingsPatch}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
