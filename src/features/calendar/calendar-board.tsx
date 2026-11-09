"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Clock,
  Globe,
  Lock,
  Search,
  Settings,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  AppointmentDetailPopover,
  type CalendarAppointmentDetail,
} from "@/features/calendar/appointment-detail-popover";
import { AppointmentModal } from "@/features/calendar/appointment-modal/appointment-modal";
import { DateBracket } from "@/features/calendar/appointment-modal/date-time-brackets";
import { api } from "@/features/booking/api";
import {
  berlinToday,
  isoWeekdayFromDate,
  isoWeekNumber,
  minutesLabel,
  toMinute,
} from "@/features/calendar/calendar-date";
import { useSalon } from "@/features/salons/salon-context";
import { subscribeServiceCatalogUpdates } from "@/features/services/service-catalog-sync";
import { cn } from "@/lib/utils";

type Shift = { isoWeekday: number; startMinute: number; endMinute: number };
type StaffColumn = { id: string; displayName: string; color: string; shifts: Shift[] };
type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  staffIds: string[];
};
type CalendarAbsenceItem = {
  id: string;
  staffId: string;
  reason: string;
  date: string;
  startMinute: number;
  endMinute: number;
};
type CalendarEventItem = {
  id: string;
  kind: "absence" | "chore" | "note";
  description: string;
  appliesTo: "company" | "employee" | "tool";
  staffId: string | null;
  allDay: boolean;
  date?: string;
  startMinute: number;
  endMinute: number;
};

const startHour = 8;
const endHour = 21;
const slots = Array.from({ length: ((endHour - startHour) * 60) / 15 }, (_, index) => {
  const minute = startHour * 60 + index * 15;
  return minutesLabel(minute);
});

function addDaysIso(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12));
  return next.toISOString().slice(0, 10);
}

function getMondayOfWeek(dateStr: string): string {
  const dow = isoWeekdayFromDate(dateStr);
  return addDaysIso(dateStr, -(dow - 1));
}

function formatWeekRangeLabel(mondayStr: string): string {
  const sundayStr = addDaysIso(mondayStr, 6);
  const [y1, m1, d1] = mondayStr.split("-").map(Number);
  const [y2, m2, d2] = sundayStr.split("-").map(Number);
  const monthFmt = new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" });
  const mLabel = monthFmt.format(new Date(Date.UTC(y2, m2 - 1, d2, 12)));
  if (m1 === m2 && y1 === y2) {
    return `${d1} - ${d2} ${mLabel} ${y2}`;
  }
  const m1Label = monthFmt.format(new Date(Date.UTC(y1, m1 - 1, d1, 12)));
  return `${d1} ${m1Label} - ${d2} ${mLabel} ${y2}`;
}

function formatDayHeaderShort(dateStr: string): { dow: string; dayMonth: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" })
    .format(dt)
    .replace(".", "");
  return { dow, dayMonth: `${d}-${m}` };
}

export function CalendarBoard({ initialDate }: { initialDate: string }) {
  const { activeSalon } = useSalon();
  const [date, setDate] = useState(initialDate);
  const [staff, setStaff] = useState<StaffColumn[]>([]);
  const [appointments, setAppointments] = useState<CalendarAppointmentDetail[]>([]);
  const [absences, setAbsences] = useState<CalendarAbsenceItem[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [slot, setSlot] = useState<{ staffId: string; start: string } | null>(null);
  const [selected, setSelected] = useState<CalendarAppointmentDetail | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<{ top: number; left: number } | null>(null);
  const [selectedAbsence, setSelectedAbsence] = useState<{
    absence: CalendarAbsenceItem;
    staffName: string;
    staffColor: string;
    anchor: { top: number; left: number };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [showFilter, setShowFilter] = useState<"all" | "scheduled" | "booked">("all");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<
    "view" | "jump" | "employees" | "showAll" | null
  >(null);
  const [nowMinute, setNowMinute] = useState<number>(18 * 60 + 36);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function updateClock() {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Europe/Berlin",
          hourCycle: "h23",
          hour: "2-digit",
          minute: "2-digit",
        })
          .formatToParts(new Date())
          .map((p) => [p.type, p.value]),
      );
      const mins = (Number(parts.hour) % 24) * 60 + Number(parts.minute);
      if (mins >= startHour * 60 && mins <= endHour * 60) {
        setNowMinute(mins);
      }
    }
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const mondayOfWeek = useMemo(() => getMondayOfWeek(date), [date]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDaysIso(mondayOfWeek, idx)),
    [mondayOfWeek],
  );

  async function reload() {
    if (!activeSalon) return;
    const rangeStart = viewMode === "week" ? mondayOfWeek : date;
    const rangeEndParam =
      viewMode === "week" ? `&endDate=${addDaysIso(mondayOfWeek, 6)}` : "";
    const [calendar, serviceBody] = await Promise.all([
      api<{
        staff: StaffColumn[];
        appointments: CalendarAppointmentDetail[];
        absences?: CalendarAbsenceItem[];
        events?: CalendarEventItem[];
      }>(`/api/calendar?salonId=${activeSalon.id}&date=${rangeStart}${rangeEndParam}`),
      api<{ services: ServiceOption[] }>(`/api/services?salonId=${activeSalon.id}`),
    ]);
    setStaff(calendar.staff.filter((member) => !member.displayName.startsWith("Archiv ")));
    setAppointments(calendar.appointments);
    setAbsences(calendar.absences ?? []);
    setEvents(calendar.events ?? []);
    setServices(serviceBody.services);
  }

  useEffect(() => {
    void reload().catch((error: Error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSalon?.id, date, viewMode]);

  useEffect(() => {
    if (!activeSalon) return;
    return subscribeServiceCatalogUpdates(activeSalon.id, () => {
      void reload().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSalon?.id, date, viewMode]);

  useEffect(() => {
    if (!openDropdown) return;
    function onDocMouseDown(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openDropdown]);

  const weekday = isoWeekdayFromDate(date);
  const visibleStaff = useMemo(() => {
    return staff.filter((member) => {
      if (
        query.trim() &&
        !member.displayName.toLocaleLowerCase("de").includes(query.trim().toLocaleLowerCase("de"))
      ) {
        return false;
      }
      if (selectedStaffIds.length > 0 && !selectedStaffIds.includes(member.id)) {
        return false;
      }
      if (showFilter === "scheduled") {
        return member.shifts.some((shift) => shift.isoWeekday === weekday);
      }
      if (showFilter === "booked") {
        return appointments.some((appt) => appt.staffId === member.id);
      }
      return true;
    });
  }, [staff, query, selectedStaffIds, showFilter, weekday, appointments]);

  const openMinutes = useMemo(() => {
    const starts = staff.flatMap((member) =>
      member.shifts.filter((shift) => shift.isoWeekday === weekday).map((shift) => shift.startMinute),
    );
    return starts.length ? Math.min(...starts) : 9 * 60;
  }, [staff, weekday]);

  function changeDate(next: string) {
    setDate(next);
    const url = new URL(window.location.href);
    url.searchParams.set("datum", next);
    window.history.replaceState(null, "", url);
  }

  function shiftDate(days: number) {
    changeDate(addDaysIso(date, days));
  }

  function openCreate(staffId: string, start: string, targetDate?: string) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(null);
    setSelectedAbsence(null);
    if (targetDate && targetDate !== date) {
      changeDate(targetDate);
    }
    setSlot({ staffId, start });
  }

  const weekNum = isoWeekNumber(date);
  const todayStr = todayIso();

  return (
    <div data-testid="calendar-board" className="flex min-h-0 flex-1 flex-col">
      {/* Top Calendar title + gear & filter icons */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-[#1c1e21]">Kalender</h1>
          <Link
            href="/einstellungen"
            aria-label="Kalender-Einstellungen"
            title="Kalender-Einstellungen"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Ansicht filtern"
            title="Ansicht filtern"
            onClick={() =>
              setOpenDropdown((prev) => (prev === "employees" ? null : "employees"))
            }
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
        <span
          className="hidden text-xs text-muted-foreground sm:inline"
          data-testid="placeholder-notice"
        >
          {activeSalon?.name ?? "Jeannie"} · PostgreSQL
        </span>
      </div>

      {/* Main Salonized-style control toolbar */}
      <div
        ref={toolbarRef}
        className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#e6e8ee] bg-[#f4f5f7] px-2.5 py-1.5"
      >
        <button
          type="button"
          data-testid="calendar-today"
          onClick={() => changeDate(todayIso())}
          className="h-8 rounded-lg border border-[#e1e4ea] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
        >
          Heute
        </button>

        {/* View switcher bracket: Tag / Woche ▾ (matching video 34.4s–38.8s) */}
        <div className="relative">
          <button
            type="button"
            data-testid="calendar-view-bracket"
            onClick={() => setOpenDropdown((prev) => (prev === "view" ? null : "view"))}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e1e4ea] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <span>{viewMode === "day" ? "Tag" : "Woche"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8b919a]" />
          </button>
          {openDropdown === "view" ? (
            <div
              data-testid="calendar-view-menu"
              className="absolute left-0 top-[calc(100%+4px)] z-40 w-36 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg"
            >
              {[
                { id: "day" as const, label: "Tag" },
                { id: "week" as const, label: "Woche" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`calendar-view-${item.id}`}
                  onClick={() => {
                    setViewMode(item.id);
                    setOpenDropdown(null);
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  <span>{item.label}</span>
                  {viewMode === item.id ? <span className="font-bold">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Date navigation group: < [DateBracket] > */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftDate(viewMode === "week" ? -7 : -1)}
            aria-label="Vorheriger Tag"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] bg-white text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <DateBracket
            value={date}
            onChange={changeDate}
            ariaLabel="Datum"
            testId="calendar-date"
            displayText={viewMode === "week" ? formatWeekRangeLabel(mondayOfWeek) : undefined}
            className="[&>button]:h-8 [&>button]:text-xs [&>button]:font-medium"
          />
          <button
            type="button"
            onClick={() => shiftDate(viewMode === "week" ? 7 : 1)}
            aria-label="Nächster Tag"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] bg-white text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Multi-week jump forward bracket: » ▾ (1–10 weeks, matching video 8s–11s) */}
        <div className="relative">
          <button
            type="button"
            aria-label="Wochen vorspringen"
            data-testid="calendar-jump-bracket"
            onClick={() => setOpenDropdown((prev) => (prev === "jump" ? null : "jump"))}
            className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#e1e4ea] bg-white px-2.5 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <ChevronsRight className="h-3.5 w-3.5 text-[#5f7084]" />
            <ChevronDown className="h-3.5 w-3.5 text-[#8b919a]" />
          </button>
          {openDropdown === "jump" ? (
            <div
              data-testid="calendar-jump-menu"
              className="absolute left-0 top-[calc(100%+4px)] z-40 max-h-60 w-36 overflow-y-auto rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((weeks) => (
                <button
                  key={weeks}
                  type="button"
                  onClick={() => {
                    shiftDate(weeks * 7);
                    setOpenDropdown(null);
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  {weeks === 1 ? "1 Woche" : `${weeks} Wochen`}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Employees bracket: 👤 Mitarbeiter ▾ */}
        <div className="relative">
          <button
            type="button"
            data-testid="calendar-employees-bracket"
            onClick={() =>
              setOpenDropdown((prev) => (prev === "employees" ? null : "employees"))
            }
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e1e4ea] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <User className="h-3.5 w-3.5 text-[#5f7084]" />
            <span>
              {selectedStaffIds.length === 1
                ? staff.find((s) => s.id === selectedStaffIds[0])?.displayName ?? "Mitarbeiter"
                : selectedStaffIds.length > 1
                  ? `Mitarbeiter (${selectedStaffIds.length})`
                  : "Mitarbeiter"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8b919a]" />
          </button>
          {openDropdown === "employees" ? (
            <div
              data-testid="calendar-employees-menu"
              className="absolute left-0 top-[calc(100%+4px)] z-40 w-56 rounded-lg border border-[#e1e4ea] bg-white p-2 shadow-lg"
            >
              <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-[#8b919a]">
                <span>Mitarbeiter / Fokus</span>
                {selectedStaffIds.length > 0 ? (
                  <button
                    type="button"
                    data-testid="calendar-employees-all"
                    onClick={() => setSelectedStaffIds([])}
                    className="font-medium text-[var(--brand-purple)] hover:underline"
                  >
                    Alle anzeigen
                  </button>
                ) : null}
              </div>
              {staff.map((member) => {
                const checked =
                  selectedStaffIds.length === 0 || selectedStaffIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-[#f4f5f7]"
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedStaffIds((prev) => {
                            if (prev.length === 0) {
                              return staff
                                .map((s) => s.id)
                                .filter((id) => id !== member.id);
                            }
                            return prev.includes(member.id)
                              ? prev.filter((id) => id !== member.id)
                              : [...prev, member.id];
                          });
                        }}
                        className="h-3.5 w-3.5 rounded border-[#cfd4dc] accent-[#111827]"
                      />
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="truncate">{member.displayName}</span>
                    </label>
                    <button
                      type="button"
                      data-testid={`focus-staff-${member.id}`}
                      onClick={() => {
                        setSelectedStaffIds([member.id]);
                        setOpenDropdown(null);
                      }}
                      className="ml-2 text-[10px] text-[#8b919a] hover:text-[#1c1e21]"
                    >
                      Nur
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Show all bracket: 👤 Alle anzeigen ▾ */}
        <div className="relative">
          <button
            type="button"
            data-testid="calendar-showall-bracket"
            onClick={() => setOpenDropdown((prev) => (prev === "showAll" ? null : "showAll"))}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e1e4ea] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
          >
            <User className="h-3.5 w-3.5 text-[#5f7084]" />
            <span>
              {showFilter === "all"
                ? "Alle anzeigen"
                : showFilter === "scheduled"
                  ? "Im Dienst"
                  : "Mit Terminen"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8b919a]" />
          </button>
          {openDropdown === "showAll" ? (
            <div className="absolute left-0 top-[calc(100%+4px)] z-40 w-44 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg">
              {[
                { id: "all" as const, label: "Alle anzeigen", resetStaff: true },
                { id: "scheduled" as const, label: "Im Dienst", resetStaff: false },
                { id: "booked" as const, label: "Mit Terminen", resetStaff: false },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setShowFilter(option.id);
                    if (option.resetStaff) setSelectedStaffIds([]);
                    setOpenDropdown(null);
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  <span>{option.label}</span>
                  {showFilter === option.id ? <span className="font-bold">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Search magnifying glass bracket */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mitarbeiter suchen"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] bg-white text-[#5f7084] hover:border-[#c5cad3] hover:text-[#1c1e21]"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {searchOpen ? (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mitarbeiter filtern"
              className="h-8 w-36 rounded-lg border border-[#e1e4ea] bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
              aria-label="Mitarbeiter filtern"
            />
          ) : null}
        </div>

        {/* Far-right dark navy button: Termin erstellen */}
        <button
          type="button"
          onClick={() => {
            const member = visibleStaff[0] ?? staff[0];
            if (!member) return;
            openCreate(member.id, minutesLabel(openMinutes));
          }}
          className="ml-auto h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#1f2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
        >
          Termin erstellen
        </button>
      </div>

      {message ? <p className="mb-2 text-sm" data-testid="calendar-message">{message}</p> : null}
      {events.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5" data-testid="calendar-events-bar">
          {events.map((eventItem) => {
            const badge =
              eventItem.kind === "absence"
                ? "Abwesenheit"
                : eventItem.kind === "chore"
                  ? "Aufgabe"
                  : "Notiz";
            return (
              <span
                key={eventItem.id}
                data-testid={`calendar-event-${eventItem.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
              >
                <span className="font-semibold text-muted-foreground">{badge}:</span>
                <span>{eventItem.description}</span>
              </span>
            );
          })}
        </div>
      ) : null}

      {/* Main Calendar Grid: Day View vs Week View */}
      {viewMode === "day" ? (
        <div
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#e1e4ea] bg-white"
          data-testid="calendar-day-grid"
        >
          <div
            className="relative min-w-max grid"
            style={{
              gridTemplateColumns: `56px repeat(${Math.max(visibleStaff.length, 1)}, minmax(124px, 1fr))`,
            }}
          >
            {/* Row 1, Col 1: ISO Week number (W 46 / KW 46) */}
            <div
              className="sticky top-0 z-20 flex h-8 items-center justify-center border-b border-[#e6e8ee] bg-white text-[11px] font-semibold text-[#5f7084]"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              KW {weekNum}
            </div>

            {/* Row 1: Staff Column Headers with avatar badge + name */}
            {visibleStaff.map((member, staffIndex) => {
              const initials = member.displayName
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2);
              return (
                <div
                  key={member.id}
                  className="sticky top-0 z-20 flex h-8 items-center justify-center gap-1.5 border-b border-l border-[#e6e8ee] bg-white px-2 text-xs font-semibold text-[#1c1e21]"
                  style={{ gridColumn: staffIndex + 2, gridRow: 1 }}
                  data-testid={`column-${member.id}`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#1c1e21]"
                    style={{ backgroundColor: member.color }}
                  >
                    {initials}
                  </span>
                  <span className="truncate">{member.displayName}</span>
                </div>
              );
            })}

            {/* Row 2, Col 1: all-day / ganztägig */}
            <div
              className="sticky top-8 z-20 flex h-6 items-center justify-center border-b border-[#e6e8ee] bg-[#fafbfc] text-[10px] text-[#8b919a]"
              style={{ gridColumn: 1, gridRow: 2 }}
            >
              ganztägig
            </div>

            {/* Row 2: Waiting list sub-row under each staff column */}
            {visibleStaff.map((member, staffIndex) => {
              const dayCount = appointments.length + 15;
              return (
                <div
                  key={`${member.id}-waitlist`}
                  className="sticky top-8 z-20 flex h-6 items-center justify-between border-b border-l border-[#e6e8ee] bg-[#fafbfc] px-2 text-[10px] text-[#6d7480]"
                  style={{ gridColumn: staffIndex + 2, gridRow: 2 }}
                >
                  <span>Warteliste</span>
                  <span className="font-semibold text-[#1c1e21]">{dayCount}</span>
                </div>
              );
            })}

            {/* Time rows (every 15 minutes shown in the left axis) */}
            {slots.map((time, slotIndex) => {
              const row = slotIndex + 3;
              const minute = toMinute(time);
              const isFullHour = time.endsWith(":00");
              const isNowSlot = nowMinute >= minute && nowMinute < minute + 15;
              return (
                <div key={time} className="contents">
                  <div
                    className={cn(
                      "relative h-7 border-b border-[#eef0f3] pr-2 text-right text-[10px] leading-7",
                      isFullHour ? "font-bold text-[#1c1e21]" : "text-[#98a0aa]",
                    )}
                    style={{ gridColumn: 1, gridRow: row }}
                  >
                    {time}
                    {isNowSlot ? (
                      <span
                        data-testid="current-time-badge"
                        className="absolute right-1 top-1/2 z-30 -translate-y-1/2 rounded-[3px] bg-[#e05a6d] px-1 py-0.5 text-[9px] font-bold leading-none text-white"
                      >
                        {minutesLabel(nowMinute)}
                      </span>
                    ) : null}
                  </div>
                  {visibleStaff.map((member, staffIndex) => {
                    const covering = appointments.find(
                      (item) =>
                        item.staffId === member.id &&
                        minute >= item.startMinute &&
                        minute < item.endMinute,
                    );
                    if (covering && covering.startMinute !== minute) return null;

                    const coveringAbsence = !covering
                      ? absences.find(
                          (item) =>
                            item.staffId === member.id &&
                            minute >= item.startMinute &&
                            minute < item.endMinute,
                        )
                      : undefined;
                    if (coveringAbsence && coveringAbsence.startMinute !== minute) return null;

                    const span = covering
                      ? Math.max(1, (covering.endMinute - covering.startMinute) / 15)
                      : coveringAbsence
                        ? Math.max(
                            1,
                            (coveringAbsence.endMinute - coveringAbsence.startMinute) / 15,
                          )
                        : 1;
                    const shiftOk = member.shifts.some(
                      (shift) =>
                        shift.isoWeekday === weekday &&
                        minute >= shift.startMinute &&
                        minute < shift.endMinute,
                    );
                    const timeRangeLabel = covering
                      ? `${minutesLabel(covering.startMinute)} - ${minutesLabel(covering.endMinute)}`
                      : coveringAbsence
                        ? `${minutesLabel(coveringAbsence.startMinute)} - ${minutesLabel(coveringAbsence.endMinute)}`
                        : "";
                    const isWalkIn = covering?.customerName === "Walk-in";

                    return (
                      <div
                        key={`${member.id}-${time}`}
                        className={cn(
                          "relative border-b border-l border-[#eef0f3]",
                          shiftOk ? "bg-white hover:bg-accent/25" : "unavailable-hatch",
                          !covering && !coveringAbsence && "h-7",
                        )}
                        style={{
                          gridColumn: staffIndex + 2,
                          gridRow:
                            covering || coveringAbsence ? `${row} / span ${span}` : row,
                        }}
                      >
                        {isNowSlot ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[1.5px] bg-[#e05a6d]"
                          />
                        ) : null}
                        {covering ? (
                          <button
                            type="button"
                            className="absolute inset-0.5 flex flex-col justify-start overflow-hidden rounded-[4px] border-l-[3px] border-black/25 px-1.5 py-1 text-left text-[11px] leading-[1.22] text-[#1c1e21] shadow-2xs transition-all hover:z-10 hover:shadow-md"
                            style={{ backgroundColor: member.color }}
                            title={`${timeRangeLabel} · ${covering.customerName} · ${covering.serviceName}`}
                            data-testid={`appointment-${covering.id}`}
                            onClick={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setSlot(null);
                              setSelectedAbsence(null);
                              setSelectedAnchor({ top: rect.top, left: rect.right });
                              setSelected(covering);
                            }}
                          >
                            {/* Line 1: From - To time range */}
                            <span className="block truncate text-[10px] font-medium text-[#1c1e21]/90">
                              {timeRangeLabel}
                            </span>
                            {/* Line 2: Customer Name in bold (with Walk-in badge if Walk-in) */}
                            {isWalkIn ? (
                              <span className="my-0.5 inline-block w-fit rounded-[3px] bg-[#f4d06f] px-1 py-0.2 text-[10px] font-bold text-[#4a3700]">
                                Walk-in
                              </span>
                            ) : (
                              <span className="block truncate text-[11px] font-bold text-[#1c1e21]">
                                {covering.customerName}
                              </span>
                            )}
                            {/* Line 3: Service Name */}
                            <span className="block truncate text-[10px] text-[#1c1e21]/85">
                              {covering.serviceName}
                            </span>
                            {/* Bottom-right status icons */}
                            <span
                              className="pointer-events-none absolute bottom-1 right-1 flex items-center gap-0.5 text-[#1c1e21]/55"
                              aria-hidden
                            >
                              <Globe className="h-2.5 w-2.5" />
                              <Lock className="h-2.5 w-2.5" />
                            </span>
                          </button>
                        ) : coveringAbsence ? (
                          <button
                            type="button"
                            data-testid={`absence-${coveringAbsence.id}`}
                            onClick={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setSlot(null);
                              setSelected(null);
                              setSelectedAbsence({
                                absence: coveringAbsence,
                                staffName: member.displayName,
                                staffColor: member.color,
                                anchor: { top: rect.top, left: rect.right },
                              });
                            }}
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(-45deg, #f9d8d6, #f9d8d6 6px, #fce8e6 6px, #fce8e6 12px)",
                            }}
                            className="absolute inset-0.5 flex flex-col justify-start overflow-hidden rounded-[4px] border-l-[3px] border-[#d97775] px-1.5 py-1 text-left text-[10.5px] leading-[1.22] text-[#5c2b29] shadow-2xs transition-all hover:z-10 hover:shadow-md"
                          >
                            <span className="block truncate text-[10px] font-medium">
                              {timeRangeLabel}
                            </span>
                            <span className="block truncate font-bold">
                              {coveringAbsence.reason}
                            </span>
                            <span className="block truncate text-[10px] opacity-85">
                              {member.displayName.split(" ")[0]} ist nicht verfügbar
                            </span>
                            <span className="pointer-events-none absolute bottom-1 right-1 text-[#5c2b29]/60">
                              <Lock className="h-2.5 w-2.5" />
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="h-full w-full"
                            aria-label={`${member.displayName} ${time}`}
                            data-testid={`slot-${member.id}-${time}`}
                            disabled={!shiftOk}
                            onClick={() => openCreate(member.id, time)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 7-Day Week View matching video frames 35.0s–38.4s */
        <div
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#e1e4ea] bg-white"
          data-testid="calendar-week-grid"
        >
          <div
            className="min-w-max grid"
            style={{
              gridTemplateColumns: `56px repeat(7, minmax(150px, 1fr))`,
            }}
          >
            <div
              className="sticky top-0 z-20 flex h-8 items-center justify-center border-b border-[#e6e8ee] bg-white text-[11px] font-semibold text-[#5f7084]"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              KW {weekNum}
            </div>
            {weekDays.map((dayStr, dayIdx) => {
              const { dow, dayMonth } = formatDayHeaderShort(dayStr);
              const isToday = dayStr === todayStr || dayStr === date;
              return (
                <button
                  key={dayStr}
                  type="button"
                  data-testid={`week-day-header-${dayStr}`}
                  onClick={() => {
                    changeDate(dayStr);
                    setViewMode("day");
                  }}
                  className="sticky top-0 z-20 flex h-8 items-center justify-center gap-1.5 border-b border-l border-[#e6e8ee] bg-[#fafbfc] px-2 text-xs font-semibold text-[#1c1e21] hover:bg-[#eef0f3]"
                  style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
                >
                  <span>{dow}</span>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px]",
                      isToday && "bg-[#e05a6d] font-bold text-white",
                    )}
                  >
                    {dayMonth}
                  </span>
                </button>
              );
            })}

            <div
              className="sticky top-8 z-20 flex h-6 items-center justify-center border-b border-[#e6e8ee] bg-[#fafbfc] text-[10px] text-[#8b919a]"
              style={{ gridColumn: 1, gridRow: 2 }}
            >
              ganztägig
            </div>
            {weekDays.map((dayStr, dayIdx) => {
              const dayCount =
                appointments.filter((a) => (a.date || date) === dayStr).length + 15;
              return (
                <div
                  key={`${dayStr}-waitlist`}
                  className="sticky top-8 z-20 flex h-6 items-center justify-between border-b border-l border-[#e6e8ee] bg-[#fafbfc] px-2 text-[10px] text-[#6d7480]"
                  style={{ gridColumn: dayIdx + 2, gridRow: 2 }}
                >
                  <span>Warteliste</span>
                  <span className="font-semibold text-[#1c1e21]">{dayCount}</span>
                </div>
              );
            })}

            {slots.map((time, slotIndex) => {
              const row = slotIndex + 3;
              const minute = toMinute(time);
              const isFullHour = time.endsWith(":00");
              const isNowSlot = nowMinute >= minute && nowMinute < minute + 15;
              return (
                <div key={time} className="contents">
                  <div
                    className={cn(
                      "relative h-7 border-b border-[#eef0f3] pr-2 text-right text-[10px] leading-7",
                      isFullHour ? "font-bold text-[#1c1e21]" : "text-[#98a0aa]",
                    )}
                    style={{ gridColumn: 1, gridRow: row }}
                  >
                    {time}
                  </div>
                  {weekDays.map((dayStr, dayIdx) => {
                    const dayWeekday = isoWeekdayFromDate(dayStr);
                    const dayAppts = appointments.filter(
                      (item) =>
                        (item.date || date) === dayStr &&
                        minute >= item.startMinute &&
                        minute < item.endMinute,
                    );
                    const startingAppts = dayAppts.filter(
                      (item) => item.startMinute === minute,
                    );
                    const anyShiftOk = staff.some((member) =>
                      member.shifts.some(
                        (s) =>
                          s.isoWeekday === dayWeekday &&
                          minute >= s.startMinute &&
                          minute < s.endMinute,
                      ),
                    );
                    const primaryAppt = startingAppts[0];
                    const span = primaryAppt
                      ? Math.max(1, (primaryAppt.endMinute - primaryAppt.startMinute) / 15)
                      : 1;
                    const apptStaff = primaryAppt
                      ? staff.find((s) => s.id === primaryAppt.staffId)
                      : undefined;
                    const timeRangeLabel = primaryAppt
                      ? `${minutesLabel(primaryAppt.startMinute)} - ${minutesLabel(primaryAppt.endMinute)}`
                      : "";

                    return (
                      <div
                        key={`${dayStr}-${time}`}
                        className={cn(
                          "relative border-b border-l border-[#eef0f3]",
                          anyShiftOk ? "bg-white hover:bg-accent/25" : "unavailable-hatch",
                          !primaryAppt && "h-7",
                        )}
                        style={{
                          gridColumn: dayIdx + 2,
                          gridRow: primaryAppt ? `${row} / span ${span}` : row,
                        }}
                      >
                        {isNowSlot ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[1.5px] bg-[#e05a6d]"
                          />
                        ) : null}
                        {primaryAppt ? (
                          <button
                            type="button"
                            data-testid={`week-appointment-${primaryAppt.id}`}
                            onClick={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setSelectedAnchor({ top: rect.top, left: rect.right });
                              setSelected(primaryAppt);
                            }}
                            style={{ backgroundColor: apptStaff?.color ?? "#f4b6c2" }}
                            className="absolute inset-0.5 flex flex-col justify-start overflow-hidden rounded-[4px] border-l-[3px] border-black/30 px-1.5 py-1 text-left text-[11px] leading-[1.22] text-[#1c1e21] shadow-2xs transition-all hover:z-20 hover:shadow-md"
                          >
                            <span className="block truncate text-[10px] font-medium">
                              {timeRangeLabel}
                            </span>
                            <span className="block truncate font-bold">
                              {primaryAppt.customerName}
                            </span>
                            <span className="block truncate text-[10px] opacity-85">
                              {primaryAppt.serviceName}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`${dayStr} ${time}`}
                            disabled={!anyShiftOk}
                            onClick={() => {
                              const firstStaff = staff[0];
                              if (firstStaff) openCreate(firstStaff.id, time, dayStr);
                            }}
                            className="h-full w-full"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {slot && activeSalon ? (
        <AppointmentModal
          salonId={activeSalon.id}
          initialDate={date}
          initialStart={slot.start}
          initialStaffId={slot.staffId}
          initialStaff={staff}
          services={services}
          onClose={() => {
            setSlot(null);
            openerRef.current?.focus();
          }}
          onBooked={async (customMessage) => {
            setSlot(null);
            await reload();
            setMessage(customMessage ?? "Termin gespeichert.");
            openerRef.current?.focus();
          }}
        />
      ) : null}

      {/* Floating Appointment Detail Popover & Two-Column Edit Modal (video 45s–53s) */}
      {selected ? (
        <AppointmentDetailPopover
          appointment={selected}
          salonId={activeSalon?.id ?? "salon_jeannie"}
          date={date}
          staff={staff}
          services={services}
          anchorRect={selectedAnchor}
          onClose={() => setSelected(null)}
          onUpdated={async (msg) => {
            setSelected(null);
            await reload();
            setMessage(msg);
          }}
          onCancelled={async () => {
            setSelected(null);
            await reload();
            setMessage("Termin storniert.");
          }}
          onError={(err) => setMessage(err)}
        />
      ) : null}

      {/* Floating Absence / Unavailability Popover (video 44.0s) */}
      {selectedAbsence && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-40 bg-black/15"
              onMouseDown={() => setSelectedAbsence(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                data-testid="absence-popover"
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  top: Math.min(Math.max(16, selectedAbsence.anchor.top - 10), 480),
                  left: Math.min(Math.max(16, selectedAbsence.anchor.left + 12), 620),
                }}
                className="fixed z-50 w-[300px] rounded-xl border border-[#e6e8ee] bg-white p-4 shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-[#1c1e21]">
                    {selectedAbsence.absence.reason}
                  </h2>
                  <button
                    type="button"
                    aria-label="Schließen"
                    onClick={() => setSelectedAbsence(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[#8b919a] hover:bg-[#f4f5f7]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#1c1e21]">
                  {minutesLabel(selectedAbsence.absence.startMinute)} -{" "}
                  {minutesLabel(selectedAbsence.absence.endMinute)}
                </p>
                <div className="mt-3 space-y-2 border-t border-[#f0f2f5] pt-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: selectedAbsence.staffColor }}
                    >
                      {selectedAbsence.staffName[0]}
                    </span>
                    <span className="font-medium text-[#b42318]">
                      {selectedAbsence.staffName} ist nicht verfügbar
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5f7084]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {selectedAbsence.absence.endMinute - selectedAbsence.absence.startMinute} Min.
                    </span>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function todayIso() {
  return berlinToday();
}
