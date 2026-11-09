"use client";

import { useMemo, useState } from "react";

import {
  type PriceChangeRuleRecord,
  formatMinutesToHHMM,
} from "./marketing-types";

interface WeekConfig {
  weekId: "w46" | "w47";
  weekNumber: number;
  rangeLabel: string;
  days: { date: string; dayShort: string; dayNum: string; isSunday?: boolean }[];
}

const WEEKS: Record<"w46" | "w47", WeekConfig> = {
  w46: {
    weekId: "w46",
    weekNumber: 46,
    rangeLabel: "9. – 15. Nov. 2026",
    days: [
      { date: "2026-11-09", dayShort: "Mo", dayNum: "9" },
      { date: "2026-11-10", dayShort: "Di", dayNum: "10-11" },
      { date: "2026-11-11", dayShort: "Mi", dayNum: "11-11" },
      { date: "2026-11-12", dayShort: "Do", dayNum: "12-11" },
      { date: "2026-11-13", dayShort: "Fr", dayNum: "13-11" },
      { date: "2026-11-14", dayShort: "Sa", dayNum: "14-11" },
      { date: "2026-11-15", dayShort: "So", dayNum: "15-11", isSunday: true },
    ],
  },
  w47: {
    weekId: "w47",
    weekNumber: 47,
    rangeLabel: "16. – 22. Nov. 2026",
    days: [
      { date: "2026-11-16", dayShort: "Mo", dayNum: "16-11" },
      { date: "2026-11-17", dayShort: "Di", dayNum: "17-11" },
      { date: "2026-11-18", dayShort: "Mi", dayNum: "18-11" },
      { date: "2026-11-19", dayShort: "Do", dayNum: "19-11" },
      { date: "2026-11-20", dayShort: "Fr", dayNum: "20-11" },
      { date: "2026-11-21", dayShort: "Sa", dayNum: "21-11" },
      { date: "2026-11-22", dayShort: "So", dayNum: "22-11", isSunday: true },
    ],
  },
};

const NOVEMBER_2026_CALENDAR_ROWS = [
  { kw: 44, days: [26, 27, 28, 29, 30, 31, 1] },
  { kw: 45, days: [2, 3, 4, 5, 6, 7, 8] },
  { kw: 46, days: [9, 10, 11, 12, 13, 14, 15] },
  { kw: 47, days: [16, 17, 18, 19, 20, 21, 22] },
  { kw: 48, days: [23, 24, 25, 26, 27, 28, 29] },
  { kw: 49, days: [30, 1, 2, 3, 4, 5, 6] },
];

export function DynamicPricingCalendarView({
  salonId,
  priceChangeRules,
  onRefresh,
  onExitToRegularView,
}: {
  salonId: string;
  priceChangeRules: PriceChangeRuleRecord[];
  onRefresh: () => Promise<void>;
  onExitToRegularView: () => void;
}) {
  const [activeWeek, setActiveWeek] = useState<"w46" | "w47">("w46");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create / Edit Price Change Modal State (matching video 00:45 – 00:70 & 00:84)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceChangeRuleRecord | null>(null);
  const [changeType, setChangeType] = useState<"discount" | "increase">("discount");
  const [percentageText, setPercentageText] = useState("10%");
  const [startDate, setStartDate] = useState("2026-11-16");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState("2026-11-16");
  const [endTime, setEndTime] = useState("10:45");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"weekly" | "daily">("weekly");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Interactive Date & Time Popovers inside the Modal (matching video 00:48, 00:51, 00:54)
  const [openDatePickerTarget, setOpenDatePickerTarget] = useState<
    "start" | "end" | null
  >(null);
  const [openTimePickerTarget, setOpenTimePickerTarget] = useState<
    "start" | "end" | null
  >(null);

  const weekConfig = WEEKS[activeWeek];
  const hours = useMemo(
    () => [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    [],
  );

  function formatDateDisplay(isoDate: string): string {
    const dt = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return isoDate;
    return dt.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function openCreateModal(prefillDate?: string, prefillStart?: string) {
    const defaultDate = prefillDate ?? weekConfig.days[0]?.date ?? "2026-11-16";
    setEditingRule(null);
    setChangeType("discount");
    setPercentageText("10%");
    setStartDate(defaultDate);
    setStartTime(prefillStart ?? "10:00");
    setEndDate(defaultDate);
    setEndTime(prefillStart === "13:00" ? "18:00" : "13:45");
    setRepeatEnabled(false);
    setValidationError(null);
    setOpenDatePickerTarget(null);
    setOpenTimePickerTarget(null);
    setModalOpen(true);
  }

  function openEditModal(rule: PriceChangeRuleRecord) {
    setEditingRule(rule);
    setChangeType(rule.changeType);
    setPercentageText(`${rule.percentage}%`);
    setStartDate(rule.startDate);
    setStartTime(formatMinutesToHHMM(rule.startMinute));
    setEndDate(rule.endDate);
    setEndTime(formatMinutesToHHMM(rule.endMinute));
    setRepeatEnabled(rule.repeatEnabled);
    setValidationError(null);
    setOpenDatePickerTarget(null);
    setOpenTimePickerTarget(null);
    setModalOpen(true);
  }

  async function handleSavePriceChange() {
    setValidationError(null);
    const parsedPct = Number.parseInt(percentageText.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(parsedPct) || parsedPct < 1 || parsedPct > 90) {
      setValidationError("Ungültiger Prozentsatz (1% – 90% erforderlich).");
      return;
    }

    setSaving(true);
    try {
      const method = editingRule ? "PATCH" : "POST";
      const res = await fetch("/api/marketing/price-changes", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editingRule?.id,
          salonId,
          changeType,
          percentage: parsedPct,
          startDate,
          startTime,
          endDate,
          endTime,
          repeatEnabled,
          repeatFrequency: repeatEnabled ? repeatFrequency : "none",
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setValidationError(err.error ?? "Ungültig");
        return;
      }

      setModalOpen(false);
      setEditingRule(null);
      setToastMessage(
        editingRule ? "Preisänderung aktualisiert" : "Preisänderung erstellt",
      );
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePriceChange() {
    if (!editingRule) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/marketing/price-changes?salonId=${encodeURIComponent(salonId)}&id=${encodeURIComponent(editingRule.id)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setModalOpen(false);
        setEditingRule(null);
        setToastMessage("Preisänderung gelöscht");
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="dynamic-pricing-calendar-view" className="space-y-4">
      {/* Top Calendar Header & Toast matching video 00:39, 00:60, 00:72 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Kalender · Dynamische Preisänderungen
          </h2>
          {toastMessage ? (
            <div
              data-testid="price-change-toast"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-900 shadow-xs"
            >
              <span>✓</span>
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="ml-1 text-emerald-700 hover:text-emerald-950"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          data-testid="create-price-change-btn"
          onClick={() => openCreateModal()}
          className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          Preisänderung erstellen
        </button>
      </div>

      {/* Week Navigation Toolbar matching video 00:39 & 00:42 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            data-testid="dynamic-calendar-today-btn"
            onClick={() => setActiveWeek("w46")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50"
          >
            Heute
          </button>
          <span className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-bold text-slate-900">
            Woche ▾
          </span>
          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
            <button
              type="button"
              data-testid="dynamic-calendar-prev-week"
              onClick={() => setActiveWeek("w46")}
              className="border-r border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
            >
              ‹
            </button>
            <span
              data-testid="dynamic-calendar-range-label"
              className="px-3.5 py-1.5 font-bold text-slate-900"
            >
              {weekConfig.rangeLabel}
            </span>
            <button
              type="button"
              data-testid="dynamic-calendar-next-week"
              onClick={() => setActiveWeek("w47")}
              className="border-l border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
            >
              ›
            </button>
          </div>
          <span className="ml-1 font-semibold text-slate-500">
            KW {weekConfig.weekNumber}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
          <span>⚡</span>
          <span>Preisänderungs-Modus aktiv</span>
        </span>
      </div>

      {/* Blue Informational Banner + "Regular view" link matching video 00:39 – 00:90 */}
      <div
        data-testid="dynamic-pricing-info-banner"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-xs text-sky-950"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
            i
          </span>
          <span className="font-medium">
            Jede Online-Buchung, die innerhalb der erstellten Zeitfenster reserviert wird, erhält automatisch die festgelegte Preisänderung (Techniker-Kapazitäten werden dadurch nicht blockiert).
          </span>
        </div>
        <button
          type="button"
          data-testid="dynamic-pricing-regular-view-link"
          onClick={onExitToRegularView}
          className="font-bold text-sky-700 hover:underline"
        >
          Reguläre Ansicht
        </button>
      </div>

      {/* 7-Day Weekly Dynamic Pricing Grid matching video 00:39 – 00:81 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="min-w-[920px]">
          {/* Day Column Headers */}
          <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
            <div className="border-r border-slate-200 px-2 py-2.5 text-center text-[11px] text-slate-500">
              KW {weekConfig.weekNumber}
            </div>
            {weekConfig.days.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-center gap-1.5 border-r border-slate-200 px-2 py-2.5 last:border-r-0"
              >
                <span>{day.dayShort}</span>
                <span
                  className={
                    day.date === "2026-11-09"
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f28b82] text-[11px] font-bold text-white"
                      : "text-slate-600"
                  }
                >
                  {day.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Time Grid Body (08:00 to 20:00, 44px per hour) */}
          <div className="relative grid grid-cols-[72px_repeat(7,1fr)]">
            {/* Left Time Axis */}
            <div className="border-r border-slate-200 bg-slate-50/50">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-12 border-b border-slate-100 px-2 py-1 text-right font-mono text-[11px] font-bold text-slate-600"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* 7 Day Columns */}
            {weekConfig.days.map((day) => {
              const dayRules = priceChangeRules.filter((r) => r.startDate === day.date);
              return (
                <div
                  key={day.date}
                  data-testid={`dynamic-grid-col-${day.date}`}
                  onClick={() => openCreateModal(day.date, "13:00")}
                  className="relative border-r border-slate-200 last:border-r-0 cursor-pointer"
                >
                  {hours.map((h) => {
                    const isClosedHour =
                      Boolean(day.isSunday) || h < 9 || h >= 19;
                    return (
                      <div
                        key={h}
                        className="h-12 border-b border-slate-100"
                        style={
                          isClosedHour
                            ? {
                                backgroundImage:
                                  "repeating-linear-gradient(135deg, #f1f5f9 0px, #f1f5f9 6px, #e2e8f0 6px, #e2e8f0 12px)",
                              }
                            : undefined
                        }
                      />
                    );
                  })}

                  {/* Active Price Change Blocks on this Day */}
                  {dayRules.map((rule) => {
                    const topMinutes = Math.max(0, rule.startMinute - 8 * 60);
                    const durationMinutes = Math.max(
                      30,
                      rule.endMinute - rule.startMinute,
                    );
                    const topPx = (topMinutes / 60) * 48;
                    const heightPx = Math.min(
                      12 * 48 - topPx,
                      (durationMinutes / 60) * 48,
                    );
                    return (
                      <div
                        key={rule.id}
                        data-testid={`price-change-block-${rule.startDate}-${rule.percentage}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(rule);
                        }}
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                        className="absolute inset-x-1 z-10 overflow-hidden rounded-md border border-indigo-300 border-l-4 border-l-indigo-600 bg-indigo-100/90 px-2.5 py-1.5 text-left text-xs text-indigo-950 shadow-xs transition hover:bg-indigo-200/90"
                      >
                        <p className="font-bold">
                          {formatMinutesToHHMM(rule.startMinute)} -{" "}
                          {formatMinutesToHHMM(rule.endMinute)}
                        </p>
                        <p className="font-semibold">
                          {rule.percentage}%{" "}
                          {rule.changeType === "discount"
                            ? "Rabatt"
                            : "Preiserhöhung"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create / Edit Price Change Modal matching video 00:45 – 00:70 & 00:84 – 00:88 */}
      {modalOpen ? (
        <div
          data-testid="price-change-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-xl overflow-visible rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingRule ? "Preisänderung bearbeiten" : "Preisänderung erstellen"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type of Change Radio Group */}
              <div>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ART DER ÄNDERUNG
                </span>
                <div className="flex items-center gap-6 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceChangeType"
                      data-testid="price-change-type-discount"
                      checked={changeType === "discount"}
                      onChange={() => setChangeType("discount")}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Rabatt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceChangeType"
                      data-testid="price-change-type-increase"
                      checked={changeType === "increase"}
                      onChange={() => setChangeType("increase")}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Preiserhöhung</span>
                  </label>
                </div>
              </div>

              {/* Percentage Input */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  PROZENTSATZ
                </label>
                <input
                  type="text"
                  data-testid="price-change-percentage-input"
                  value={percentageText}
                  onChange={(event) => setPercentageText(event.target.value)}
                  className="w-40 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              {/* Blue Info Box matching video 00:45 */}
              <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-950">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                  i
                </span>
                <span>
                  Wählen Sie einen verfügbaren Zeitraum für Rabatte oder Preiserhöhungen. Preisänderungen außerhalb der Öffnungszeiten sind für Kundinnen nicht sichtbar.
                </span>
              </div>

              {/* Date and Time Row with Interactive Calendar & Time Popovers matching video 00:48 – 00:58 */}
              <div className="relative">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  DATUM UND UHRZEIT
                </label>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Start Date Selector */}
                  <button
                    type="button"
                    data-testid="price-change-start-date-btn"
                    onClick={() => {
                      setOpenTimePickerTarget(null);
                      setOpenDatePickerTarget(
                        openDatePickerTarget === "start" ? null : "start",
                      );
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    {formatDateDisplay(startDate)} ▾
                  </button>

                  {/* Start Time Input + Popover Trigger */}
                  <button
                    type="button"
                    data-testid="price-change-start-time-btn"
                    onClick={() => {
                      setOpenDatePickerTarget(null);
                      setOpenTimePickerTarget(
                        openTimePickerTarget === "start" ? null : "start",
                      );
                    }}
                    className={`rounded-lg border px-3 py-2 font-mono font-bold ${
                      validationError
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                  >
                    {startTime}
                  </button>

                  <span className="px-1 font-semibold text-slate-500">Bis</span>

                  {/* End Date Selector */}
                  <button
                    type="button"
                    data-testid="price-change-end-date-btn"
                    onClick={() => {
                      setOpenTimePickerTarget(null);
                      setOpenDatePickerTarget(
                        openDatePickerTarget === "end" ? null : "end",
                      );
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    {formatDateDisplay(endDate)} ▾
                  </button>

                  {/* End Time Input + Popover Trigger */}
                  <button
                    type="button"
                    data-testid="price-change-end-time-btn"
                    onClick={() => {
                      setOpenDatePickerTarget(null);
                      setOpenTimePickerTarget(
                        openTimePickerTarget === "end" ? null : "end",
                      );
                    }}
                    className={`rounded-lg border px-3 py-2 font-mono font-bold ${
                      validationError
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                  >
                    {endTime}
                  </button>
                </div>

                {/* Monday-First Date Picker Popover matching video 00:48, 00:51, 00:58 */}
                {openDatePickerTarget ? (
                  <div
                    data-testid="price-change-date-popover"
                    className="absolute left-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>November 2026</span>
                      <span className="text-slate-400">‹ ›</span>
                    </div>
                    <table className="w-full text-center text-[11px]">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="py-1">KW</th>
                          <th>M</th>
                          <th>D</th>
                          <th>M</th>
                          <th>D</th>
                          <th>F</th>
                          <th>S</th>
                          <th>S</th>
                        </tr>
                      </thead>
                      <tbody>
                        {NOVEMBER_2026_CALENDAR_ROWS.map((row) => (
                          <tr key={row.kw}>
                            <td className="py-1 font-mono text-[10px] text-slate-400">
                              {row.kw}
                            </td>
                            {row.days.map((d, idx) => {
                              const isCurrentMonth =
                                !(row.kw === 44 && d > 20) && !(row.kw === 49 && d < 10);
                              const iso = `2026-11-${String(d).padStart(2, "0")}`;
                              const activeIso =
                                openDatePickerTarget === "start" ? startDate : endDate;
                              const isSelected = isCurrentMonth && iso === activeIso;
                              return (
                                <td key={idx} className="py-0.5">
                                  {isCurrentMonth ? (
                                    <button
                                      type="button"
                                      data-testid={`date-popover-day-${d}`}
                                      onClick={() => {
                                        setValidationError(null);
                                        if (openDatePickerTarget === "start") {
                                          setStartDate(iso);
                                          if (endDate < iso) setEndDate(iso);
                                        } else {
                                          setEndDate(iso);
                                        }
                                        setOpenDatePickerTarget(null);
                                      }}
                                      className={`h-6 w-6 rounded-full font-semibold ${
                                        isSelected
                                          ? "bg-[#18202c] text-white"
                                          : "text-slate-800 hover:bg-slate-100"
                                      }`}
                                    >
                                      {d}
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">{d}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Dual-Column Time Picker Popover matching video 00:54 */}
                {openTimePickerTarget ? (
                  <div
                    data-testid="price-change-time-popover"
                    className="absolute left-36 z-30 mt-2 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl text-xs"
                  >
                    <div className="space-y-1 pr-2 border-r border-slate-100">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Std.</p>
                      {["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"].map(
                        (hh) => (
                          <button
                            key={hh}
                            type="button"
                            data-testid={`time-popover-hour-${hh}`}
                            onClick={() => {
                              const current =
                                openTimePickerTarget === "start" ? startTime : endTime;
                              const mm = current.split(":")[1] ?? "00";
                              const next = `${hh}:${mm}`;
                              if (openTimePickerTarget === "start") {
                                setStartTime(next);
                              } else {
                                setEndTime(next);
                              }
                            }}
                            className="block w-10 rounded-md px-2 py-1 font-mono font-bold text-slate-800 hover:bg-slate-100"
                          >
                            {hh}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Min.</p>
                      {["00", "15", "30", "45"].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          data-testid={`time-popover-minute-${mm}`}
                          onClick={() => {
                            setValidationError(null);
                            const current =
                              openTimePickerTarget === "start" ? startTime : endTime;
                            const hh = current.split(":")[0] ?? "10";
                            const next = `${hh}:${mm}`;
                            if (openTimePickerTarget === "start") {
                              setStartTime(next);
                            } else {
                              setEndTime(next);
                            }
                            setOpenTimePickerTarget(null);
                          }}
                          className="block w-10 rounded-md px-2 py-1 font-mono font-bold text-slate-800 hover:bg-slate-100"
                        >
                          {mm}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Validation Error Notice matching video 00:84 – 00:87 */}
              {validationError ? (
                <div
                  data-testid="price-change-validation-error"
                  className="rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800"
                >
                  {validationError}
                </div>
              ) : null}

              {/* Repeat Option matching video 00:45 – 00:69 */}
              <div className="pt-1 space-y-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="price-change-repeat-checkbox"
                    checked={repeatEnabled}
                    onChange={(event) => setRepeatEnabled(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>Preisänderung wiederholen</span>
                </label>

                {repeatEnabled ? (
                  <div className="pl-6">
                    <select
                      data-testid="price-change-repeat-frequency"
                      value={repeatFrequency}
                      onChange={(event) =>
                        setRepeatFrequency(event.target.value as "weekly" | "daily")
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      <option value="weekly">Wöchentlich</option>
                      <option value="daily">Täglich</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <div>
                {editingRule ? (
                  <button
                    type="button"
                    data-testid="price-change-delete-btn"
                    disabled={saving}
                    onClick={() => void handleDeletePriceChange()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <span>🗑️</span>
                    <span>Löschen</span>
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Schließen
                </button>
                <button
                  type="button"
                  data-testid="price-change-save-btn"
                  disabled={saving}
                  onClick={() => void handleSavePriceChange()}
                  className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
