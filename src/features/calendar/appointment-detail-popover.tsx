"use client";

import {
  Clock,
  Eye,
  FileText,
  Lock,
  Mail,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Scissors,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/features/booking/api";
import { DateBracket, TimeBracket } from "@/features/calendar/appointment-modal/date-time-brackets";
import { formatLongDate, formatPrice, minutesLabel, toMinute } from "@/features/calendar/calendar-date";
import { cn } from "@/lib/utils";

export type CalendarAppointmentDetail = {
  id: string;
  staffId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceName: string;
  durationMinutes?: number;
  priceCents?: number;
  notes?: string | null;
  date?: string;
  startMinute: number;
  endMinute: number;
  version: number;
  status?: string;
};

export type CalendarStaffMember = {
  id: string;
  displayName: string;
  color: string;
};

function formatVerboseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function AppointmentDetailPopover({
  appointment,
  date,
  staff,
  anchorRect,
  onClose,
  onUpdated,
  onCancelled,
  onError,
}: {
  appointment: CalendarAppointmentDetail;
  date: string;
  staff: CalendarStaffMember[];
  anchorRect: { top: number; left: number } | null;
  onClose: () => void;
  onUpdated: (msg: string) => Promise<void>;
  onCancelled: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editDate, setEditDate] = useState(appointment.date || date);
  const [editStart, setEditStart] = useState(minutesLabel(appointment.startMinute));
  const [editNotes, setEditNotes] = useState(appointment.notes ?? "");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const member = staff.find((s) => s.id === appointment.staffId);
  const duration =
    appointment.durationMinutes || Math.max(15, appointment.endMinute - appointment.startMinute);
  const priceCents = appointment.priceCents ?? 3500;
  const initials = appointment.customerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function quickMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextStart = String(form.get("start") || editStart);
    setSaving(true);
    try {
      await api(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedVersion: appointment.version,
          date: appointment.date || date,
          start: nextStart,
        }),
      });
      await onUpdated("Termin verschoben.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Termin konnte nicht verschoben werden.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      await api(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedVersion: appointment.version,
          date: editDate,
          start: editStart,
          notes: editNotes,
        }),
      });
      await onUpdated("Termin verschoben.");
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Termin konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    setSaving(true);
    try {
      await api(`/api/appointments/${appointment.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: appointment.version }),
      });
      await onCancelled();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Termin konnte nicht storniert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  if (editModalOpen) {
    const endLabel = minutesLabel(toMinute(editStart) + duration);
    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1e21]/40 p-[10px]"
        onMouseDown={onClose}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-label="Termin bearbeiten"
          data-testid="appointment-edit-modal"
          onSubmit={saveEditModal}
          onMouseDown={(event) => event.stopPropagation()}
          style={{
            height: expanded ? "calc(100vh - 12px)" : "calc(100vh - 20px)",
            width: expanded ? "calc(100vw - 20px)" : "min(1100px, 75.6vw)",
          }}
          className="flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_16px_50px_rgba(20,24,40,0.28)]"
        >
          <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#eef0f3] px-5">
            <h2 className="text-[17px] font-semibold tracking-tight text-[#1c1e21]">
              Termin bearbeiten
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={expanded ? "Verkleinern" : "Vergrößern"}
                onClick={() => setExpanded((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7]"
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Schließen"
                data-testid="appointment-edit-close"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(240px,30%)]">
            <div className="min-h-0 overflow-y-auto bg-[#f4f5f7] p-4">
              <div className="flex flex-col gap-3">
                {/* Services Card matching frame_0510ds.png */}
                <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                  <h3 className="text-[15px] font-semibold text-[#1c1e21]">Leistungen</h3>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-[#eef0f3] px-3 py-2.5 text-sm">
                    <span className="font-medium text-[#1c1e21]">{appointment.serviceName}</span>
                    <div className="flex items-center gap-4 text-xs text-[#5f7084]">
                      <span>{duration} Min.</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1c1e21]">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: member?.color ?? "#e6c6d0" }}
                        />
                        {member?.displayName ?? "Mitarbeiterin"}
                      </span>
                      <Pencil className="h-3.5 w-3.5 text-[#8b919a]" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--brand-purple)]">
                    + Weitere Leistung
                  </p>
                </section>

                {/* Date and Time Card matching frame_0510ds.png */}
                <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                  <h3 className="text-[15px] font-semibold text-[#1c1e21]">Datum und Uhrzeit</h3>
                  <div className="mt-3 rounded-lg border border-[#eef0f3] p-3">
                    <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
                      Datum und Uhrzeit
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <DateBracket
                        value={editDate}
                        onChange={setEditDate}
                        ariaLabel="Datum"
                        testId="edit-appointment-date"
                        className="min-w-[180px] flex-1"
                      />
                      <TimeBracket
                        value={editStart}
                        onChange={setEditStart}
                        ariaLabel="Uhrzeit"
                        testId="edit-appointment-start"
                      />
                      <span className="inline-flex h-9 items-center rounded-lg border border-[#e1e4ea] bg-[#f7f8fa] px-3 text-sm text-[#5f7084]">
                        Verfügbarkeiten
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-[#eef0f3] pt-3">
                    <button
                      type="button"
                      onClick={() => setRepeatEnabled((prev) => !prev)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <span
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          repeatEnabled ? "bg-[#111827]" : "bg-[#e4e7ec]",
                        )}
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
                        <span className="block text-xs text-[#8b919a]">
                          Diesen Termin regelmäßig wiederholen.
                        </span>
                      </span>
                    </button>
                  </div>
                </section>

                {/* Note Card */}
                <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                  <h3 className="text-[15px] font-semibold text-[#1c1e21]">Notiz</h3>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(event) => setEditNotes(event.target.value)}
                    placeholder="Notiz hier eingeben"
                    className="mt-3 w-full resize-y rounded-lg border border-[#e1e4ea] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                  />
                </section>
              </div>
            </div>

            {/* Right Sidebar: Customer Profile Card + Sticky Summary Footer */}
            <div className="flex h-full min-h-0 flex-col justify-between border-t border-[#eef0f3] bg-white min-[900px]:border-l min-[900px]:border-t-0">
              <div className="p-4">
                <div className="rounded-xl border border-[#e6e8ee] p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white">
                        {initials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#1c1e21]">
                          {appointment.customerName}
                        </p>
                        <p className="text-xs text-[#6d7480]">
                          {appointment.customerPhone || "+49 151 0000000"}
                        </p>
                        {appointment.customerEmail ? (
                          <p className="text-xs text-[#6d7480]">{appointment.customerEmail}</p>
                        ) : null}
                      </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-[#8b919a]" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Link
                      href="/kunden"
                      aria-label="Kundenprofil öffnen"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] text-[#5f7084] hover:bg-[#f4f5f7]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      aria-label="Nachricht"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] text-[#5f7084] hover:bg-[#f4f5f7]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#eef0f3] bg-white px-4 py-3">
                {modalError ? (
                  <p className="mb-2 text-xs text-[#b42318]" role="alert">
                    {modalError}
                  </p>
                ) : null}
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
                      Datum und Uhrzeit
                    </p>
                    <p className="text-sm font-semibold text-[#1c1e21]">
                      {formatLongDate(editDate)} - {editStart} ({endLabel})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
                      Preis
                    </p>
                    <p className="text-sm font-semibold text-[#1c1e21]">
                      {formatPrice(priceCents)}
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="appointment-edit-save"
                  className="h-10 w-full rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1f2937] disabled:opacity-50"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>,
      document.body,
    );
  }

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 720;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const top = anchorRect
    ? Math.min(Math.max(16, anchorRect.top - 10), Math.max(16, viewportH - 340))
    : 80;
  const left = anchorRect
    ? Math.min(Math.max(16, anchorRect.left + 12), Math.max(16, viewportW - 360))
    : 260;

  return createPortal(
    <div
      className="fixed inset-0 z-40 bg-black/15"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        onSubmit={quickMove}
        role="dialog"
        aria-modal="true"
        aria-label={appointment.customerName}
        data-testid="appointment-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        style={{ top, left }}
        className="fixed z-50 w-[340px] rounded-xl border border-[#e6e8ee] bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.18)]"
      >
        {/* Header: Customer Name + Phone + Close X (matching frame_0450ds.png) */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-[#1c1e21]">{appointment.customerName}</h2>
            <p className="text-xs text-[#6d7480]">
              {appointment.customerPhone || appointment.customerEmail || "+49 152 31992584"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Schließen"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8b919a] hover:bg-[#f4f5f7] hover:text-[#1c1e21]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Verbose Date & Time Range */}
        <p className="mt-3 text-xs font-medium text-[#1c1e21]">
          {formatVerboseDate(appointment.date || date)}, {minutesLabel(appointment.startMinute)} -{" "}
          {minutesLabel(appointment.endMinute)}
        </p>

        {/* Icon Detail List matching frame_0450ds.png / frame_0490ds.png */}
        <div className="mt-3 space-y-2 border-t border-[#f0f2f5] pt-3 text-xs text-[#1c1e21]">
          <div className="flex items-center gap-2.5">
            <Scissors className="h-3.5 w-3.5 shrink-0 text-[#6d7480]" />
            <span className="truncate font-medium">{appointment.serviceName}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-[#1c1e21]"
              style={{ backgroundColor: member?.color ?? "#e6c6d0" }}
            >
              {(member?.displayName ?? "M")[0]}
            </span>
            <span>{member?.displayName ?? "Mitarbeiterin"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#5f7084]">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{duration} Min.</span>
            <RefreshCw className="ml-1 h-3 w-3 text-[#8b919a]" />
            <Lock className="h-3 w-3 text-[#8b919a]" />
          </div>
        </div>

        {/* Inline Start-Time Reschedule Row (preserves e2e/booking.spec.ts testid contract) */}
        <div className="mt-3 flex items-center gap-2 border-t border-[#f0f2f5] pt-3">
          <label className="flex flex-1 items-center gap-2 text-xs text-[#5f7084]">
            <span className="shrink-0">Startzeit</span>
            <input
              name="start"
              required
              defaultValue={minutesLabel(appointment.startMinute)}
              onChange={(event) => setEditStart(event.target.value)}
              data-testid="appointment-start"
              className="h-8 w-full rounded-lg border border-[#e1e4ea] px-2.5 text-xs text-[#1c1e21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            data-testid="appointment-save"
            className="h-8 rounded-lg border border-[#e1e4ea] bg-[#f7f8fa] px-2.5 text-xs font-medium text-[#1c1e21] hover:bg-[#eef0f3]"
          >
            Verschieben
          </button>
        </div>

        {/* Salonized Action Footer: Pencil (Edit), Report/Note, Cancel & More */}
        <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Bearbeiten"
              aria-label="Termin im Detail bearbeiten"
              data-testid="appointment-edit-open"
              onClick={() => setEditModalOpen(true)}
              className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] bg-white text-[#1c1e21] shadow-2xs hover:bg-[#f4f5f7]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Notiz / Bericht"
              aria-label="Notiz bearbeiten"
              onClick={() => setEditModalOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e1e4ea] bg-white text-[#5f7084] hover:bg-[#f4f5f7] hover:text-[#1c1e21]"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative flex items-center gap-1.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCancel()}
              data-testid="appointment-cancel"
              className="h-8 rounded-lg border border-[#e1e4ea] bg-white px-2.5 text-xs font-medium text-[#b42318] hover:bg-[#fff5f5]"
            >
              Stornieren
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className="h-8 rounded-lg border border-[#e1e4ea] bg-white px-2.5 text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
            >
              Mehr
            </button>
            {moreOpen ? (
              <div className="absolute bottom-[calc(100%+4px)] right-0 z-50 w-40 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="flex w-full px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  Termin bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  className="flex w-full px-3 py-1.5 text-left text-xs text-[#b42318] hover:bg-[#fff5f5]"
                >
                  Stornieren
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
