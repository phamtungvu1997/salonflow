"use client";

import { useMemo, useState } from "react";

import {
  type AbsenceRecord,
  type NationalHolidayRow,
  type SalonSettingsRecord,
  type StaffMemberRecord,
  formatMinutesToHHMM,
} from "./settings-types";

const WEEKDAYS: { iso: number; shortLabel: string; dayNum: string }[] = [
  { iso: 1, shortLabel: "Mo", dayNum: "09" },
  { iso: 2, shortLabel: "Di", dayNum: "10" },
  { iso: 3, shortLabel: "Mi", dayNum: "11" },
  { iso: 4, shortLabel: "Do", dayNum: "12" },
  { iso: 5, shortLabel: "Fr", dayNum: "13" },
  { iso: 6, shortLabel: "Sa", dayNum: "14" },
  { iso: 7, shortLabel: "So", dayNum: "15" },
];

export function TimetableSettingsSection({
  salonId,
  salonName,
  staff,
  onRefresh,
}: {
  salonId: string;
  salonName: string;
  staff: StaffMemberRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [editingCell, setEditingCell] = useState<{
    staffMember: StaffMemberRecord;
    isoWeekday: number;
  } | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [repeatRule, setRepeatRule] = useState("weekly");
  const [endsRule, setEndsRule] = useState<"never" | "date">("never");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  function openEditRosterModal(member: StaffMemberRecord, isoWeekday: number) {
    const existing = member.shifts.find((s) => s.isoWeekday === isoWeekday);
    setEditingCell({ staffMember: member, isoWeekday });
    setStartTime(existing ? formatMinutesToHHMM(existing.startMinute) : "09:00");
    setEndTime(existing ? formatMinutesToHHMM(existing.endMinute) : "19:00");
    setRepeatRule("weekly");
    setEndsRule("never");
  }

  async function saveUpdatedRoster(removeDay: boolean) {
    if (!editingCell) return;
    setSaving(true);
    setFeedback(null);
    setConflictWarning(null);
    try {
      const { staffMember, isoWeekday } = editingCell;
      const otherShifts = staffMember.shifts
        .filter((s) => s.isoWeekday !== isoWeekday)
        .map((s) => ({
          isoWeekday: s.isoWeekday,
          start: formatMinutesToHHMM(s.startMinute),
          end: formatMinutesToHHMM(s.endMinute),
        }));

      const nextShifts = removeDay
        ? otherShifts
        : [
            ...otherShifts,
            {
              isoWeekday,
              start: startTime,
              end: endTime,
            },
          ];

      const res = await fetch(`/api/staff/${staffMember.id}/hours`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          shifts: nextShifts,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { conflicts?: string[] };
        const dayLabel =
          WEEKDAYS.find((d) => d.iso === isoWeekday)?.shortLabel ?? String(isoWeekday);
        setFeedback(
          removeDay
            ? `Schicht für ${staffMember.displayName} (${dayLabel}) wurde entfernt.`
            : `Arbeitszeit für ${staffMember.displayName} (${dayLabel}: ${startTime} - ${endTime}) gespeichert.`,
        );
        if (body.conflicts && body.conflicts.length > 0) {
          setConflictWarning(
            `Hinweis: ${body.conflicts.length} bestehende Termine liegen außerhalb der neuen Arbeitszeit und bleiben geschützt erhalten.`,
          );
        }
      }
      setEditingCell(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-timetable" className="space-y-5">
      {/* Header & Week Navigator matching video 01:45 – 01:60 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Arbeitszeiten (Dienstplan)</h2>
          <p className="text-xs text-slate-500">
            Wöchentlicher Schichtplan Ihrer Mitarbeiterinnen — steuert direkt die Buchbarkeit im Kalender.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-xs">
            <span className="border-r border-slate-200 px-2.5 py-1.5 text-slate-500">‹</span>
            <span className="px-3.5 py-1.5">09. – 15. Nov. 2026</span>
            <span className="border-l border-slate-200 px-2.5 py-1.5 text-slate-500">›</span>
          </div>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
            Heute
          </span>
          <span className="text-xs font-semibold text-slate-500">KW 46</span>
        </div>
      </div>

      {feedback ? (
        <div
          data-testid="timetable-feedback-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {conflictWarning ? (
        <div
          data-testid="timetable-conflict-warning"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900"
        >
          {conflictWarning}
        </div>
      ) : null}

      {/* 7-Day Weekly Grid matching video 01:45 – 01:60 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="w-48 px-4 py-3 font-bold text-slate-800">Mitarbeiter</th>
              {WEEKDAYS.map((day) => (
                <th key={day.iso} className="px-2.5 py-3 text-center">
                  <div className="text-sm font-bold text-slate-900">{day.dayNum}</div>
                  <div className="text-[11px] font-medium text-slate-500">{day.shortLabel}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {/* Salon Opening Hours Row matching video 01:45 */}
            <tr className="bg-slate-50/70">
              <td className="px-4 py-3 font-bold text-slate-900">
                <div>{salonName}</div>
                <div className="text-[10px] font-normal text-slate-500">Öffnungszeiten</div>
              </td>
              {WEEKDAYS.map((day) => (
                <td key={day.iso} className="px-2 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {day.iso <= 6 ? "09:00 - 19:00" : "13:00 - 19:00"}
                  </span>
                </td>
              ))}
            </tr>

            {/* Employee Rows matching video 01:45 – 01:60 */}
            {staff
              .filter((m) => m.active)
              .map((member) => {
                const totalMinutes = member.shifts.reduce(
                  (acc, s) => acc + Math.max(0, s.endMinute - s.startMinute),
                  0,
                );
                const totalHours = Math.round(totalMinutes / 60);
                return (
                  <tr
                    key={member.id}
                    data-testid={`timetable-row-${member.displayName}`}
                    className="hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-bold text-slate-900">{member.displayName}</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {totalHours}h
                        </span>
                      </div>
                    </td>

                    {WEEKDAYS.map((day) => {
                      const shift = member.shifts.find((s) => s.isoWeekday === day.iso);
                      return (
                        <td key={day.iso} className="px-1.5 py-2.5 text-center">
                          {shift ? (
                            <button
                              type="button"
                              data-testid={`timetable-cell-${member.displayName}-${day.iso}`}
                              onClick={() => openEditRosterModal(member, day.iso)}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-teal-200 bg-teal-50/90 px-2 py-1.5 text-[11px] font-bold text-teal-950 transition hover:bg-teal-100"
                            >
                              <span>
                                {formatMinutesToHHMM(shift.startMinute)} -{" "}
                                {formatMinutesToHHMM(shift.endMinute)}
                              </span>
                              <span className="text-[10px] opacity-65">↻</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              data-testid={`timetable-cell-${member.displayName}-${day.iso}`}
                              onClick={() => openEditRosterModal(member, day.iso)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs font-bold text-slate-400 hover:border-slate-400 hover:text-slate-700"
                              title="Schicht hinzufügen"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Edit Roster Modal matching video 01:45 */}
      {editingCell ? (
        <div
          data-testid="edit-roster-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Dienstplan bearbeiten</h3>
                <p className="text-xs text-slate-500">
                  {editingCell.staffMember.displayName} ·{" "}
                  {WEEKDAYS.find((d) => d.iso === editingCell.isoWeekday)?.shortLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              {/* Left Column: TIME */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  UHRZEIT
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    data-testid="roster-modal-start"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    data-testid="roster-modal-end"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Right Column: REPEAT & ENDS */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    WIEDERHOLUNG
                  </label>
                  <select
                    value={repeatRule}
                    onChange={(event) => setRepeatRule(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="weekly">Wöchentlich</option>
                    <option value="biweekly">Alle 2 Wochen</option>
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ENDET
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rosterEnds"
                        checked={endsRule === "never"}
                        onChange={() => setEndsRule("never")}
                        className="h-3.5 w-3.5 accent-[#f28b82]"
                      />
                      <span>Nie</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rosterEnds"
                        checked={endsRule === "date"}
                        onChange={() => setEndsRule("date")}
                        className="h-3.5 w-3.5 accent-[#f28b82]"
                      />
                      <span>An einem bestimmten Datum</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                data-testid="roster-modal-delete"
                disabled={saving}
                onClick={() => void saveUpdatedRoster(true)}
                className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                Löschen
              </button>
              <button
                type="button"
                data-testid="roster-modal-submit"
                disabled={saving}
                onClick={() => void saveUpdatedRoster(false)}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Speichert…" : "Übernehmen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AbsencesSettingsSection({
  salonId,
  staff,
  nationalHolidays,
  absences,
  onRefresh,
}: {
  salonId: string;
  staff: StaffMemberRecord[];
  nationalHolidays: NationalHolidayRow[];
  absences: AbsenceRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [staffFilter, setStaffFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [appliesTo, setAppliesTo] = useState<"employee" | "company">("employee");
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id ?? "");
  const [startDate, setStartDate] = useState("2026-11-12");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-11-12");
  const [endTime, setEndTime] = useState("18:00");
  const [allDay, setAllDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);

  const filteredAbsences = useMemo(() => {
    if (staffFilter === "all") return absences;
    return absences.filter((a) => a.staffId === staffFilter);
  }, [absences, staffFilter]);

  async function handleCreateAbsence() {
    if (!description.trim()) return;
    setSaving(true);
    setFeedback(null);
    setConflictBanner(null);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          description: description.trim(),
          appliesTo,
          staffId: appliesTo === "employee" ? selectedStaffId || staff[0]?.id : undefined,
          startDate,
          startTime,
          endDate,
          endTime,
          allDay,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { conflictingAppointmentsCount?: number };
        setFeedback(`Abwesenheit „${description.trim()}“ wurde eingetragen.`);
        if (body.conflictingAppointmentsCount && body.conflictingAppointmentsCount > 0) {
          setConflictBanner(
            `Warnung: Im gewählten Zeitraum bestehen bereits ${body.conflictingAppointmentsCount} gebuchte Termine. Diese wurden nicht automatisch storniert.`,
          );
        }
        setModalOpen(false);
        setDescription("");
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAbsence(id: string) {
    await fetch(
      `/api/absences?salonId=${encodeURIComponent(salonId)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    await onRefresh();
  }

  return (
    <div data-testid="settings-section-absences" className="space-y-6">
      {/* Header matching video 00:80 – 00:85 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Abwesenheiten</h2>
          <p className="text-xs text-slate-500">
            Gesetzliche Feiertage sowie Urlaubs- und Abwesenheitszeiten Ihrer Mitarbeiterinnen.
          </p>
        </div>
        <button
          type="button"
          data-testid="absences-create-btn"
          onClick={() => {
            setSelectedStaffId(staff[0]?.id ?? "");
            setModalOpen(true);
          }}
          className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          Neue Abwesenheit erstellen
        </button>
      </div>

      {feedback ? (
        <div
          data-testid="absences-feedback-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {conflictBanner ? (
        <div
          data-testid="absences-conflict-banner"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900"
        >
          {conflictBanner}
        </div>
      ) : null}

      {/* Card 1: National Holidays matching video 00:80 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">Gesetzliche Feiertage</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            An gesetzlichen Feiertagen ist der Salon standardmäßig für Online-Buchungen geschlossen.
          </p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2.5">BESCHREIBUNG</th>
              <th className="px-5 py-2.5">DATUM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {nationalHolidays.map((hol) => (
              <tr key={hol.id} className="hover:bg-slate-50">
                <td className="px-5 py-2.5 font-medium text-slate-900">{hol.description}</td>
                <td className="px-5 py-2.5 text-slate-600">{hol.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card 2: Unavailable Days matching video 00:85 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nicht verfügbare Zeiten</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Urlaub, Fortbildungen oder individuelle Ausfallzeiten.
            </p>
          </div>
          <select
            data-testid="absences-staff-filter"
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="all">Alle anzeigen</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2.5">BESCHREIBUNG</th>
              <th className="px-5 py-2.5">GILT FÜR</th>
              <th className="px-5 py-2.5">VON</th>
              <th className="px-5 py-2.5">BIS</th>
              <th className="px-5 py-2.5 text-right">AKTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAbsences.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                  Keine Abwesenheiten eingetragen.
                </td>
              </tr>
            ) : (
              filteredAbsences.map((item) => (
                <tr
                  key={item.id}
                  data-testid={`absence-row-${item.description}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-2.5 font-bold text-slate-900">{item.description}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-bold text-slate-900"
                      style={{ backgroundColor: item.staffColor ?? "#e2e8f0" }}
                    >
                      {item.staffName}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">
                    {new Date(item.startsAt).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">
                    {new Date(item.endsAt).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDeleteAbsence(item.id)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Absence Modal matching video 00:90 */}
      {modalOpen ? (
        <div
          data-testid="create-absence-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Abwesenheit erstellen</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  BESCHREIBUNG *
                </label>
                <input
                  type="text"
                  data-testid="absence-modal-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="z. B. Urlaub, Zahnarzt, Schulung"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    STARTDATUM
                  </label>
                  <input
                    type="date"
                    data-testid="absence-modal-start-date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      setEndDate(event.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                {!allDay ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      STARTZEIT
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ENDDATUM
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                {!allDay ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      ENDZEIT
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(event) => setAllDay(event.target.checked)}
                  className="h-4 w-4 rounded accent-[#f28b82]"
                />
                <span>Ganztägig</span>
              </label>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  GILT FÜR
                </span>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={appliesTo === "employee"}
                      onChange={() => setAppliesTo("employee")}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Mitarbeiterin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={appliesTo === "company"}
                      onChange={() => setAppliesTo("company")}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Gesamter Salon</span>
                  </label>
                </div>

                {appliesTo === "employee" ? (
                  <select
                    data-testid="absence-modal-staff-select"
                    value={selectedStaffId}
                    onChange={(event) => setSelectedStaffId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="absence-modal-save"
                disabled={saving || !description.trim()}
                onClick={() => void handleCreateAbsence()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CalendarSettingsSection({
  settings,
  onSave,
}: {
  settings: SalonSettingsRecord;
  onSave: (patch: Partial<SalonSettingsRecord>) => Promise<void>;
}) {
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(
    settings.slotIntervalMinutes || 15,
  );
  const [appointmentColorMode, setAppointmentColorMode] = useState<"category" | "employee">(
    settings.appointmentColorMode || "category",
  );
  const [hideUnscheduledStaff, setHideUnscheduledStaff] = useState(
    Boolean(settings.hideUnscheduledStaff),
  );
  const [endBufferEnabled, setEndBufferEnabled] = useState(Boolean(settings.endBufferEnabled));
  const [allowOnlineCancel, setAllowOnlineCancel] = useState(
    settings.allowOnlineCancel ?? true,
  );
  const [onlineCancelLeadHours, setOnlineCancelLeadHours] = useState(
    settings.onlineCancelLeadHours || 1,
  );
  const [allowOnlineReschedule, setAllowOnlineReschedule] = useState(
    settings.allowOnlineReschedule ?? true,
  );
  const [onlineRescheduleLeadHours, setOnlineRescheduleLeadHours] = useState(
    settings.onlineRescheduleLeadHours || 1,
  );
  const [noShowEmailPrompt, setNoShowEmailPrompt] = useState(
    Boolean(settings.noShowEmailPrompt),
  );
  const [emailReminderEnabled, setEmailReminderEnabled] = useState(
    settings.emailReminderEnabled ?? true,
  );
  const [emailReminderLeadHours, setEmailReminderLeadHours] = useState(
    settings.emailReminderLeadHours || 12,
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSave({
        slotIntervalMinutes,
        appointmentColorMode,
        hideUnscheduledStaff,
        endBufferEnabled,
        allowOnlineCancel,
        onlineCancelLeadHours,
        allowOnlineReschedule,
        onlineRescheduleLeadHours,
        noShowEmailPrompt,
        emailReminderEnabled,
        emailReminderLeadHours,
      });
      setSavedNotice("Kalendereinstellungen wurden gespeichert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-calendar" className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kalendereinstellungen</h2>
          <p className="text-xs text-slate-500">
            Zeitraster, Terminfarben, Mitarbeitersichtbarkeit und automatische Erinnerungen.
          </p>
        </div>
        <button
          type="button"
          data-testid="calendar-settings-save"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>

      {savedNotice ? (
        <div
          data-testid="calendar-settings-saved-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {savedNotice}
        </div>
      ) : null}

      {/* Card 1: Display & Visuals + Live 60-Min Appointment Preview matching video 01:65 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ZEITINTERVALL IM KALENDER
              </label>
              <select
                data-testid="calendar-slot-interval-select"
                value={slotIntervalMinutes}
                onChange={(event) => setSlotIntervalMinutes(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
              >
                <option value={10}>10 Min.</option>
                <option value={15}>15 Min.</option>
                <option value={30}>30 Min.</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TERMINFARBE
              </label>
              <select
                data-testid="calendar-color-mode-select"
                value={appointmentColorMode}
                onChange={(event) =>
                  setAppointmentColorMode(event.target.value as "category" | "employee")
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
              >
                <option value="category">Nach Leistungskategorie</option>
                <option value="employee">Nach Mitarbeiterin</option>
              </select>
            </div>
          </div>

          {/* Right Live Preview Box matching video 01:65 */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              SO SIEHT EIN 60-MINUTEN-TERMIN AUS
            </p>
            <div
              data-testid="calendar-settings-live-preview"
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
            >
              {["10:00", "10:15", "10:30", "10:45"].map((slot, idx) => (
                <div
                  key={slot}
                  className="flex items-start gap-2 border-t border-slate-200/70 py-1 first:border-t-0"
                >
                  <span className="w-10 font-mono text-[10px] text-slate-400">{slot}</span>
                  {idx === 0 ? (
                    <div
                      className="flex-1 rounded-md border-l-4 border-pink-500 px-2.5 py-2 text-[11px] text-slate-900 shadow-xs"
                      style={{
                        backgroundColor:
                          appointmentColorMode === "category" ? "#f9a8d4" : "#c5d4f0",
                      }}
                    >
                      <p className="font-bold">10:00 - 11:00</p>
                      <p className="font-semibold">Walk-in · Shellac</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              data-testid="calendar-hide-unscheduled-checkbox"
              checked={hideUnscheduledStaff}
              onChange={(event) => setHideUnscheduledStaff(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Mitarbeiter ohne geplante Schicht am jeweiligen Tag ausblenden</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={endBufferEnabled}
              onChange={(event) => setEndBufferEnabled(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Endpuffer hinzufügen, um eine Pause zwischen Terminen einzuplanen</span>
          </label>
        </div>
      </div>

      {/* Card 2: Changes by Customer matching video 01:65 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Änderungen durch Kundinnen</h3>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={allowOnlineCancel}
              onChange={(event) => setAllowOnlineCancel(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Kundinnen erlauben, Termine online zu stornieren</span>
          </label>
          <select
            value={onlineCancelLeadHours}
            onChange={(event) => setOnlineCancelLeadHours(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
          >
            <option value={1}>Bis 1 Std. vorher</option>
            <option value={12}>Bis 12 Std. vorher</option>
            <option value={24}>Bis 24 Std. vorher</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={allowOnlineReschedule}
              onChange={(event) => setAllowOnlineReschedule(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Kundinnen erlauben, Termine online zu verschieben</span>
          </label>
          <select
            value={onlineRescheduleLeadHours}
            onChange={(event) => setOnlineRescheduleLeadHours(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
          >
            <option value={1}>Bis 1 Std. vorher</option>
            <option value={12}>Bis 12 Std. vorher</option>
            <option value={24}>Bis 24 Std. vorher</option>
          </select>
        </div>
      </div>

      {/* Card 3: No-Shows & Reminder Settings matching video 01:65 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">No-Shows & Terminerinnerungen</h3>
        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={noShowEmailPrompt}
            onChange={(event) => setNoShowEmailPrompt(event.target.checked)}
            className="h-4 w-4 rounded accent-[#f28b82]"
          />
          <span>Beim Markieren als „Nicht erschienen“ nach Versand einer E-Mail fragen</span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
          <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={emailReminderEnabled}
              onChange={(event) => setEmailReminderEnabled(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Automatische Terminerinnerung per E-Mail senden</span>
          </label>
          <select
            value={emailReminderLeadHours}
            onChange={(event) => setEmailReminderLeadHours(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
          >
            <option value={12}>12 Std. im Voraus</option>
            <option value={24}>24 Std. im Voraus</option>
            <option value={48}>48 Std. im Voraus</option>
          </select>
        </div>
      </div>
    </div>
  );
}
