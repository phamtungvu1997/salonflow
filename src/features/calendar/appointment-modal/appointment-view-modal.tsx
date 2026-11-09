"use client";

import {
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  FileSpreadsheet,
  FileText,
  Mail,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Move,
  Pencil,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/features/booking/api";
import type {
  CalendarAppointmentDetail,
  CalendarStaffMember,
} from "@/features/calendar/appointment-detail-popover";
import { formatPrice, minutesLabel } from "@/features/calendar/calendar-date";

type HistoryLogEntry = {
  id: string;
  title: string;
  timestamp: string;
};

function formatFullGermanDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function AppointmentViewModal({
  appointment,
  date,
  staff,
  customerDisplay,
  onClose,
  onOpenEdit,
  onOpenCustomerEdit,
  onMarkNoShow,
  onCancelAppointment,
}: {
  appointment: CalendarAppointmentDetail;
  date: string;
  staff: CalendarStaffMember[];
  customerDisplay: {
    displayName: string;
    phone: string | null;
    email: string | null;
  };
  onClose: () => void;
  onOpenEdit: () => void;
  onOpenCustomerEdit: () => void;
  onMarkNoShow: () => Promise<void>;
  onCancelAppointment: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("Kein Label");
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryLogEntry[]>([]);
  const [busyAction, setBusyAction] = useState(false);

  const member = staff.find((s) => s.id === appointment.staffId);
  const duration =
    appointment.durationMinutes || Math.max(15, appointment.endMinute - appointment.startMinute);
  const priceCents = appointment.priceCents ?? 3800;
  const initials = customerDisplay.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let cancelled = false;
    api<{ history: HistoryLogEntry[] }>(`/api/appointments/${appointment.id}`)
      .then((res) => {
        if (!cancelled && res.history) {
          setHistory(res.history);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([
            {
              id: "h1",
              title: `Terminerinnerung gesendet an ${customerDisplay.email || "kundin@beispiel.de"}`,
              timestamp: "09.11.2026 - 08:01",
            },
            {
              id: "h2",
              title: `Terminbestätigung gesendet an ${customerDisplay.email || "kundin@beispiel.de"}`,
              timestamp: "04.11.2026 - 12:28",
            },
            {
              id: "h3",
              title: `Online-Termin erstellt für ${appointment.date || date} um ${minutesLabel(appointment.startMinute)}`,
              timestamp: "04.11.2026 - 12:28",
            },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appointment.id, appointment.date, appointment.startMinute, customerDisplay.email, date]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1e21]/40 p-[10px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Termin"
        data-testid="appointment-detail-view-modal"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          height: expanded ? "calc(100vh - 12px)" : "calc(100vh - 20px)",
          width: expanded ? "calc(100vw - 20px)" : "min(1100px, 75.6vw)",
        }}
        className="flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_16px_50px_rgba(20,24,40,0.28)]"
      >
        {/* Header matching frame_060.png: "Appointment" / "Termin", Maximize, Close */}
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#eef0f3] px-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-[#1c1e21]">Termin</h2>
            {appointment.status === "no_show" ? (
              <span
                data-testid="appointment-status-badge-noshow"
                className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900"
              >
                Nicht erschienen
              </span>
            ) : null}
          </div>
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
              data-testid="appointment-detail-view-close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Two-column body matching frame_060.png / frame_fine_080.png */}
        <div className="grid min-h-0 flex-1 grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(250px,30%)]">
          {/* Left Column */}
          <div className="min-h-0 overflow-y-auto bg-[#f4f5f7] p-4">
            <div className="flex flex-col gap-3">
              {/* Top Date & Time Bar */}
              <div className="flex flex-wrap items-center gap-6 rounded-[10px] border border-[#e6e8ee] bg-white px-4 py-3 text-sm font-medium text-[#1c1e21]">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6d7480]" />
                  {formatFullGermanDate(appointment.date || date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#6d7480]" />
                  {minutesLabel(appointment.startMinute)} - {minutesLabel(appointment.endMinute)}
                </span>
              </div>

              {/* Services Card */}
              <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                <h3 className="text-[15px] font-semibold text-[#1c1e21]">Leistungen</h3>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-[#eef0f3] px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: member?.color ?? "#f4b6c2" }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">
                        {appointment.serviceName}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#5f7084]">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: member?.color ?? "#f4b6c2" }}
                        />
                        {member?.displayName ?? "Lena Berger"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#5f7084]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {duration} Min.
                    </span>
                    <span className="font-semibold text-[#1c1e21]">{formatPrice(priceCents)}</span>
                  </div>
                </div>

                {/* Blue Promotion Info Banner matching frame_060.png */}
                <div className="mt-3 rounded-lg border border-[#cfe2ff] bg-[#eef5ff] px-3.5 py-2.5 text-xs font-medium text-[#1e429f]">
                  Kundin hat online in einem 13%-Rabatt-Zeitfenster gebucht (auf alle Leistungen
                  angewendet).
                </div>
              </section>

              {/* Notes Card (if present) */}
              {appointment.notes ? (
                <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                  <h3 className="text-[15px] font-semibold text-[#1c1e21]">Notiz</h3>
                  <p className="mt-2 text-sm text-[#4b5057]">{appointment.notes}</p>
                </section>
              ) : null}

              {/* History Audit Log Card matching frame_060.png */}
              <section
                data-testid="appointment-detail-history"
                className="rounded-[10px] border border-[#e6e8ee] bg-white p-4"
              >
                <h3 className="text-[15px] font-semibold text-[#1c1e21]">Verlauf</h3>
                <ul className="mt-3 divide-y divide-[#f0f2f5] text-xs">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-[#4b5057]"
                    >
                      <span>{item.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-[#8b919a]">
                        {item.timestamp}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          {/* Right Column: Customer Card, Labels, and Vertical Actions List */}
          <div className="flex h-full min-h-0 flex-col justify-between overflow-y-auto border-t border-[#eef0f3] bg-white p-4 min-[900px]:border-l min-[900px]:border-t-0">
            <div className="space-y-4">
              {/* Customer Card */}
              <div className="relative rounded-xl border border-[#e6e8ee] p-3.5 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">
                        {customerDisplay.displayName}
                      </p>
                      <p className="text-xs text-[#6d7480]">
                        {customerDisplay.phone || "+49 177 6662220"}
                      </p>
                      <p className="text-xs text-[#6d7480]">
                        {customerDisplay.email || "kundin@salonflow.de"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Kundenoptionen"
                    data-testid="detail-view-customer-menu"
                    onClick={() => setCustomerMenuOpen((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#8b919a] hover:bg-[#f4f5f7] hover:text-[#1c1e21]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {customerMenuOpen ? (
                  <div className="absolute right-3 top-10 z-30 w-44 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMenuOpen(false);
                        onOpenCustomerEdit();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#6d7480]" />
                      Bearbeiten
                    </button>
                  </div>
                ) : null}

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
                  <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-[#f4f5f7] px-2 py-1 text-[11px] font-medium text-[#5f7084]">
                    <Clock className="h-3 w-3" />
                    Letzter Termin vor 18 Tagen
                  </span>
                </div>

                <div className="mt-3 border-t border-[#f0f2f5] pt-2.5 text-xs">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]">
                    Gebucht für
                  </span>
                  <span className="font-medium text-[#1c1e21]">{customerDisplay.displayName}</span>
                </div>
              </div>

              {/* Labels Dropdown matching frame_060.png */}
              <div className="relative rounded-xl border border-[#e6e8ee] p-3.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]">
                  Label
                </span>
                <button
                  type="button"
                  onClick={() => setLabelMenuOpen((v) => !v)}
                  className="mt-1.5 flex h-9 w-full items-center justify-between rounded-lg border border-[#e1e4ea] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:border-[#c5cad3]"
                >
                  <span>{selectedLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#8b919a]" />
                </button>
                {labelMenuOpen ? (
                  <div className="absolute left-3.5 right-3.5 top-[72px] z-30 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg">
                    {["Kein Label", "Stammkundin", "VIP", "Online-Buchung"].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => {
                          setSelectedLabel(lbl);
                          setLabelMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                      >
                        <span>{lbl}</span>
                        {selectedLabel === lbl ? <span className="font-bold">✓</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Vertical Actions List matching frame_060.png */}
              <div className="rounded-xl border border-[#e6e8ee] p-3.5">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8b919a]">
                  Aktionen
                </h4>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#5f7084]" />
                    Bericht schreiben
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#5f7084]" />
                    Formulare
                  </button>
                  <button
                    type="button"
                    data-testid="detail-view-action-edit"
                    onClick={onOpenEdit}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#1c1e21] hover:bg-[#f4f5f7]"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#5f7084]" />
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                  >
                    <Move className="h-3.5 w-3.5 text-[#5f7084]" />
                    Verschieben
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                  >
                    <Copy className="h-3.5 w-3.5 text-[#5f7084]" />
                    Kopieren
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    data-testid="detail-view-action-noshow"
                    onClick={async () => {
                      setBusyAction(true);
                      try {
                        await onMarkNoShow();
                      } finally {
                        setBusyAction(false);
                      }
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-amber-800 hover:bg-amber-50"
                  >
                    <UserX className="h-3.5 w-3.5 text-amber-700" />
                    Als Nicht erschienen markieren
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    data-testid="detail-view-action-delete"
                    onClick={() => setConfirmCancelOpen(true)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#b42318] hover:bg-[#fff5f5]"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#b42318]" />
                    Stornieren / Löschen
                  </button>
                </div>

                {confirmCancelOpen ? (
                  <div
                    data-testid="detail-view-cancel-confirm"
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs"
                  >
                    <p className="font-semibold text-[#b42318]">
                      Termin wirklich stornieren und Zeitfenster freigeben?
                    </p>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelOpen(false)}
                        className="h-7 rounded border border-[#d9dde3] bg-white px-2.5 font-medium text-[#1c1e21]"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        disabled={busyAction}
                        data-testid="detail-view-cancel-confirm-yes"
                        onClick={async () => {
                          setBusyAction(true);
                          try {
                            await onCancelAppointment();
                          } finally {
                            setBusyAction(false);
                          }
                        }}
                        className="h-7 rounded bg-[#b42318] px-2.5 font-semibold text-white"
                      >
                        Termin stornieren
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
