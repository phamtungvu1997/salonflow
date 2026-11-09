"use client";

import type {
  MarketingInsightsMetrics,
  MarketingSettingsRecord,
  MarketingTabId,
} from "./marketing-types";

function DonutMetric({
  percentage,
  label,
  sublabel,
}: {
  percentage: number;
  label: string;
  sublabel?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4.5"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="#18202c"
            strokeWidth="4.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-slate-900">
          {clamped}%
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        {sublabel ? <p className="text-[11px] text-slate-500">{sublabel}</p> : null}
      </div>
    </div>
  );
}

export function MarketingInsightsSection({
  period,
  onChangePeriod,
  insights,
  marketingSettings,
  onSelectTab,
}: {
  period: "week" | "month" | "year";
  onChangePeriod: (p: "week" | "month" | "year") => void;
  insights: MarketingInsightsMetrics;
  marketingSettings: MarketingSettingsRecord;
  onSelectTab: (tab: MarketingTabId) => void;
}) {
  const totalBookings = insights.totalBookings;
  const discountRate =
    totalBookings > 0
      ? Math.min(100, Math.round((insights.totalDiscountCodeUses / totalBookings) * 100))
      : 0;
  const dynamicRuleShare =
    insights.activePriceChangeRulesCount > 0 ? Math.min(100, insights.activePriceChangeRulesCount * 14) : 0;
  const lastMinuteShare = marketingSettings.lastMinuteEnabled ? marketingSettings.lastMinutePercent : 0;

  return (
    <div
      data-testid="marketing-section-insights"
      className="grid gap-6 lg:grid-cols-[1fr_340px]"
    >
      {/* Left Main Column matching video 00:03 & 01:33 */}
      <div className="space-y-6">
        {/* Welcome Banner matching video 00:03 */}
        <div
          data-testid="marketing-welcome-banner"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-200/80 bg-[#ede9fe] px-6 py-5 text-slate-900 shadow-xs"
        >
          <div className="max-w-xl space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">
              Willkommen in Ihrem Marketing-Bereich
            </h2>
            <p className="text-xs leading-relaxed text-slate-700">
              Verwalten Sie Wartelisten-Anfragen, Rabattcodes, Last-Minute-Aktionen und dynamische Preisfenster im Kalender. Alle Kennzahlen stammen live aus der PostgreSQL-Datenbank dieses Salons.
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl font-bold text-indigo-700 shadow-xs">
            SF
          </div>
        </div>

        {/* Section Header + Period Segmented Control matching video 00:03 & 01:33 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">
            Ihr Marketing in Zahlen
          </h3>
          <div
            data-testid="marketing-period-filter"
            className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-semibold shadow-xs"
          >
            {(
              [
                { id: "week", label: "Diese Woche" },
                { id: "month", label: "Dieser Monat" },
                { id: "year", label: "Dieses Jahr" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`marketing-period-${opt.id}`}
                onClick={() => onChangePeriod(opt.id)}
                className={`rounded-md px-3 py-1.5 transition ${
                  period === opt.id
                    ? "bg-[#18202c] font-bold text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2x2 Metrics Cards Grid matching video 00:03 & 01:36 */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Card 1: Online Bookings & Discount Usage */}
          <div
            data-testid="insights-card-online-bookings"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Termine & Preisregeln</h4>
              <button
                type="button"
                onClick={() => onSelectTab("discounts")}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Rabatte öffnen
              </button>
            </div>
            <div>
              <p
                data-testid="insights-total-bookings"
                className="text-2xl font-bold text-slate-900"
              >
                {totalBookings}
              </p>
              <p className="text-xs text-slate-500">Gesamte aktive Buchungen im Salon</p>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <DonutMetric
                percentage={discountRate}
                label="Rabattcode-Einlösungen"
                sublabel={`${insights.totalDiscountCodeUses} Einlösungen`}
              />
              <DonutMetric
                percentage={
                  insights.activeDiscountCodesCount > 0 ? 100 : 0
                }
                label="Aktive Rabattcodes"
                sublabel={`${insights.activeDiscountCodesCount} Codes aktiv`}
              />
              <DonutMetric
                percentage={lastMinuteShare}
                label="Last-Minute-Rabatt"
                sublabel={
                  marketingSettings.lastMinuteEnabled
                    ? `${marketingSettings.lastMinutePercent}% (${marketingSettings.lastMinuteHours} Std.)`
                    : "Deaktiviert"
                }
              />
              <DonutMetric
                percentage={dynamicRuleShare}
                label="Dynamische Preisfenster"
                sublabel={`${insights.activePriceChangeRulesCount} Regeln im Kalender`}
              />
            </div>
          </div>

          {/* Card 2: Rebook Reminder */}
          <div
            data-testid="insights-card-rebook-reminder"
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Wiederbuchungs-Erinnerung
                </h4>
                <button
                  type="button"
                  onClick={() => onSelectTab("rebook-reminder")}
                  className="text-xs font-semibold text-sky-700 hover:underline"
                >
                  Konfigurieren
                </button>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-xs text-slate-500">
                  Erinnerungen versendet (Externer Versand in V1 deaktiviert)
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <DonutMetric
                  percentage={0}
                  label="Geöffnete Erinnerungs-E-Mails"
                  sublabel="Kein E-Mail-Versand in V1-Vorschau"
                />
                <DonutMetric
                  percentage={0}
                  label="Klicks auf Wiederbuchung"
                  sublabel="0 Klicks"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
              <span>✓</span>
              <span>
                Sie haben {insights.repeatCustomerBookings} Folgetermine von Stammkundinnen im Kalender.
              </span>
            </div>
          </div>

          {/* Card 3: Waiting List Subscribers */}
          <div
            data-testid="insights-card-waiting-list"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Wartelisten-Einträge
              </h4>
              <button
                type="button"
                onClick={() => onSelectTab("waiting-list")}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Warteliste öffnen
              </button>
            </div>
            <div>
              <p
                data-testid="insights-waitlist-count"
                className="text-2xl font-bold text-slate-900"
              >
                {insights.waitingListSubscribersCount}
              </p>
              <p className="text-xs text-slate-500">
                Aktive Wartelisten-Registrierungen
              </p>
            </div>
          </div>

          {/* Card 4: Marketing Campaigns */}
          <div
            data-testid="insights-card-campaigns"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Marketing-Kampagnen
              </h4>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                Versand gesperrt (V1)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-xs text-slate-500">Newsletter gesendet</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-xs text-slate-500">E-Mails zugestellt</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Zum Schutz vor unbeabsichtigten Kundennachrichten ist der externe Kampagnenversand in der V1-Umgebung deaktiviert.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Tips to Improve Your Marketing matching video 00:03 & 01:36 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Tipps zur Optimierung Ihres Marketings
        </h3>

        {[
          {
            title: "Warteliste bei Stornierungen nutzen",
            desc: "Tragen Sie Terminwünsche Ihrer Kundinnen in die Warteliste ein, um frei werdende Lücken im Kalender sofort zu füllen.",
            tab: "waiting-list" as MarketingTabId,
            actionLabel: "Zur Warteliste",
          },
          {
            title: "Last-Minute-Rabatte einrichten",
            desc: "Vergeben Sie automatische Preisnachlässe für kurzfristig freie Termine innerhalb weniger Stunden vor Beginn.",
            tab: "discounts" as MarketingTabId,
            actionLabel: "Last-Minute konfigurieren",
          },
          {
            title: "Persönliche Rabattcodes erstellen",
            desc: "Erstellen Sie aktionsbezogene Rabattcodes für Feiertage, Neukundinnen oder besondere Salon-Events.",
            tab: "discounts" as MarketingTabId,
            actionLabel: "Rabattcodes verwalten",
          },
          {
            title: "Filtergruppen für Stammkundinnen",
            desc: "Segmentieren Sie Ihre Kundenkartei nach Umsatz oder Besuchshäufigkeit.",
            tab: "filters" as MarketingTabId,
            actionLabel: "Filtergruppen öffnen",
          },
          {
            title: "Automatische Wiederbuchungs-Erinnerung",
            desc: "Definieren Sie, für welche Behandlungen Kundinnen nach ihrem Besuch erinnert werden sollen.",
            tab: "rebook-reminder" as MarketingTabId,
            actionLabel: "Erinnerung prüfen",
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2"
          >
            <h4 className="text-xs font-bold text-slate-900">{tip.title}</h4>
            <p className="text-[11px] leading-relaxed text-slate-600">{tip.desc}</p>
            <button
              type="button"
              onClick={() => onSelectTab(tip.tab)}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
            >
              <span>{tip.actionLabel}</span>
              <span>→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
