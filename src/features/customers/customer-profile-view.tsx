"use client";

import {
  CalendarPlus,
  ChevronLeft,
  CreditCard,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Heart,
  Mail,
  MessageSquare,
  Pencil,
  Share2,
  Star,
  Ticket,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/features/booking/api";
import { formatPrice } from "@/features/calendar/calendar-date";
import {
  CustomerAppointmentRecord,
  CustomerHistoryItem,
  CustomerRecord,
  customerInitials,
  formatAppointmentRowDate,
  formatCustomerDate,
  formatCustomerDateTime,
} from "@/features/customers/customer-types";

type ProfileTab =
  | "overview"
  | "sales"
  | "appointments"
  | "reports"
  | "forms"
  | "history"
  | "loyalty"
  | "prepaid"
  | "feedback";

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "overview", label: "Übersicht" },
  { key: "sales", label: "Verkäufe" },
  { key: "appointments", label: "Termine" },
  { key: "reports", label: "Berichte" },
  { key: "forms", label: "Formulare" },
  { key: "history", label: "Verlauf" },
  { key: "loyalty", label: "Treuepunkte" },
  { key: "prepaid", label: "Guthabenkarten" },
  { key: "feedback", label: "Bewertungen" },
];

type CustomerProfileViewProps = {
  customerId: string;
  salonId: string;
  refreshKey?: number;
  initialCustomer?: CustomerRecord;
  onBack: () => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onArchiveCustomer: (customer: CustomerRecord) => Promise<void> | void;
  onBookAppointmentForCustomer: (customer: CustomerRecord) => void;
  onCustomerUpdated: () => Promise<void> | void;
};

export function CustomerProfileView({
  customerId,
  salonId,
  refreshKey = 0,
  initialCustomer,
  onBack,
  onEditCustomer,
  onArchiveCustomer,
  onBookAppointmentForCustomer,
  onCustomerUpdated,
}: CustomerProfileViewProps) {
  const [customer, setCustomer] = useState<CustomerRecord | null>(initialCustomer ?? null);
  const [appointments, setAppointments] = useState<CustomerAppointmentRecord[]>([]);
  const [history, setHistory] = useState<CustomerHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [loading, setLoading] = useState(true);
  const [showTotalSpent, setShowTotalSpent] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api<{
        customer: CustomerRecord;
        appointments: CustomerAppointmentRecord[];
        history: CustomerHistoryItem[];
      }>(`/api/customers/${customerId}?salonId=${encodeURIComponent(salonId)}`);
      setCustomer(res.customer);
      setAppointments(res.appointments);
      setHistory(res.history);
      setNoteDraft(res.customer.additionalInfo ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, salonId, refreshKey]);

  if (!customer) {
    return (
      <div className="rounded-xl border border-[#e2e5ea] bg-white p-8 text-center text-[13.5px] text-[#5a6068]">
        {loading ? "Kundenprofil wird geladen…" : "Kundin nicht gefunden."}
      </div>
    );
  }

  const currentCustomer = customer;

  async function toggleSetting(
    field:
      | "isBlocked"
      | "newsletterOptIn"
      | "emailRemindersOptIn"
      | "smsRemindersOptIn"
      | "birthdayWishesOptIn"
      | "feedbackRequestsOptIn"
      | "rebookRemindersOptIn",
    nextValue: boolean,
  ) {
    setCustomer((prev) => (prev ? { ...prev, [field]: nextValue } : prev));
    await api(`/api/customers/${currentCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        salonId,
        [field]: nextValue,
      }),
    });
    await onCustomerUpdated();
  }

  async function toggleFavoriteLabel(tag: string) {
    const nextLabels = currentCustomer.labels.includes(tag)
      ? currentCustomer.labels.filter((l) => l !== tag)
      : [...currentCustomer.labels, tag];
    setCustomer((prev) => (prev ? { ...prev, labels: nextLabels } : prev));
    await api(`/api/customers/${currentCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        salonId,
        labels: nextLabels,
      }),
    });
    await onCustomerUpdated();
  }

  async function saveNewLabel() {
    const trimmed = labelDraft.trim();
    if (!trimmed) return;
    const nextLabels = Array.from(new Set([...currentCustomer.labels, trimmed]));
    setCustomer((prev) => (prev ? { ...prev, labels: nextLabels } : prev));
    setLabelDraft("");
    setCreatingLabel(false);
    await api(`/api/customers/${currentCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        salonId,
        labels: nextLabels,
      }),
    });
    await onCustomerUpdated();
  }

  async function saveNote() {
    const trimmed = noteDraft.trim();
    setCustomer((prev) => (prev ? { ...prev, additionalInfo: trimmed || null } : prev));
    setEditingNote(false);
    await api(`/api/customers/${currentCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        salonId,
        additionalInfo: trimmed || "",
      }),
    });
    setStatusBanner("Notiz gespeichert.");
    await onCustomerUpdated();
  }

  const allLabelChips = Array.from(new Set(["Favorit", ...currentCustomer.labels]));

  return (
    <div data-testid="customer-profile" className="space-y-4">
      {/* Top Customer Profile Header & Sub-Navigation Tabs */}
      <div className="rounded-xl border border-[#e2e5ea] bg-white px-6 pt-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18202c] text-[13px] font-bold text-white">
              {customerInitials(currentCustomer.displayName)}
            </span>
            <h2
              data-testid="profile-customer-name"
              className="text-[20px] font-bold tracking-tight text-[#1c1e21]"
            >
              {currentCustomer.displayName}
            </h2>
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => onEditCustomer(currentCustomer)}
                title="Kundin bearbeiten"
                aria-label="Kundin bearbeiten"
                data-testid="profile-edit-button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5a6068] hover:bg-[#f2f4f7] hover:text-[#1c1e21]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onArchiveCustomer(currentCustomer)}
                title="Kundin archivieren"
                aria-label="Kundin archivieren"
                data-testid="profile-archive-button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5a6068] hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setStatusBanner(
                    "Kunden zusammenführen (SF-036) ist für einen späteren Meilenstein vorgesehen.",
                  )
                }
                title="Kunden zusammenführen (V2)"
                aria-label="Kunden zusammenführen"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8a9099] hover:bg-[#f2f4f7]"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {statusBanner ? (
            <div
              data-testid="profile-status-banner"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px] font-medium text-emerald-900"
            >
              {statusBanner}
            </div>
          ) : null}
        </div>

        {/* 9 Profile Sub-Navigation Tabs */}
        <div className="mt-4 flex items-center gap-6 overflow-x-auto border-t border-[#eef0f3] pt-1">
          {PROFILE_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-testid={`profile-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={` shrink-0 border-b-2 py-2.5 text-[13px] transition-colors ${
                  active
                    ? "border-[#e05a6d] font-bold text-[#1c1e21]"
                    : "border-transparent font-medium text-[#5a6068] hover:text-[#1c1e21]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Back to customers link */}
      <div>
        <button
          type="button"
          onClick={onBack}
          data-testid="profile-back-button"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563eb] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück zu Kunden
        </button>
      </div>

      {/* TAB 1: OVERVIEW (3-Column Grid matching 00:21 and 02:10) */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
          {/* Left Column: Actions, Details, Settings */}
          <div className="space-y-4">
            {/* Quick Actions Card */}
            <div className="rounded-xl border border-[#e2e5ea] bg-white p-2 shadow-xs">
              <button
                type="button"
                data-testid="profile-create-appointment"
                onClick={() => onBookAppointmentForCustomer(currentCustomer)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#1c1e21] hover:bg-[#f3f4f6]"
              >
                <CalendarPlus className="h-4 w-4 text-[#4b5057]" />
                <span>Termin erstellen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sales")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#6a6f76] hover:bg-[#f9fafb]"
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-[#8a9099]" />
                  Verkauf erstellen
                </span>
                <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
                  Kein POS (V1)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("forms")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#6a6f76] hover:bg-[#f9fafb]"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-[#8a9099]" />
                  Formular ausfüllen
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#6a6f76] hover:bg-[#f9fafb]"
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-4 w-4 text-[#8a9099]" />
                  Bericht erstellen
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setStatusBanner(
                    "Direktnachrichten / Kampagnen sind in SalonFlow V1 deaktiviert.",
                  )
                }
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#6a6f76] hover:bg-[#f9fafb]"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-[#8a9099]" />
                  Nachricht senden
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("appointments")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#4b5057] hover:bg-[#f3f4f6]"
              >
                <span className="flex items-center gap-2.5">
                  <Share2 className="h-4 w-4 text-[#6a6f76]" />
                  Termine teilen / ansehen
                </span>
              </button>
            </div>

            {/* Details Card */}
            <div
              data-testid="profile-details-card"
              className="rounded-xl border border-[#e2e5ea] bg-white p-4 shadow-xs"
            >
              <h3 className="text-[13px] font-bold text-[#1c1e21]">Details</h3>
              <dl className="mt-3 space-y-2.5 text-[12.5px]">
                <div className="flex items-start justify-between gap-2">
                  <dt className="font-medium text-[#6a6f76]">E-Mail</dt>
                  <dd className="text-right font-medium text-[#2563eb] break-all">
                    {currentCustomer.email ? (
                      <a href={`mailto:${currentCustomer.email}`} className="hover:underline">
                        {currentCustomer.email}
                      </a>
                    ) : (
                      <span className="text-[#8a9099]">—</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="font-medium text-[#6a6f76]">Mobil</dt>
                  <dd className="text-right font-medium text-[#2563eb]">
                    {currentCustomer.phone ? (
                      <a href={`tel:${currentCustomer.phone}`} className="hover:underline">
                        {currentCustomer.phone}
                      </a>
                    ) : (
                      <span className="text-[#8a9099]">—</span>
                    )}
                  </dd>
                </div>
                {currentCustomer.formattedAddress ? (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="font-medium text-[#6a6f76]">Adresse</dt>
                    <dd className="text-right text-[#1c1e21]">
                      {currentCustomer.formattedAddress}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-medium text-[#6a6f76]">Erstellt am</dt>
                  <dd className="text-[#1c1e21]">{formatCustomerDate(currentCustomer.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-medium text-[#6a6f76]">SalonFlow-ID</dt>
                  <dd className="font-mono text-[11.5px] text-[#5a6068]">
                    {currentCustomer.id.replace(/^cust_/, "").slice(0, 10)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Settings Card (Toggles) */}
            <div
              data-testid="profile-settings-card"
              className="rounded-xl border border-[#e2e5ea] bg-white p-4 shadow-xs"
            >
              <h3 className="text-[13px] font-bold text-[#1c1e21]">Einstellungen</h3>
              <div className="mt-3 space-y-2.5">
                {(
                  [
                    ["isBlocked", "Kundin blockieren", currentCustomer.isBlocked],
                    [
                      "emailRemindersOptIn",
                      "Terminerinnerungen per E-Mail",
                      currentCustomer.emailRemindersOptIn,
                    ],
                    [
                      "smsRemindersOptIn",
                      "Terminerinnerungen per SMS",
                      currentCustomer.smsRemindersOptIn,
                    ],
                    ["newsletterOptIn", "Newsletter", currentCustomer.newsletterOptIn],
                    [
                      "birthdayWishesOptIn",
                      "Geburtstagswünsche",
                      currentCustomer.birthdayWishesOptIn,
                    ],
                    [
                      "feedbackRequestsOptIn",
                      "Bewertungsanfragen",
                      currentCustomer.feedbackRequestsOptIn,
                    ],
                    [
                      "rebookRemindersOptIn",
                      "Wiederbuchungserinnerungen",
                      currentCustomer.rebookRemindersOptIn,
                    ],
                  ] as const
                ).map(([field, label, enabled]) => (
                  <div key={field} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-[12.5px] font-medium text-[#1c1e21]">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      data-testid={`profile-toggle-${field}`}
                      onClick={() => toggleSetting(field, !enabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        enabled ? "bg-[#e05a6d]" : "bg-[#cbd5e1]"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          enabled ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: 6 KPI Stats + Chronological History Feed */}
          <div className="space-y-4">
            {/* 6-Metric KPI Bar */}
            <div
              data-testid="profile-kpi-bar"
              className="grid grid-cols-3 gap-2 rounded-xl border border-[#e2e5ea] bg-white px-4 py-3.5 shadow-xs sm:grid-cols-6"
            >
              <div>
                <p
                  data-testid="profile-kpi-appointments"
                  className="text-[18px] font-bold text-[#1c1e21]"
                >
                  {currentCustomer.appointmentCount}
                </p>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Termine</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#1c1e21]">0</p>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Verkäufe</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#1c1e21]">0</p>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Treuepunkte</p>
              </div>
              <div>
                <p
                  data-testid="profile-kpi-cancellations"
                  className="text-[18px] font-bold text-[#1c1e21]"
                >
                  {currentCustomer.cancellationCount}
                </p>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Stornierungen</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#1c1e21]">
                  {currentCustomer.noShowCount}
                </p>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Nicht erschienen</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-bold text-[#1c1e21]">
                    {showTotalSpent ? formatPrice(currentCustomer.totalSpentCents) : "••••"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowTotalSpent((v) => !v)}
                    aria-label="Gesamtumsatz ein-/ausblenden"
                    className="text-[#6a6f76] hover:text-[#1c1e21]"
                  >
                    {showTotalSpent ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11.5px] font-medium text-[#6a6f76]">Gesamtumsatz</p>
              </div>
            </div>

            {/* History Feed Card */}
            <div
              data-testid="profile-history-card"
              className="rounded-xl border border-[#e2e5ea] bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-[#eef0f3] pb-3">
                <h3 className="text-[14px] font-bold text-[#1c1e21]">Verlauf</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("appointments")}
                  className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                >
                  Alle Termine ({appointments.length})
                </button>
              </div>

              <ul className="divide-y divide-[#f1f3f6] pt-1">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-3 text-[12.5px]"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                          item.type === "appointment_cancelled"
                            ? "bg-red-50 text-red-600"
                            : item.type === "appointment_created"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-medium text-[#1c1e21]">{item.title}</p>
                        {item.subtitle ? (
                          <p className="mt-0.5 text-[11.5px] text-[#6a6f76]">{item.subtitle}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11.5px] text-[#6a6f76]">
                      {formatCustomerDateTime(item.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Customer Labels & Notes */}
          <div className="space-y-4">
            {/* Customer Labels Card */}
            <div className="rounded-xl border border-[#e2e5ea] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-[#1c1e21]">Kunden-Labels</h3>
                <button
                  type="button"
                  onClick={() => setCreatingLabel((v) => !v)}
                  className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                >
                  Neues Label erstellen
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {allLabelChips.map((tag) => {
                  const selected = currentCustomer.labels.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFavoriteLabel(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${
                        selected
                          ? "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"
                          : "border-[#cbd5e1] bg-[#f8fafc] text-[#475569] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${selected ? "fill-[#1d4ed8]" : ""}`} />
                      {selected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>

              {creatingLabel ? (
                <div className="mt-3 flex items-center gap-1.5">
                  <input
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    placeholder="Neues Label…"
                    className="h-8 min-w-0 flex-1 rounded border border-[#cfd4dc] px-2.5 text-[12.5px]"
                  />
                  <button
                    type="button"
                    onClick={saveNewLabel}
                    className="h-8 rounded bg-[#18202c] px-2.5 text-[12px] font-semibold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : null}
            </div>

            {/* Notes Card */}
            <div
              data-testid="profile-notes-card"
              className="rounded-xl border border-[#e2e5ea] bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-[#1c1e21]">Notizen</h3>
                <button
                  type="button"
                  data-testid="profile-edit-note"
                  onClick={() => setEditingNote((v) => !v)}
                  className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                >
                  {currentCustomer.additionalInfo ? "Notiz bearbeiten" : "Notiz erstellen"}
                </button>
              </div>

              {editingNote ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    data-testid="profile-note-textarea"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Notizen zur Kundin speichern…"
                    className="w-full rounded-md border border-[#cfd4dc] p-2.5 text-[12.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNote(false)}
                      className="h-8 rounded border border-[#cfd4dc] px-3 text-[12px] font-semibold text-[#5a6068]"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      data-testid="profile-note-save"
                      onClick={saveNote}
                      className="h-8 rounded bg-[#18202c] px-3 text-[12px] font-semibold text-white"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              ) : currentCustomer.additionalInfo || currentCustomer.appointmentWarning ? (
                <div className="mt-3 space-y-2 text-[12.5px]">
                  {currentCustomer.additionalInfo ? (
                    <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-[#1c1e21]">
                      {currentCustomer.additionalInfo}
                    </div>
                  ) : null}
                  {currentCustomer.appointmentWarning ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12px] font-medium text-amber-900">
                      Buchungshinweis: {currentCustomer.appointmentWarning}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center py-6 text-center">
                  <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="mt-3 max-w-[230px] text-[12px] leading-relaxed text-[#6a6f76]">
                    Erstellen Sie Notizen, um wichtige Informationen zu speichern und Ihre Kundinnen
                    optimal zu betreuen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 3: APPOINTMENTS (Real PostgreSQL Appointment History matching 00:27) */}
      {activeTab === "appointments" ? (
        <div
          data-testid="profile-appointments-panel"
          className="rounded-xl border border-[#e2e5ea] bg-white p-6 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <h3 className="text-[15px] font-bold text-[#1c1e21]">
              Gespeicherte Termine ({appointments.length})
            </h3>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onBookAppointmentForCustomer(currentCustomer)}
                data-testid="profile-appointments-create"
                className="h-9 rounded-md bg-[#18202c] px-4 text-[13px] font-semibold text-white hover:bg-[#253142]"
              >
                Termin erstellen
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider text-[#6a6f76]">
                  <th className="py-2.5 pr-4">DATUM UND UHRZEIT</th>
                  <th className="px-4 py-2.5">STATUS</th>
                  <th className="px-4 py-2.5">LEISTUNGEN</th>
                  <th className="px-4 py-2.5">LABEL</th>
                  <th className="px-4 py-2.5">MITARBEITER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f6]">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[13px] text-[#6a6f76]">
                      Noch keine Termine für diese Kundin gespeichert.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-[#f9fafb]">
                      <td className="py-3 pr-4 font-medium text-[#1c1e21]">
                        {formatAppointmentRowDate(appt.startAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                            appt.status === "cancelled"
                              ? "bg-[#6b7280] text-white"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {appt.status === "cancelled" ? "STORNIERT" : "GEBUCHT"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1c1e21]">{appt.services}</td>
                      <td className="px-4 py-3 text-[#6a6f76]">—</td>
                      <td className="px-4 py-3 text-[#1c1e21]">{appt.staffNames}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* TAB 6: HISTORY (Full timeline view) */}
      {activeTab === "history" ? (
        <div className="rounded-xl border border-[#e2e5ea] bg-white p-6 shadow-xs">
          <h3 className="text-[15px] font-bold text-[#1c1e21]">Vollständiger Verlauf</h3>
          <ul className="mt-4 divide-y divide-[#f1f3f6]">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3 text-[13px]"
              >
                <div>
                  <p className="font-medium text-[#1c1e21]">{item.title}</p>
                  {item.subtitle ? (
                    <p className="text-[12px] text-[#6a6f76]">{item.subtitle}</p>
                  ) : null}
                </div>
                <span className="font-mono text-[12px] text-[#6a6f76]">
                  {formatCustomerDateTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* TABS: SALES / REPORTS / FORMS / LOYALTY / PREPAID / FEEDBACK (Matching Video Empty States 00:24 - 00:40) */}
      {["sales", "reports", "forms", "loyalty", "prepaid", "feedback"].includes(activeTab) ? (
        <div
          data-testid={`profile-empty-${activeTab}`}
          className="flex flex-col items-center justify-center rounded-xl border border-[#e2e5ea] bg-white px-6 py-16 text-center shadow-xs"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#18202c]">
            {activeTab === "sales" ? <CreditCard className="h-8 w-8" /> : null}
            {activeTab === "reports" ? <FileSpreadsheet className="h-8 w-8" /> : null}
            {activeTab === "forms" ? <FileText className="h-8 w-8" /> : null}
            {activeTab === "loyalty" ? <Ticket className="h-8 w-8" /> : null}
            {activeTab === "prepaid" ? <CreditCard className="h-8 w-8" /> : null}
            {activeTab === "feedback" ? <Star className="h-8 w-8" /> : null}
          </div>
          <h3 className="mt-4 text-[16px] font-bold text-[#1c1e21]">
            {activeTab === "sales" && "Noch keine Verkäufe für diese Kundin"}
            {activeTab === "reports" && "Noch keine Behandlungsberichte gespeichert"}
            {activeTab === "forms" && "Noch keine Formulare für diese Kundin gespeichert"}
            {activeTab === "loyalty" && "Kundenbindung mit Treuepunkten stärken"}
            {activeTab === "prepaid" && "Noch keine Guthabenkarten für diese Kundin"}
            {activeTab === "feedback" && "Noch keine Bewertungen von dieser Kundin"}
          </h3>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#5a6068]">
            {activeTab === "sales" &&
              "Gemäß SalonFlow-V1-Architektur sind Kasse (POS), Rechnungen und Zahlungsabwicklung nicht Bestandteil von V1."}
            {activeTab === "reports" &&
              "Behandlungsdokumentation und Berichte folgen in einem späteren Meilenstein. Nutze aktuell das Notizen-Feld in der Übersicht."}
            {activeTab === "forms" &&
              "Strukturierte Anamnese- und Beratungsformulare folgen in einem späteren Meilenstein."}
            {activeTab === "loyalty" &&
              "Treuepunkte-Programme sind in SalonFlow V1 deaktiviert. Alle Termin- und Stornozähler findest du in der Übersicht."}
            {activeTab === "prepaid" &&
              "Guthabenkarten und Gutschein-Abrechnung sind gemäß V1-Scope (kein POS) zurückgestellt."}
            {activeTab === "feedback" &&
              "Automatische Bewertungs-E-Mails nach Terminen sind für einen späteren Meilenstein vorgesehen."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
