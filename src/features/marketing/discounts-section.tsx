"use client";

import { useEffect, useMemo, useState } from "react";

import { subscribeServiceCatalogUpdates } from "@/features/services/service-catalog-sync";
import { formatEuroPrice } from "@/features/settings/settings-types";

import {
  type DiscountCodeRecord,
  type DiscountCodeType,
  type MarketingSettingsRecord,
  DISCOUNT_TYPE_LABELS,
} from "./marketing-types";

export function MarketingDiscountsSection({
  salonId,
  marketingSettings,
  discountCodes,
  onSaveSettings,
  onRefresh,
  onOpenDynamicPricingCalendar,
}: {
  salonId: string;
  marketingSettings: MarketingSettingsRecord;
  discountCodes: DiscountCodeRecord[];
  onSaveSettings: (patch: Partial<MarketingSettingsRecord>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenDynamicPricingCalendar: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Last-Minute Discount Setup Modal (video 00:33 – 00:35)
  const [lastMinuteModalOpen, setLastMinuteModalOpen] = useState(false);
  const [lmPercent, setLmPercent] = useState(marketingSettings.lastMinutePercent || 15);
  const [lmHours, setLmHours] = useState(marketingSettings.lastMinuteHours || 2);

  // Create Discount Code Modal (video 00:18)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [codeEnabled, setCodeEnabled] = useState(true);
  const [codeText, setCodeText] = useState("");
  const [discountType, setDiscountType] = useState<DiscountCodeType>("holidays");
  const [percentage, setPercentage] = useState(15);
  const [validFrom, setValidFrom] = useState("2026-11-09");
  const [expirationMode, setExpirationMode] = useState<
    "never" | "1_month" | "3_months" | "date"
  >("never");
  const [oneTimePerCustomer, setOneTimePerCustomer] = useState(false);
  const [limitTotalUses, setLimitTotalUses] = useState(false);
  const [specificServicesOnly, setSpecificServicesOnly] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [catalogServices, setCatalogServices] = useState<
    { id: string; name: string; categoryName: string; priceCents: number }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchCatalog() {
      try {
        const res = await fetch(
          `/api/services?salonId=${encodeURIComponent(salonId)}`,
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          services?: {
            id: string;
            name: string;
            categoryName?: string;
            priceCents: number;
          }[];
        };
        if (!cancelled && body.services) {
          setCatalogServices(
            body.services.map((s) => ({
              id: s.id,
              name: s.name,
              categoryName: s.categoryName ?? "Allgemein",
              priceCents: s.priceCents,
            })),
          );
        }
      } catch {
        // Ignore
      }
    }
    void fetchCatalog();
    const unsub = subscribeServiceCatalogUpdates(salonId, () => {
      void fetchCatalog();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [salonId]);

  // Row context menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCodes = useMemo(() => {
    if (!searchQuery.trim()) return discountCodes;
    const q = searchQuery.toLowerCase();
    return discountCodes.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        DISCOUNT_TYPE_LABELS[item.discountType]?.toLowerCase().includes(q),
    );
  }, [discountCodes, searchQuery]);

  function generateRandomCode() {
    const prefixes = ["SALON", "GLOW", "NAILS", "WINTER", "JEANNIE"];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)] ?? "SALON";
    const num = Math.floor(10 + Math.random() * 89);
    setCodeText(`${p}${num}`);
  }

  async function handleSaveLastMinute() {
    setSaving(true);
    try {
      await onSaveSettings({
        lastMinuteEnabled: true,
        lastMinutePercent: lmPercent,
        lastMinuteHours: lmHours,
      });
      setLastMinuteModalOpen(false);
      setFeedback(
        `Last-Minute-Rabatt (${lmPercent}% innerhalb von ${lmHours} Std.) wurde gespeichert.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDiscountCode() {
    if (!codeText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/discounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          code: codeText.trim().toUpperCase(),
          discountType,
          percentage,
          validFrom,
          expirationMode,
          oneTimePerCustomer,
          limitTotalUses,
          specificServicesOnly,
          enabled: codeEnabled,
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setCodeText("");
        setFeedback(`Rabattcode „${codeText.trim().toUpperCase()}“ wurde erstellt.`);
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCodeStatus(item: DiscountCodeRecord) {
    setOpenMenuId(null);
    await fetch("/api/marketing/discounts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        salonId,
        id: item.id,
        enabled: !item.enabled,
      }),
    });
    setFeedback(
      `Rabattcode „${item.code}“ wurde ${!item.enabled ? "aktiviert" : "deaktiviert"}.`,
    );
    await onRefresh();
  }

  async function handleDeleteCode(item: DiscountCodeRecord) {
    setOpenMenuId(null);
    await fetch(
      `/api/marketing/discounts?salonId=${encodeURIComponent(salonId)}&id=${encodeURIComponent(item.id)}`,
      { method: "DELETE" },
    );
    setFeedback(`Rabattcode „${item.code}“ wurde gelöscht.`);
    await onRefresh();
  }

  return (
    <div data-testid="marketing-section-discounts" className="space-y-6">
      {feedback ? (
        <div
          data-testid="discounts-feedback-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {/* Card 1: Last-minute discount matching video 00:15 & 00:30 */}
      <div
        data-testid="last-minute-discount-card"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2"
      >
        <h3 className="text-sm font-bold text-slate-900">Last-Minute-Rabatt</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
          <span data-testid="last-minute-status-text">
            {marketingSettings.lastMinuteEnabled
              ? `${marketingSettings.lastMinutePercent}% Rabatt für Online-Buchungen innerhalb von ${marketingSettings.lastMinuteHours} Stunden vor Terminbeginn`
              : "Last-Minute-Rabatt ist derzeit deaktiviert"}
          </span>
          <button
            type="button"
            data-testid="last-minute-toggle-link"
            onClick={() =>
              void onSaveSettings({
                lastMinuteEnabled: !marketingSettings.lastMinuteEnabled,
              })
            }
            className="font-bold text-sky-700 hover:underline"
          >
            {marketingSettings.lastMinuteEnabled ? "Deaktivieren" : "Aktivieren"}
          </button>
          <button
            type="button"
            data-testid="last-minute-edit-link"
            onClick={() => {
              setLmPercent(marketingSettings.lastMinutePercent || 15);
              setLmHours(marketingSettings.lastMinuteHours || 2);
              setLastMinuteModalOpen(true);
            }}
            className="font-bold text-sky-700 hover:underline"
          >
            Bearbeiten
          </button>
        </div>
      </div>

      {/* Card 2: Dynamic pricing matching video 00:15 & 00:36 */}
      <div
        data-testid="dynamic-pricing-card"
        className="flex flex-wrap items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="max-w-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Dynamische Preisgestaltung</h3>
          <p className="text-xs leading-relaxed text-slate-600">
            Mit dieser Funktion können Sie Zeitfenster mit Preisänderungen (Rabatte oder Preiserhöhungen) für bestimmte Tage oder Uhrzeiten in Ihrem Kalender hinterlegen. Bestehende Termine und Techniker-Verfügbarkeiten bleiben davon unberührt.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                data-testid="dynamic-pricing-enable-toggle"
                checked={marketingSettings.dynamicPricingEnabled}
                onChange={(event) =>
                  void onSaveSettings({
                    dynamicPricingEnabled: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded accent-[#f28b82]"
              />
              <span>Dynamische Preisgestaltung aktivieren</span>
            </label>

            <button
              type="button"
              data-testid="dynamic-pricing-go-to-calendar-btn"
              onClick={onOpenDynamicPricingCalendar}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50"
            >
              Zum Kalender
            </button>
          </div>
        </div>

        {/* Decorative mini preview graphic matching video 00:15 */}
        <div className="hidden sm:flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs">
          <div className="h-10 w-2 rounded-full bg-indigo-500" />
          <div>
            <p className="font-bold text-indigo-950">10:00 - 19:00</p>
            <p className="text-[11px] font-semibold text-indigo-700">13% Rabatt-Zeitfenster</p>
          </div>
        </div>
      </div>

      {/* Card 3: Discount codes directory matching video 00:15 – 00:22 */}
      <div
        data-testid="discount-codes-card"
        className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">Rabattcodes</h3>
          <div className="flex items-center gap-3">
            <input
              type="search"
              data-testid="discount-codes-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Suchen…"
              className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
            />
            <button
              type="button"
              data-testid="new-discount-code-btn"
              onClick={() => {
                setCodeText("");
                setPercentage(15);
                setDiscountType("holidays");
                setCodeEnabled(true);
                setCreateModalOpen(true);
              }}
              className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
            >
              Neuer Rabattcode
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">CODE</th>
                <th className="px-6 py-3">TYP</th>
                <th className="px-6 py-3">GENUTZT</th>
                <th className="px-6 py-3">STATUS</th>
                <th className="px-6 py-3 text-right">AKTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                    Keine passenden Rabattcodes gefunden.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((item) => (
                  <tr
                    key={item.id}
                    data-testid={`discount-code-row-${item.code}`}
                    className="hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-3 font-bold text-slate-900">
                      {item.code}{" "}
                      <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                        ({item.percentage}%)
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {DISCOUNT_TYPE_LABELS[item.discountType] ?? item.discountType}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {item.usedCount} Kundinnen
                    </td>
                    <td className="px-6 py-3">
                      <span
                        data-testid={`discount-code-status-${item.code}`}
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                          item.enabled ? "bg-emerald-600" : "bg-slate-500"
                        }`}
                      >
                        {item.enabled ? "AKTIVIERT" : "DEAKTIVIERT"}
                      </span>
                    </td>
                    <td className="relative px-6 py-3 text-right">
                      <button
                        type="button"
                        data-testid={`discount-code-menu-btn-${item.code}`}
                        onClick={() =>
                          setOpenMenuId(openMenuId === item.id ? null : item.id)
                        }
                        className="rounded-md border border-slate-200 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        •••
                      </button>
                      {openMenuId === item.id ? (
                        <div
                          data-testid={`discount-code-menu-${item.code}`}
                          className="absolute right-6 z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() => void handleToggleCodeStatus(item)}
                            className="block w-full px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            {item.enabled ? "Deaktivieren" : "Aktivieren"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCode(item)}
                            className="block w-full px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Löschen
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Last-minute discount setup matching video 00:33 – 00:35 */}
      {lastMinuteModalOpen ? (
        <div
          data-testid="last-minute-setup-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Last-Minute-Rabatt einrichten
              </h3>
              <button
                type="button"
                onClick={() => setLastMinuteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">
                Mit dieser Funktion gewähren Sie automatisch einen Rabatt für kurzfristig freie Zeitfenster im Online-Buchungs-Widget. Bestehende Termine im Kalender werden nicht verändert.
              </p>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RABATTPROZENTSATZ ANWENDEN
                </label>
                <select
                  data-testid="last-minute-percent-select"
                  value={lmPercent}
                  onChange={(event) => setLmPercent(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
                >
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => (
                    <option key={pct} value={pct}>
                      {pct}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  FÜR BUCHUNGEN INNERHALB VON
                </label>
                <select
                  data-testid="last-minute-hours-select"
                  value={lmHours}
                  onChange={(event) => setLmHours(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
                >
                  <option value={2}>Innerhalb von 2 Stunden</option>
                  <option value={4}>Innerhalb von 4 Stunden</option>
                  <option value={6}>Innerhalb von 6 Stunden</option>
                  <option value={12}>Innerhalb von 12 Stunden</option>
                  <option value={24}>Innerhalb von 24 Stunden</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setLastMinuteModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="last-minute-apply-btn"
                disabled={saving}
                onClick={() => void handleSaveLastMinute()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal 2: Create discount code matching video 00:18 */}
      {createModalOpen ? (
        <div
          data-testid="create-discount-code-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Rabattcode erstellen
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 text-xs">
                <p className="text-slate-600">
                  Sie können diesen Rabattcode jederzeit aktivieren oder deaktivieren.
                </p>
                <label className="inline-flex shrink-0 items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codeEnabled}
                    onChange={(event) => setCodeEnabled(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Aktivieren</span>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  CODE *
                </label>
                <input
                  type="text"
                  data-testid="discount-modal-code-input"
                  value={codeText}
                  onChange={(event) => setCodeText(event.target.value.toUpperCase())}
                  placeholder="z. B. WINTER15"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-bold uppercase text-slate-900"
                />
                <button
                  type="button"
                  data-testid="discount-modal-generate-random"
                  onClick={generateRandomCode}
                  className="mt-1 text-xs font-bold text-sky-700 hover:underline"
                >
                  Zufälligen Code generieren
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    RABATTTYP
                  </label>
                  <select
                    data-testid="discount-modal-type-select"
                    value={discountType}
                    onChange={(event) =>
                      setDiscountType(event.target.value as DiscountCodeType)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="holidays">Feiertage</option>
                    <option value="special_events">Besondere Anlässe</option>
                    <option value="new_customers">Neukundinnen</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    RABATTPROZENTSATZ
                  </label>
                  <select
                    data-testid="discount-modal-percentage-select"
                    value={percentage}
                    onChange={(event) => setPercentage(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                      <option key={pct} value={pct}>
                        {pct}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    GÜLTIG AB
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(event) => setValidFrom(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ABLAUFZEIT
                  </label>
                  <select
                    value={expirationMode}
                    onChange={(event) =>
                      setExpirationMode(
                        event.target.value as "never" | "1_month" | "3_months" | "date",
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="never">Nie</option>
                    <option value="1_month">Nach 1 Monat</option>
                    <option value="3_months">Nach 3 Monaten</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  NUTZUNGSLIMITS
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oneTimePerCustomer}
                    onChange={(event) => setOneTimePerCustomer(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Einmalig pro Kundin einlösbar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitTotalUses}
                    onChange={(event) => setLimitTotalUses(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Gesamtanzahl der Einlösungen begrenzen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="discount-modal-specific-services-checkbox"
                    checked={specificServicesOnly}
                    onChange={(event) => setSpecificServicesOnly(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Nur auf bestimmte Leistungen anwenden</span>
                </label>
                {specificServicesOnly ? (
                  <div
                    data-testid="discount-modal-services-list"
                    className="mt-2 max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                  >
                    {catalogServices.map((svc) => (
                      <label
                        key={svc.id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded px-1.5 py-1 text-[11.5px] hover:bg-white"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={selectedServiceIds.includes(svc.id)}
                            onChange={() =>
                              setSelectedServiceIds((prev) =>
                                prev.includes(svc.id)
                                  ? prev.filter((id) => id !== svc.id)
                                  : [...prev, svc.id],
                              )
                            }
                            className="h-3.5 w-3.5 rounded accent-[#f28b82]"
                          />
                          <span className="truncate font-medium text-slate-900">
                            {svc.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-slate-600">
                          {formatEuroPrice(svc.priceCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="discount-modal-save-btn"
                disabled={saving || !codeText.trim()}
                onClick={() => void handleCreateDiscountCode()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
