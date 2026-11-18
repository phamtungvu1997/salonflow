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
  Tag,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/features/booking/api";
import { AppointmentViewModal } from "@/features/calendar/appointment-modal/appointment-view-modal";
import { DateBracket, TimeBracket } from "@/features/calendar/appointment-modal/date-time-brackets";
import { EditCustomerInlineModal } from "@/features/calendar/appointment-modal/edit-customer-inline-modal";
import { ListboxField } from "@/features/calendar/appointment-modal/listbox-field";
import type { ModalService } from "@/features/calendar/appointment-modal/types";
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

const DURATION_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 105, 120].map(
  (mins) => ({
    id: String(mins),
    label: `${mins} Min.`,
  }),
);

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
  salonId = "salon_jeannie",
  date,
  staff,
  services = [],
  anchorRect,
  onClose,
  onUpdated,
  onCancelled,
  onError,
}: {
  appointment: CalendarAppointmentDetail;
  salonId?: string;
  date: string;
  staff: CalendarStaffMember[];
  services?: ModalService[];
  anchorRect: { top: number; left: number } | null;
  onClose: () => void;
  onUpdated: (msg: string) => Promise<void>;
  onCancelled: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editingServiceRow, setEditingServiceRow] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"service" | "duration" | "staff" | null>(null);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [inlineCustomerEditOpen, setInlineCustomerEditOpen] = useState(false);

  const [customerDisplay, setCustomerDisplay] = useState({
    displayName: appointment.customerName,
    phone: appointment.customerPhone ?? null,
    email: appointment.customerEmail ?? null,
  });

  const matchedService = services.find((s) => s.name === appointment.serviceName);
  const [editServiceId, setEditServiceId] = useState<string>(matchedService?.id ?? "");
  const [editServiceName, setEditServiceName] = useState<string>(appointment.serviceName);
  const [editStaffId, setEditStaffId] = useState<string>(appointment.staffId);
  const [editDuration, setEditDuration] = useState<number>(
    appointment.durationMinutes || Math.max(15, appointment.endMinute - appointment.startMinute),
  );
  const [editPriceCents, setEditPriceCents] = useState<number>(appointment.priceCents ?? 3500);
  const [editDate, setEditDate] = useState(appointment.date || date);
  const [editStart, setEditStart] = useState(minutesLabel(appointment.startMinute));
  const [editNotes, setEditNotes] = useState(appointment.notes ?? "");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (inlineCustomerEditOpen) {
        return; // Handled by EditCustomerInlineModal
      }
      if (openDropdown) {
        event.preventDefault();
        setOpenDropdown(null);
        return;
      }
      if (customerMenuOpen) {
        event.preventDefault();
        setCustomerMenuOpen(false);
        return;
      }
      if (moreOpen) {
        event.preventDefault();
        setMoreOpen(false);
        return;
      }
      if (editModalOpen) {
        event.preventDefault();
        setEditModalOpen(false);
        return;
      }
      if (detailViewOpen) {
        event.preventDefault();
        setDetailViewOpen(false);
        return;
      }
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    inlineCustomerEditOpen,
    openDropdown,
    customerMenuOpen,
    moreOpen,
    editModalOpen,
    detailViewOpen,
    onClose,
  ]);

  const member = staff.find((s) => s.id === editStaffId) ?? staff.find((s) => s.id === appointment.staffId);
  const duration = editDuration;
  const priceCents = editPriceCents;
  const initials = customerDisplay.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const selectedCatalogService = services.find((s) => s.id === editServiceId);
  const eligibleStaff = selectedCatalogService
    ? staff.filter((m) => selectedCatalogService.staffIds.includes(m.id))
    : staff;

  const serviceOptions = services.map((item) => ({
    id: item.id,
    label: item.name,
    hint: `${item.durationMinutes} Min.`,
    secondaryHint: formatPrice(item.priceCents),
    groupLabel: item.categoryName ?? undefined,
    groupColor: item.categoryColor ?? undefined,
  }));

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
          serviceId:
            editServiceId && editServiceName !== appointment.serviceName
              ? editServiceId
              : undefined,
          staffId: editStaffId !== appointment.staffId ? editStaffId : undefined,
          durationMinutes:
            editDuration !==
            (appointment.durationMinutes ||
              Math.max(15, appointment.endMinute - appointment.startMinute))
              ? editDuration
              : undefined,
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

  async function handleMarkNoShow() {
    setSaving(true);
    try {
      await api(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedVersion: appointment.version,
          status: "no_show",
        }),
      });
      await onUpdated("Termin als Nicht erschienen markiert.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Status konnte nicht geändert werden.");
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

  if (detailViewOpen && !editModalOpen) {
    return createPortal(
      <>
        <AppointmentViewModal
          appointment={appointment}
          date={date}
          staff={staff}
          customerDisplay={customerDisplay}
          onClose={onClose}
          onOpenEdit={() => {
            setDetailViewOpen(false);
            setEditModalOpen(true);
          }}
          onOpenCustomerEdit={() => setInlineCustomerEditOpen(true)}
          onMarkNoShow={handleMarkNoShow}
          onCancelAppointment={handleCancel}
        />
        {inlineCustomerEditOpen ? (
          <EditCustomerInlineModal
            customer={{
              id: appointment.customerId ?? "",
              salonId,
              displayName: customerDisplay.displayName,
              email: customerDisplay.email,
              phone: customerDisplay.phone,
            }}
            onClose={() => setInlineCustomerEditOpen(false)}
            onSaved={(updated) => {
              setCustomerDisplay({
                displayName: updated.displayName,
                email: updated.email,
                phone: updated.phone,
              });
              setInlineCustomerEditOpen(false);
            }}
          />
        ) : null}
      </>,
      document.body,
    );
  }

  if (editModalOpen) {
    const endLabel = minutesLabel(toMinute(editStart) + duration);
    return createPortal(
      <>
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
                  {/* Services Card matching frame_120.png / frame_150.png / frame_180.png */}
                  <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
                    <h3 className="text-[15px] font-semibold text-[#1c1e21]">Leistungen</h3>

                    {editingServiceRow ? (
                      <div
                        data-testid="edit-appointment-service-editor"
                        className="mt-3 grid grid-cols-1 gap-2 min-[900px]:grid-cols-[minmax(0,1.4fr)_104px_minmax(0,1fr)]"
                      >
                        <ListboxField
                          label="Leistung"
                          required
                          placeholder="Auswählen"
                          valueLabel={editServiceName}
                          options={serviceOptions}
                          open={openDropdown === "service"}
                          onOpenChange={(open) => setOpenDropdown(open ? "service" : null)}
                          onSelect={(id) => {
                            setEditServiceId(id);
                            const picked = services.find((s) => s.id === id);
                            if (picked) {
                              setEditServiceName(picked.name);
                              setEditDuration(picked.durationMinutes);
                              setEditPriceCents(picked.priceCents);
                              if (!picked.staffIds.includes(editStaffId)) {
                                const fallback = staff.find((m) =>
                                  picked.staffIds.includes(m.id),
                                );
                                if (fallback) setEditStaffId(fallback.id);
                              }
                            }
                          }}
                          testId="edit-appointment-service"
                          searchable
                        />
                        <ListboxField
                          label="Dauer"
                          placeholder="—"
                          valueLabel={`${duration} Min.`}
                          options={DURATION_OPTIONS}
                          open={openDropdown === "duration"}
                          onOpenChange={(open) => setOpenDropdown(open ? "duration" : null)}
                          onSelect={(val) => setEditDuration(Number(val))}
                          testId="edit-appointment-duration"
                        />
                        <ListboxField
                          label="Mitarbeiter"
                          required
                          placeholder="Auswählen"
                          valueLabel={member?.displayName}
                          options={eligibleStaff.map((m) => ({
                            id: m.id,
                            label: m.displayName,
                          }))}
                          open={openDropdown === "staff"}
                          onOpenChange={(open) => setOpenDropdown(open ? "staff" : null)}
                          onSelect={(id) => setEditStaffId(id)}
                          testId="edit-appointment-staff"
                          searchable
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid="edit-appointment-service-row-trigger"
                        onClick={() => setEditingServiceRow(true)}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#eef0f3] px-3 py-2.5 text-left text-sm transition hover:border-[#c5cad3] hover:bg-[#fafbfc]"
                      >
                        <span className="font-medium text-[#1c1e21]">{editServiceName}</span>
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
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingServiceRow(true)}
                      className="mt-3 text-sm font-medium text-[var(--brand-purple)] hover:underline"
                    >
                      + Weitere Leistung
                    </button>
                  </section>

                  {/* Date and Time Card matching frame_120.png / frame_285.png */}
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
                        data-testid="edit-appointment-repeat-toggle"
                        onClick={() => setRepeatEnabled((prev) => !prev)}
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <span
                          className={cn(
                            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                            repeatEnabled ? "bg-[#e05a6d]" : "bg-[#e4e7ec]",
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
                      data-testid="edit-appointment-notes"
                      value={editNotes}
                      onChange={(event) => setEditNotes(event.target.value)}
                      placeholder="Notiz hier eingeben"
                      className="mt-3 w-full resize-y rounded-lg border border-[#e1e4ea] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
                    />
                  </section>
                </div>
              </div>

              {/* Right Sidebar: Customer Profile Card + Context Menu + Sticky Summary Footer */}
              <div className="flex h-full min-h-0 flex-col justify-between border-t border-[#eef0f3] bg-white min-[900px]:border-l min-[900px]:border-t-0">
                <div className="p-4">
                  <div className="relative rounded-xl border border-[#e6e8ee] p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white">
                          {initials}
                        </span>
                        <div>
                          <p
                            data-testid="edit-appointment-customer-name"
                            className="text-sm font-semibold text-[#1c1e21]"
                          >
                            {customerDisplay.displayName}
                          </p>
                          <p className="text-xs text-[#6d7480]">
                            {customerDisplay.phone || "+49 151 0000000"}
                          </p>
                          {customerDisplay.email ? (
                            <p className="text-xs text-[#6d7480]">{customerDisplay.email}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Kundenmenü öffnen"
                        data-testid="edit-appointment-customer-menu-btn"
                        onClick={() => setCustomerMenuOpen((v) => !v)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#8b919a] hover:bg-[#f4f5f7] hover:text-[#1c1e21]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Customer Context Menu matching frame_210.png / frame_225.png */}
                    {customerMenuOpen ? (
                      <div
                        data-testid="edit-appointment-customer-menu"
                        className="absolute right-3 top-11 z-40 w-44 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          data-testid="edit-appointment-customer-edit-btn"
                          onClick={() => {
                            setCustomerMenuOpen(false);
                            setInlineCustomerEditOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#6d7480]" />
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-[#6d7480] hover:bg-[#f4f5f7]"
                        >
                          <X className="h-3.5 w-3.5" />
                          Auswahl aufheben
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
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-[#f4f5f7] px-2 py-1 text-[10.5px] font-medium text-[#5f7084]">
                        <Clock className="h-3 w-3" />
                        Letzter Termin vor 18 Tagen
                      </span>
                    </div>

                    <div className="mt-3 border-t border-[#f0f2f5] pt-2.5 text-xs">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8b919a]">
                        Gebucht für
                      </span>
                      <span className="font-medium text-[#1c1e21]">
                        {customerDisplay.displayName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#eef0f3] bg-white px-4 py-3">
                  {modalError ? (
                    <p
                      className="mb-2 text-xs text-[#b42318]"
                      role="alert"
                      data-testid="appointment-edit-error"
                    >
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
        </div>

        {/* Stacked Secondary Dialog: Kundin bearbeiten matching frame_240.png */}
        {inlineCustomerEditOpen ? (
          <EditCustomerInlineModal
            customer={{
              id: appointment.customerId ?? "",
              salonId,
              displayName: customerDisplay.displayName,
              email: customerDisplay.email,
              phone: customerDisplay.phone,
            }}
            onClose={() => setInlineCustomerEditOpen(false)}
            onSaved={(updated) => {
              setCustomerDisplay({
                displayName: updated.displayName,
                email: updated.email,
                phone: updated.phone,
              });
              setInlineCustomerEditOpen(false);
            }}
          />
        ) : null}
      </>,
      document.body,
    );
  }

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 720;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const top = anchorRect
    ? Math.min(Math.max(16, anchorRect.top - 10), Math.max(16, viewportH - 360))
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
        aria-label={customerDisplay.displayName}
        data-testid="appointment-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        style={{ top, left }}
        className="fixed z-50 w-[340px] rounded-xl border border-[#e6e8ee] bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.18)]"
      >
        {/* Header: Customer Name + Link + Phone + Retention Badge + Close X (matching frame_030.png) */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#1c1e21]">{customerDisplay.displayName}</h2>
              {appointment.status === "no_show" ? (
                <span
                  data-testid="popover-status-noshow"
                  className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900"
                >
                  Nicht erschienen
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[#6d7480]">
              {customerDisplay.phone || customerDisplay.email || "+49 152 31992584"}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#8b919a]">
              <Clock className="h-3 w-3" />
              vor 18 Tagen
            </span>
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

        {/* Icon Detail List matching frame_030.png */}
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
          <div className="flex items-center gap-2.5 text-[#5f7084]">
            <Tag className="h-3.5 w-3.5 shrink-0 text-[#6d7480]" />
            <span>{formatPrice(priceCents)}</span>
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
              title="Termin-Details & Verlauf"
              aria-label="Termin im Detail anzeigen"
              data-testid="appointment-detail-view-open"
              onClick={() => setDetailViewOpen(true)}
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
              data-testid="appointment-more-btn"
              onClick={() => setMoreOpen((prev) => !prev)}
              className="h-8 rounded-lg border border-[#e1e4ea] bg-white px-2.5 text-xs font-medium text-[#1c1e21] hover:bg-[#f4f5f7]"
            >
              Mehr
            </button>
            {moreOpen ? (
              <div
                data-testid="appointment-more-menu"
                className="absolute bottom-[calc(100%+4px)] right-0 z-50 w-52 rounded-lg border border-[#e1e4ea] bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  data-testid="more-menu-view-details"
                  onClick={() => {
                    setMoreOpen(false);
                    setDetailViewOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  <FileText className="h-3.5 w-3.5 text-[#5f7084]" />
                  Termin-Details & Verlauf
                </button>
                <button
                  type="button"
                  data-testid="more-menu-edit"
                  onClick={() => {
                    setMoreOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#f4f5f7]"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#5f7084]" />
                  Termin bearbeiten
                </button>
                <button
                  type="button"
                  data-testid="more-menu-noshow"
                  onClick={() => {
                    setMoreOpen(false);
                    void handleMarkNoShow();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-amber-800 hover:bg-amber-50"
                >
                  <UserX className="h-3.5 w-3.5 text-amber-700" />
                  Als Nicht erschienen markieren
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#b42318] hover:bg-[#fff5f5]"
                >
                  <X className="h-3.5 w-3.5 text-[#b42318]" />
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
