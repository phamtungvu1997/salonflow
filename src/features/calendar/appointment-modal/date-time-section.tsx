"use client";

import { ChevronDown, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AvailabilitySlot } from "./availability";
import { DateBracket, TimeBracket } from "./date-time-brackets";

export type ExtraDateSlot = {
  key: string;
  date: string;
  start: string;
};

export function DateTimeSection({
  date,
  start,
  onDate,
  onStart,
  availabilityOpen,
  onToggleAvailability,
  slots,
  onPickSlot,
  extraDates,
  onAddExtraDate,
  onUpdateExtraDate,
  onRemoveExtraDate,
  repeatEnabled,
  onToggleRepeat,
  repeatWeeks,
  onRepeatWeeks,
}: {
  date: string;
  start: string;
  onDate: (value: string) => void;
  onStart: (value: string) => void;
  availabilityOpen: boolean;
  onToggleAvailability: () => void;
  slots: AvailabilitySlot[];
  onPickSlot: (start: string) => void;
  extraDates: ExtraDateSlot[];
  onAddExtraDate: () => void;
  onUpdateExtraDate: (key: string, patch: Partial<ExtraDateSlot>) => void;
  onRemoveExtraDate: (key: string) => void;
  repeatEnabled: boolean;
  onToggleRepeat: () => void;
  repeatWeeks: number;
  onRepeatWeeks: (weeks: number) => void;
}) {
  const free = slots.filter((slot) => slot.free);
  const busyCount = slots.length - free.length;
  return (
    <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
      <h3 className="text-[15px] font-semibold text-[#1c1e21]">Datum und Uhrzeit</h3>
      <div className="mt-3 rounded-lg border border-[#eef0f3] p-3">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
          Datum und Uhrzeit
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <DateBracket
            value={date}
            onChange={onDate}
            ariaLabel="Datum"
            testId="booking-date"
            className="min-w-[180px] flex-1"
          />
          <TimeBracket
            value={start}
            onChange={onStart}
            ariaLabel="Uhrzeit"
            testId="booking-start"
          />
          <button
            type="button"
            className="h-9 rounded-lg border border-[#e1e4ea] bg-[#f7f8fa] px-3 text-sm hover:bg-[#eef0f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            aria-expanded={availabilityOpen}
            data-testid="booking-availability"
            onClick={onToggleAvailability}
          >
            Verfügbarkeiten
          </button>
        </div>

        {extraDates.map((item, index) => (
          <div
            key={item.key}
            data-testid={`extra-date-row-${index}`}
            className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#f0f2f5] pt-2"
          >
            <DateBracket
              value={item.date}
              onChange={(next) => onUpdateExtraDate(item.key, { date: next })}
              ariaLabel={`Weiteres Datum ${index + 2}`}
              testId={`booking-extra-date-${index}`}
              className="min-w-[180px] flex-1"
            />
            <TimeBracket
              value={item.start}
              onChange={(next) => onUpdateExtraDate(item.key, { start: next })}
              ariaLabel={`Weitere Uhrzeit ${index + 2}`}
              testId={`booking-extra-start-${index}`}
            />
            <button
              type="button"
              aria-label="Weiteres Datum entfernen"
              onClick={() => onRemoveExtraDate(item.key)}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-[#8b919a] hover:bg-[#f4f5f7] hover:text-[#b42318]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <p className="mt-2 text-xs text-[#8b919a]">
          Vorschläge aus Schicht und belegten Zeiten. Gespeichert wird nur über den Buchungsserver.
        </p>
        {availabilityOpen ? (
          <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-[#eef0f3] p-2" data-testid="booking-availability-list">
            {slots.length === 0 ? <p className="text-sm text-[#8b919a]">Keine Schicht an diesem Tag.</p> : null}
            <div className="flex flex-wrap gap-1">
              {free.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  className="h-7 rounded-md border border-[#e1e4ea] px-2 text-xs hover:bg-[#f4f5f7]"
                  onClick={() => onPickSlot(slot.start)}
                >
                  {slot.start}–{slot.end}
                </button>
              ))}
            </div>
            {busyCount > 0 ? <p className="mt-2 text-xs text-[#8b919a]">{busyCount} Zeiten sind belegt.</p> : null}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        data-testid="booking-add-date"
        className="mt-3 text-sm font-medium text-[var(--brand-purple)] hover:underline"
        onClick={onAddExtraDate}
      >
        + Weiteres Datum
      </button>
      <div className="mt-4 border-t border-[#eef0f3] pt-3">
        <button
          type="button"
          role="switch"
          aria-checked={repeatEnabled}
          className="flex w-full items-center gap-2 text-left"
          onClick={onToggleRepeat}
          data-testid="booking-repeat"
        >
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              repeatEnabled ? "bg-[#111827]" : "bg-[#e4e7ec]",
            )}
            aria-hidden
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                repeatEnabled ? "translate-x-4" : "left-0.5",
              )}
            />
          </span>
          <span>
            <span className="block text-sm font-medium">Termin wiederholen</span>
            <span className="block text-xs text-[#8b919a]">Diesen Termin regelmäßig wiederholen.</span>
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-[#8b919a] transition-transform",
              repeatEnabled && "rotate-180",
            )}
          />
        </button>
        {repeatEnabled ? (
          <div className="mt-2 flex flex-wrap gap-1.5 pl-11" data-testid="booking-repeat-options">
            {[
              { weeks: 1, label: "Wöchentlich" },
              { weeks: 2, label: "Alle 2 Wochen" },
              { weeks: 4, label: "Alle 4 Wochen" },
            ].map((item) => (
              <button
                key={item.weeks}
                type="button"
                onClick={() => onRepeatWeeks(item.weeks)}
                className={cn(
                  "h-7 rounded-md border px-2.5 text-xs",
                  repeatWeeks === item.weeks
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#e1e4ea] bg-white text-[#1c1e21] hover:bg-[#f4f5f7]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
