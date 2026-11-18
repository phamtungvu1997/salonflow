"use client";

import { useState } from "react";

import { api } from "@/features/booking/api";
import { minutesLabel, toMinute } from "@/features/calendar/calendar-date";
import { cn } from "@/lib/utils";

import { DateBracket, TimeBracket } from "./date-time-brackets";
import { ListboxField } from "./listbox-field";
import type { ModalStaff } from "./types";

export type EventTabKind = "absence" | "chore" | "note";

export function CalendarEventTabForm({
  kind,
  salonId,
  initialDate,
  initialStart,
  initialStaffId,
  staff,
  onSaved,
}: {
  kind: EventTabKind;
  salonId: string;
  initialDate: string;
  initialStart: string;
  initialStaffId: string;
  staff: ModalStaff[];
  onSaved: (message: string) => Promise<void>;
}) {
  const defaultEnd = minutesLabel(Math.min(23 * 60 + 45, toMinute(initialStart) + 60));
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [allDay, setAllDay] = useState(false);
  const [appliesTo, setAppliesTo] = useState<"company" | "employee" | "tool">("company");
  const [staffId, setStaffId] = useState(initialStaffId || staff[0]?.id || "");
  const [staffOpen, setStaffOpen] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!description.trim()) {
      setError("Bitte eine Beschreibung eingeben.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("/api/calendar-events", {
        method: "POST",
        body: JSON.stringify({
          salonId,
          kind,
          description: description.trim(),
          appliesTo,
          staffId: appliesTo === "employee" ? staffId : undefined,
          startDate,
          startTime: kind === "note" ? undefined : startTime,
          endDate: kind === "note" ? startDate : endDate,
          endTime: kind === "note" ? undefined : endTime,
          allDay: kind === "note" ? true : allDay,
          repeatEnabled: kind === "note" ? false : repeatEnabled,
        }),
      });
      const label =
        kind === "absence"
          ? "Abwesenheit gespeichert."
          : kind === "chore"
            ? "Aufgabe gespeichert."
            : "Notiz gespeichert.";
      await onSaved(label);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  const appliesOptions: { id: "company" | "employee" | "tool"; label: string }[] =
    kind === "absence"
      ? [
          { id: "company", label: "Gesamtes Unternehmen" },
          { id: "employee", label: "Mitarbeiter" },
          { id: "tool", label: "Ressource" },
        ]
      : [
          { id: "company", label: "Gesamtes Unternehmen" },
          { id: "employee", label: "Mitarbeiter" },
        ];

  return (
    <div className="mx-auto w-full max-w-[640px] pt-4" data-testid={`tab-panel-${kind}`}>
      <div className="rounded-xl border border-[#e6e8ee] bg-white p-6 shadow-sm">
        <div>
          <label
            htmlFor={`event-desc-${kind}`}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]"
          >
            Beschreibung *
          </label>
          {kind === "note" ? (
            <textarea
              id={`event-desc-${kind}`}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              data-testid="event-description"
              className="w-full resize-y rounded-lg border border-[#e1e4ea] px-3 py-2 text-sm text-[#1c1e21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            />
          ) : (
            <input
              id={`event-desc-${kind}`}
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              data-testid="event-description"
              className="h-10 w-full rounded-lg border border-[#e1e4ea] px-3 text-sm text-[#1c1e21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            />
          )}
        </div>

        <div className="mt-5">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]">
            {kind === "note" ? "Datum" : "Datum und Uhrzeit"}
          </span>
          {kind === "note" ? (
            <div className="flex items-center">
              <DateBracket value={startDate} onChange={setStartDate} ariaLabel="Datum" testId="event-start-date" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <DateBracket
                value={startDate}
                onChange={(next) => {
                  setStartDate(next);
                  if (endDate < next) setEndDate(next);
                }}
                ariaLabel="Startdatum"
                testId="event-start-date"
              />
              <TimeBracket
                value={startTime}
                onChange={setStartTime}
                disabled={allDay}
                ariaLabel="Startzeit"
                testId="event-start-time"
              />
              <span className="px-1 text-xs font-medium text-[#5f7084]">Bis</span>
              <DateBracket
                value={endDate}
                onChange={setEndDate}
                ariaLabel="Enddatum"
                testId="event-end-date"
              />
              <TimeBracket
                value={endTime}
                onChange={setEndTime}
                disabled={allDay}
                ariaLabel="Endzeit"
                testId="event-end-time"
              />
              <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-sm text-[#1c1e21]">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(event) => setAllDay(event.target.checked)}
                  data-testid="event-all-day"
                  className="h-4 w-4 rounded border-[#cfd4dc] accent-[#111827]"
                />
                <span>Ganztägig</span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]">
            Gilt für
          </span>
          <div className="flex flex-wrap items-center gap-5">
            {appliesOptions.map((option) => {
              const checked = appliesTo === option.id;
              return (
                <label
                  key={option.id}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1c1e21]"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    data-testid={`event-applies-${option.id}`}
                    onClick={() => setAppliesTo(option.id)}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      checked ? "border-[#e06377] bg-[#fdecef]" : "border-[#cfd4dc] bg-white",
                    )}
                  >
                    {checked ? <span className="h-2 w-2 rounded-full bg-[#e06377]" /> : null}
                  </button>
                  <span onClick={() => setAppliesTo(option.id)}>{option.label}</span>
                </label>
              );
            })}
          </div>
          {appliesTo === "employee" ? (
            <div className="mt-3 max-w-[260px]">
              <ListboxField
                label="Mitarbeiter"
                required
                placeholder="Auswählen"
                valueLabel={staff.find((member) => member.id === staffId)?.displayName}
                options={staff.map((member) => ({ id: member.id, label: member.displayName }))}
                open={staffOpen}
                onOpenChange={setStaffOpen}
                onSelect={setStaffId}
                testId="event-staff"
                searchable
              />
            </div>
          ) : null}
        </div>

        {kind !== "note" ? (
          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1c1e21]">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(event) => setRepeatEnabled(event.target.checked)}
                data-testid="event-repeat"
                className="h-4 w-4 rounded border-[#cfd4dc] accent-[#111827]"
              />
              <span>{kind === "absence" ? "Abwesenheit/Aufgabe wiederholen" : "Aufgabe wiederholen"}</span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-[#b42318]" role="alert" data-testid="event-error">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end border-t border-[#eef0f3] pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            data-testid="event-save"
            className="h-9 rounded-lg bg-[#111827] px-5 text-sm font-medium text-white hover:bg-[#1f2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
