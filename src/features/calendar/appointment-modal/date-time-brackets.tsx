"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { formatLongDate, isoWeekNumber, minutesLabel } from "@/features/calendar/calendar-date";
import { cn } from "@/lib/utils";

const weekdayHeaders = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function parseYmd(value: string): { year: number; month: number; day: number } {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  return { year: y, month: m, day: d };
}

function formatYmd(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DateBracket({
  value,
  onChange,
  ariaLabel = "Datum",
  testId,
  displayText,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  testId?: string;
  displayText?: string;
  className?: string;
}) {
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseYmd(value), [value]);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  useEffect(() => {
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [parsed.year, parsed.month]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const calendarWeeks = useMemo(() => {
    const first = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
    const firstDowMonday0 = (first.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
    const cells: { day: number; dateStr: string; currentMonth: boolean }[] = [];
    const prevDays = new Date(Date.UTC(viewYear, viewMonth - 1, 0)).getUTCDate();
    for (let i = firstDowMonday0 - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = viewMonth === 1 ? 12 : viewMonth - 1;
      const py = viewMonth === 1 ? viewYear - 1 : viewYear;
      cells.push({ day: d, dateStr: formatYmd(py, pm, d), currentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateStr: formatYmd(viewYear, viewMonth, d), currentMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const d = cells.length - (firstDowMonday0 + daysInMonth) + 1;
      const nm = viewMonth === 12 ? 1 : viewMonth + 1;
      const ny = viewMonth === 12 ? viewYear + 1 : viewYear;
      cells.push({ day: d, dateStr: formatYmd(ny, nm, d), currentMonth: false });
    }
    const weeks: { weekNumber: number; days: typeof cells }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const slice = cells.slice(i, i + 7);
      weeks.push({
        weekNumber: isoWeekNumber(slice[0].dateStr),
        days: slice,
      });
    }
    return weeks;
  }, [viewYear, viewMonth]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(viewYear, viewMonth - 1, 15)));
  }, [viewYear, viewMonth]);

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth() + 1);
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-[130px]", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        data-testid={testId ? `${testId}-trigger` : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#e1e4ea] bg-white px-3 text-left text-sm text-[#1c1e21] hover:border-[#c5cad3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
      >
        <span className="truncate">{displayText ?? formatLongDate(value)}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#8b919a] motion-safe:transition-transform motion-safe:duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      <input
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        data-focus-skip="true"
        value={value}
        data-testid={testId}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
        className="sr-only"
      />
      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`${ariaLabel} Kalender`}
          data-testid={testId ? `${testId}-calendar` : "date-bracket-calendar"}
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-[280px] rounded-xl border border-[#e1e4ea] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Vorheriger Monat"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#5f7084] hover:bg-[#f4f5f7]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold capitalize text-[#1c1e21]">{monthLabel}</span>
            <button
              type="button"
              aria-label="Nächster Monat"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#5f7084] hover:bg-[#f4f5f7]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-0.5 text-center text-[10px] font-medium text-[#8b919a]">
            <span className="py-1 text-[#b0b6be]">KW</span>
            {weekdayHeaders.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div className="mt-0.5 space-y-0.5">
            {calendarWeeks.map((week) => (
              <div key={week.weekNumber} className="grid grid-cols-8 items-center gap-0.5">
                <span className="text-center text-[10px] font-medium text-[#98a0aa]">
                  {week.weekNumber}
                </span>
                {week.days.map((cell) => {
                  const selected = cell.dateStr === value;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => {
                        onChange(cell.dateStr);
                        setOpen(false);
                        buttonRef.current?.focus();
                      }}
                      className={cn(
                        "flex h-7 w-7 mx-auto items-center justify-center rounded-full text-xs",
                        selected
                          ? "bg-[#111827] font-semibold text-white"
                          : cell.currentMonth
                            ? "text-[#1c1e21] hover:bg-[#f4f5f7]"
                            : "text-[#b0b6be] hover:bg-[#f4f5f7]",
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const timeOptions = Array.from({ length: ((22 - 7) * 60) / 15 + 1 }, (_, index) =>
  minutesLabel(7 * 60 + index * 15),
);

export function TimeBracket({
  value,
  onChange,
  ariaLabel = "Uhrzeit",
  testId,
  disabled,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  testId?: string;
  disabled?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-[62px]", className)}>
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-[#e1e4ea] bg-white px-2 text-sm text-[#1c1e21] hover:border-[#c5cad3] focus-within:ring-2 focus-within:ring-[var(--brand-ring)]",
          disabled && "cursor-not-allowed bg-[#f4f5f7] text-[#98a0aa]",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={value}
          aria-label={ariaLabel}
          data-testid={testId}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer bg-transparent text-center text-sm focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      {open && !disabled ? (
        <div
          role="listbox"
          aria-label={`${ariaLabel} Auswahl`}
          data-testid={testId ? `${testId}-list` : "time-bracket-list"}
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-52 w-[96px] overflow-y-auto rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-xl"
        >
          {timeOptions.map((slot) => (
            <button
              key={slot}
              type="button"
              role="option"
              aria-selected={slot === value}
              onClick={() => {
                onChange(slot);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-center px-2 py-1 text-xs hover:bg-[#f4f5f7]",
                slot === value && "bg-[#eef0f3] font-semibold text-[#1c1e21]",
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
