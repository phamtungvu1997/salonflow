"use client";

import { formatLongDate, formatPrice } from "@/features/calendar/calendar-date";

export function AppointmentSummary({
  date,
  start,
  end,
  priceCents,
  saving,
  disabled,
  error,
}: {
  date: string;
  start: string;
  end: string | null;
  priceCents: number;
  saving: boolean;
  disabled: boolean;
  error: string | null;
}) {
  return (
    <div className="shrink-0 border-t border-[#eef0f3] bg-white px-4 py-3">
      {error ? (
        <p className="mb-2 text-sm text-[#b42318]" role="alert" data-testid="booking-error">
          {error}
        </p>
      ) : null}
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">Datum und Uhrzeit</p>
          <p className="text-sm font-medium text-[#1c1e21]">
            {formatLongDate(date)}
            <br />
            {start}
            {end ? `–${end}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">Preis</p>
          <p className="text-sm font-medium">{formatPrice(priceCents)}</p>
        </div>
      </div>
      <button
        type="submit"
        data-testid="booking-save"
        aria-disabled={disabled || saving}
        className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] motion-safe:transition-colors motion-safe:duration-150"
      >
        {saving ? "Speichert…" : "Termin erstellen"}
      </button>
    </div>
  );
}
