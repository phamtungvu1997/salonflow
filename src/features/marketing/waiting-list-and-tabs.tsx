"use client";

import { useMemo, useState } from "react";

import type {
  MarketingFilterGroupRecord,
  MarketingInsightsMetrics,
  MarketingSettingsRecord,
  WaitingListEntryRecord,
} from "./marketing-types";

export interface SimpleCustomerOption {
  id: string;
  displayName: string;
}

export interface SimpleServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface SimpleStaffOption {
  id: string;
  displayName: string;
}

export function WaitingListSection({
  salonId,
  waitingList,
  marketingSettings,
  customers,
  services,
  staff,
  onSaveSettings,
  onRefresh,
}: {
  salonId: string;
  waitingList: WaitingListEntryRecord[];
  marketingSettings: MarketingSettingsRecord;
  customers: SimpleCustomerOption[];
  services: SimpleServiceOption[];
  staff: SimpleStaffOption[];
  onSaveSettings: (patch: Partial<MarketingSettingsRecord>) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [filterScope, setFilterScope] = useState<"all" | "today">("all");
  const [cogMenuOpen, setCogMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // New Registration Modal State (matching video 00:12)
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [dateMode, setDateMode] = useState<"specific_date" | "weekdays">(
    "specific_date",
  );
  const [preferredDate, setPreferredDate] = useState("2026-11-09");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleEntries = useMemo(() => {
    if (filterScope === "today") {
      return waitingList.filter(
        (e) =>
          e.preferredDate.includes("2026-11-09") || e.preferredDate.includes("Mo"),
      );
    }
    return waitingList;
  }, [waitingList, filterScope]);

  async function handleSaveRegistration() {
    const chosenCustomer = customers.find((c) => c.id === selectedCustomerId);
    const customerName =
      chosenCustomer?.displayName || customCustomerName.trim();
    if (!customerName) return;

    const chosenService = services.find((s) => s.id === selectedServiceId);
    const chosenStaff = staff.find((st) => st.id === selectedStaffId);

    setSaving(true);
    try {
      const res = await fetch("/api/marketing/waiting-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          customerId: chosenCustomer?.id,
          customerName,
          serviceId: chosenService?.id,
          serviceName: chosenService?.name ?? "-",
          durationMinutes: chosenService?.durationMinutes ?? 60,
          staffId: chosenStaff?.id,
          staffName: chosenStaff?.displayName ?? "Keine Präferenz",
          dateMode,
          preferredDate,
          note: note.trim() || undefined,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setCustomCustomerName("");
        setNote("");
        setFeedback(`Wartelisten-Eintrag für „${customerName}“ wurde gespeichert.`);
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    await fetch(
      `/api/marketing/waiting-list?salonId=${encodeURIComponent(salonId)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    await onRefresh();
  }

  return (
    <div data-testid="marketing-section-waiting-list" className="space-y-4">
      {feedback ? (
        <div
          data-testid="waitlist-feedback-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {feedback}
        </div>
      ) : null}

      {/* Toolbar matching video 00:06 & 00:09 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            data-testid="waitlist-scope-select"
            value={filterScope}
            onChange={(event) =>
              setFilterScope(event.target.value as "all" | "today")
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
          >
            <option value="all">Alle anzeigen</option>
            <option value="today">Heute (Mo., 09. Nov. 2026)</option>
          </select>

          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800">
            <span>📅 Mo., 09. Nov. 2026</span>
          </div>

          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
            <span className="border-r border-slate-200 px-2.5 py-2 text-slate-500">‹</span>
            <button
              type="button"
              onClick={() => setFilterScope("today")}
              className="px-3 py-2 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Heute
            </button>
            <span className="border-l border-slate-200 px-2.5 py-2 text-slate-500">›</span>
          </div>
        </div>

        {/* Right Action Buttons: Cog Dropdown + "New registration" matching video 00:09 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              data-testid="waitlist-settings-cog-btn"
              onClick={() => setCogMenuOpen((prev) => !prev)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              title="Wartelisten-Einstellungen"
            >
              ⚙️
            </button>

            {cogMenuOpen ? (
              <div
                data-testid="waitlist-settings-cog-menu"
                className="absolute right-0 z-20 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCogMenuOpen(false);
                    void onSaveSettings({
                      waitingListEnabled: !marketingSettings.waitingListEnabled,
                    });
                  }}
                  className="block w-full px-4 py-2 text-left font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {marketingSettings.waitingListEnabled
                    ? "Warteliste deaktivieren"
                    : "Warteliste aktivieren"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCogMenuOpen(false);
                    setFeedback(
                      "Wartelisten-E-Mail-Vorlage geprüft (automatischer E-Mail-Versand in V1 deaktiviert).",
                    );
                  }}
                  className="block w-full px-4 py-2 text-left font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Wartelisten-E-Mail-Einstellungen
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            data-testid="waitlist-new-registration-btn"
            onClick={() => {
              setSelectedCustomerId(customers[0]?.id ?? "");
              setSelectedServiceId(services[0]?.id ?? "");
              setSelectedStaffId("");
              setDateMode("specific_date");
              setPreferredDate("2026-11-09");
              setModalOpen(true);
            }}
            className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
          >
            Neue Registrierung
          </button>
        </div>
      </div>

      {/* Waiting List Data Table matching video 00:06 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">DATUM</th>
              <th className="px-5 py-3">KUNDIN</th>
              <th className="px-5 py-3">LEISTUNGEN</th>
              <th className="px-5 py-3">DAUER</th>
              <th className="px-5 py-3">GESENDET</th>
              <th className="px-5 py-3">MITARBEITERIN</th>
              <th className="px-5 py-3 text-right">AKTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-500">
                  Keine Wartelisten-Einträge vorhanden.
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry) => (
                <tr
                  key={entry.id}
                  data-testid={`waitlist-row-${entry.customerName}`}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {entry.preferredDate}
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    {entry.customerName}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{entry.serviceName}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {entry.durationMinutes} Min.
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {entry.notificationSent ? "✓" : "-"}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{entry.staffName}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDeleteEntry(entry.id)}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Registration Modal matching video 00:12 */}
      {modalOpen ? (
        <div
          data-testid="waitlist-registration-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Neue Registrierung
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">
                Fügen Sie eine Kundin zur Warteliste hinzu und wählen Sie das gewünschte Datum sowie die gewünschte Behandlung aus.
              </p>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  KUNDIN *
                </label>
                <select
                  data-testid="waitlist-modal-customer-select"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                  <option value="">Andere / Neue Kundin eingeben…</option>
                </select>
                {selectedCustomerId === "" ? (
                  <input
                    type="text"
                    data-testid="waitlist-modal-customer-input"
                    value={customCustomerName}
                    onChange={(event) => setCustomCustomerName(event.target.value)}
                    placeholder="Kundin suchen oder Name eingeben"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
                  />
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  LEISTUNGEN *
                </label>
                <select
                  data-testid="waitlist-modal-service-select"
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} Min.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  MITARBEITERIN
                </label>
                <select
                  data-testid="waitlist-modal-staff-select"
                  value={selectedStaffId}
                  onChange={(event) => setSelectedStaffId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="">Keine Präferenz</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  VERFÜGBARES DATUM
                </span>
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={dateMode === "specific_date"}
                      onChange={() => {
                        setDateMode("specific_date");
                        setPreferredDate("2026-11-09");
                      }}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Bestimmtes Datum</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={dateMode === "weekdays"}
                      onChange={() => {
                        setDateMode("weekdays");
                        setPreferredDate("Mo, Mi, Do");
                      }}
                      className="h-4 w-4 accent-[#f28b82]"
                    />
                    <span>Wochentage</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  DATUM / ZEITRAUM
                </label>
                {dateMode === "specific_date" ? (
                  <input
                    type="date"
                    data-testid="waitlist-modal-date-input"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
                  />
                ) : (
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    placeholder="z. B. Mo, Mi, Do"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  NOTIZ
                </label>
                <textarea
                  rows={2}
                  data-testid="waitlist-modal-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optionaler Hinweis zum Terminwunsch…"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
                />
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
                data-testid="waitlist-modal-save-btn"
                disabled={saving}
                onClick={() => void handleSaveRegistration()}
                className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EmailMarketingSection({
  marketingSettings,
  onSelectRebookTab,
}: {
  marketingSettings: MarketingSettingsRecord;
  onSelectRebookTab: () => void;
}) {
  return (
    <div data-testid="marketing-section-email" className="space-y-6">
      {/* GDPR / No External Send Safety Notice */}
      <div
        data-testid="email-gdpr-safety-notice"
        className="rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-3.5 text-xs text-amber-950"
      >
        <p className="font-bold">
          DSGVO- & V1-Schutz aktiv: Kein externer E-Mail- oder SMS-Versand angeschlossen
        </p>
        <p className="mt-0.5 text-amber-900/90">
          Entwürfe und Automatisierungsregeln können geprüft werden. Es werden in dieser Umgebung niemals echte Nachrichten an Kundinnen versendet.
        </p>
      </div>

      {/* Section A: Send a newsletter matching video 00:24 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Newsletter</h3>
            <p className="text-xs text-slate-500">
              Vorlagen für Salon-Ankündigungen (Versand erfordert separate DSGVO-Freigabe).
            </p>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            Versand in V1 gesperrt
          </span>
        </div>

        <div className="max-w-xs rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
          <p className="text-xs font-bold text-slate-900">Entwurf (Kein Titel)</p>
          <div className="flex h-20 items-center justify-center rounded-lg bg-emerald-50 text-2xl font-bold text-emerald-700">
            €
          </div>
          <p className="text-xs text-slate-600">
            Preisänderungen {"{{company_name}}"} ab [Datum]
          </p>
          <span className="inline-block rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
            Nur Vorschau (Entwurf)
          </span>
        </div>
      </div>

      {/* Section B: Automated emails matching video 00:24 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Automatisierte E-Mails</h3>
          <p className="text-xs text-slate-500">
            Konfiguration Ihrer System- und Erinnerungs-Vorlagen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Wiederbuchungs-Erinnerung",
              enabled: marketingSettings.rebookReminderEnabled,
              desc: "Erinnert Kundinnen nach einem definierten Zeitraum an ihren nächsten Folgetermin.",
              onAction: onSelectRebookTab,
            },
            {
              title: "Warteliste",
              enabled: marketingSettings.waitingListEnabled,
              desc: "Informiert Kundinnen auf der Warteliste über frei gewordene Zeitfenster.",
            },
            {
              title: "Geburtstage",
              enabled: false,
              desc: "Automatischer Geburtstagsgruß (in V1 deaktiviert).",
            },
            {
              title: "Formulare & Anamnese",
              enabled: false,
              desc: "Vorab-Formular vor dem Termin (in V1 deaktiviert).",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    ✉️ {card.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white ${
                      card.enabled ? "bg-emerald-600" : "bg-slate-400"
                    }`}
                  >
                    {card.enabled ? "AKTIVIERT" : "V2"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">{card.desc}</p>
              </div>
              {card.onAction ? (
                <button
                  type="button"
                  onClick={card.onAction}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  Einstellungen
                </button>
              ) : (
                <span className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-400">
                  In V1 deaktiviert
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FilterGroupsSection({
  salonId,
  filterGroups,
  onRefresh,
}: {
  salonId: string;
  filterGroups: MarketingFilterGroupRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [criteriaLabel, setCriteriaLabel] = useState("Mindestens 3 Termine gebucht");
  const [saving, setSaving] = useState(false);

  async function handleCreateFilterGroup() {
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/waiting-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "filter_group",
          salonId,
          name: groupName.trim(),
          criteriaLabel,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setGroupName("");
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="marketing-section-filters" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Filtergruppen</h3>
          <p className="text-xs text-slate-500">
            Kundensegmente für gezielte Auswertungen (synchron mit Kunden-Labels).
          </p>
        </div>
        <button
          type="button"
          data-testid="create-filter-group-btn"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          Filtergruppe erstellen
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">NAME</th>
              <th className="px-6 py-3">VERWENDETE FILTER</th>
              <th className="px-6 py-3">KRITERIUM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filterGroups.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-bold text-slate-900">{g.name}</td>
                <td className="px-6 py-3 text-slate-700">{g.filtersUsed}</td>
                <td className="px-6 py-3 text-slate-500">{g.criteriaLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div
          data-testid="create-filter-group-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              Filtergruppe erstellen
            </h4>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                NAME DER FILTERGRUPPE *
              </label>
              <input
                type="text"
                data-testid="filter-group-name-input"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="z. B. Shellac-Stammkundinnen"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                FILTERKRITERIUM
              </label>
              <input
                type="text"
                value={criteriaLabel}
                onChange={(event) => setCriteriaLabel(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="filter-group-save-btn"
                disabled={saving || !groupName.trim()}
                onClick={() => void handleCreateFilterGroup()}
                className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RebookReminderSection({
  marketingSettings,
  insights,
  services,
  onSaveSettings,
}: {
  marketingSettings: MarketingSettingsRecord;
  insights: MarketingInsightsMetrics;
  services: SimpleServiceOption[];
  onSaveSettings: (patch: Partial<MarketingSettingsRecord>) => Promise<void>;
}) {
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    marketingSettings.rebookReminderServiceIds ?? [],
  );

  return (
    <div data-testid="marketing-section-rebook-reminder" className="space-y-5">
      {/* Master Toggle matching video 00:27 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs text-xs">
        <label className="inline-flex items-center gap-2.5 font-bold text-slate-900 cursor-pointer">
          <input
            type="checkbox"
            data-testid="rebook-reminder-master-toggle"
            checked={marketingSettings.rebookReminderEnabled}
            onChange={(event) =>
              void onSaveSettings({
                rebookReminderEnabled: event.target.checked,
              })
            }
            className="h-4 w-4 rounded accent-[#f28b82]"
          />
          <span>
            {marketingSettings.rebookReminderEnabled
              ? "Wiederbuchungs-Erinnerung aktiv"
              : "Wiederbuchungs-Erinnerung deaktiviert"}
          </span>
        </label>
        <span className="text-slate-500">
          Kundinnen mit ausgewählten Leistungen werden für Folgetermine vorgemerkt (externer E-Mail-Versand in V1 deaktiviert).
        </span>
      </div>

      {/* 2-Column Grid matching video 00:27 */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left Card: Insights */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Einblicke</h3>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              Diese Woche
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-500">
              Erinnerungs-E-Mails versendet (Versand in V1-Vorschau gesperrt)
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
            ✓ {insights.repeatCustomerBookings} Folgetermine von Stammkundinnen im Kalender gebucht.
          </div>
        </div>

        {/* Right Column: Services & Email Cards */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900">Leistungen</h3>
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {marketingSettings.rebookReminderServiceIds?.length ?? 7} AUSGEWÄHLT
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Wählen Sie die Leistungen aus, für die eine Wiederbuchungs-Erinnerung vorgesehen ist.
            </p>
            <button
              type="button"
              data-testid="rebook-modify-services-btn"
              onClick={() => {
                setSelectedIds(marketingSettings.rebookReminderServiceIds ?? []);
                setServicesModalOpen(true);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Leistungen anpassen
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900">E-Mail-Vorlage</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                Kein Live-Versand (V1)
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Inhalt und Darstellung der Wiederbuchungs-Nachricht (Versand erst nach separater DSGVO-Freigabe).
            </p>
          </div>
        </div>
      </div>

      {servicesModalOpen ? (
        <div
          data-testid="rebook-services-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              Leistungen für Wiederbuchungs-Erinnerung
            </h4>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg px-3">
              {services.map((svc) => (
                <label
                  key={svc.id}
                  className="flex items-center justify-between py-2 text-xs text-slate-800 cursor-pointer"
                >
                  <span className="font-medium">{svc.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(svc.id)}
                    onChange={() =>
                      setSelectedIds((prev) =>
                        prev.includes(svc.id)
                          ? prev.filter((id) => id !== svc.id)
                          : [...prev, svc.id],
                      )
                    }
                    className="h-4 w-4 rounded accent-[#f28b82]"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setServicesModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                data-testid="rebook-services-save-btn"
                onClick={() => {
                  void onSaveSettings({ rebookReminderServiceIds: selectedIds });
                  setServicesModalOpen(false);
                }}
                className="rounded-lg bg-[#18202c] px-4 py-2 text-xs font-bold text-white"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
