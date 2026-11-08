"use client";

import { useState } from "react";

import type {
  SalonSettingsRecord,
  SettingsSectionId,
  SettingsStats,
} from "./settings-types";

export function HubOverviewSection({
  salonName,
  stats,
  onSelectSection,
}: {
  salonName: string;
  stats: SettingsStats;
  onSelectSection: (section: SettingsSectionId) => void;
}) {
  return (
    <div data-testid="settings-section-hub" className="space-y-6">
      {/* Top Security Notice Banner matching video 00:08 */}
      <div
        data-testid="placeholder-notice"
        className="flex items-start gap-3.5 rounded-xl border border-sky-200 bg-sky-50/80 px-5 py-4 text-slate-800 shadow-xs"
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold">
          ✓
        </div>
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-slate-900">
            Salon-Sicherheit & Mandantentrennung aktiv ({salonName})
          </p>
          <p className="mt-0.5 text-slate-600">
            Alle Einstellungen, Mitarbeiter, Arbeitszeiten und Leistungen werden direkt in PostgreSQL für diesen Standort gespeichert und sofort mit dem Kalender synchronisiert.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Popular Settings Cards matching video 00:08 */}
        <div>
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Beliebte Einstellungen
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              data-testid="hub-card-services"
              onClick={() => onSelectSection("services")}
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-xs transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl text-pink-600 transition group-hover:scale-105">
                💅
              </div>
              <h3 className="text-sm font-bold text-slate-900">Leistungen</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Behandlungen, Kategorien, Preise, Dauer und Mitarbeiter-Zuweisungen verwalten.
              </p>
            </button>

            <button
              type="button"
              data-testid="hub-card-timetable"
              onClick={() => onSelectSection("timetable")}
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-xs transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-600 transition group-hover:scale-105">
                🗓️
              </div>
              <h3 className="text-sm font-bold text-slate-900">Arbeitszeiten</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Wöchentlichen Dienstplan, Schichten Ihrer Mitarbeiter und Öffnungszeiten festlegen.
              </p>
            </button>

            <button
              type="button"
              data-testid="hub-card-online-bookings"
              onClick={() => onSelectSection("online-bookings")}
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-xs transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 transition group-hover:scale-105">
                🌐
              </div>
              <h3 className="text-sm font-bold text-slate-900">Online-Buchungen</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Buchungs-Widget, Zeitintervalle, Vorlaufzeiten und Darstellung konfigurieren.
              </p>
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              data-testid="hub-card-employees"
              onClick={() => onSelectSection("employees")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-slate-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-lg">
                👩‍🎨
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Mitarbeiter</p>
                <p className="text-[11px] text-slate-500">{stats.activeStaff} aktive Mitarbeiterinnen</p>
              </div>
            </button>

            <button
              type="button"
              data-testid="hub-card-absences"
              onClick={() => onSelectSection("absences")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-slate-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-lg">
                🏖️
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Abwesenheiten</p>
                <p className="text-[11px] text-slate-500">Feiertage & Urlaubszeiten</p>
              </div>
            </button>

            <button
              type="button"
              data-testid="hub-card-calendar"
              onClick={() => onSelectSection("calendar")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-slate-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-lg">
                ⚙️
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Kalender</p>
                <p className="text-[11px] text-slate-500">Zeitraster & Terminfarben</p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Your Stats matching video 00:08 */}
        <div>
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Ihre Statistiken
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div>
              <p
                data-testid="settings-stat-customers"
                className="text-2xl font-bold text-slate-900"
              >
                {stats.totalCustomers.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-slate-500">Gespeicherte Kundinnen</p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p
                data-testid="settings-stat-appointments"
                className="text-2xl font-bold text-slate-900"
              >
                {stats.totalAppointments.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-slate-500">Gebuchte Termine</p>
            </div>
            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">{stats.activeStaff}</p>
                <p className="text-[11px] text-slate-500">Mitarbeiterinnen</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stats.activeServices}</p>
                <p className="text-[11px] text-slate-500">Leistungen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GeneralSettingsSection({
  settings,
  onSave,
}: {
  settings: SalonSettingsRecord;
  onSave: (patch: Partial<SalonSettingsRecord>) => Promise<void>;
}) {
  const [language, setLanguage] = useState(settings.language || "de-DE");
  const [currency, setCurrency] = useState(settings.currency || "EUR");
  const [timeZone, setTimeZone] = useState(settings.timeZone || "Europe/Berlin");
  const [weekStart, setWeekStart] = useState<"monday" | "sunday">(settings.weekStart || "monday");
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">(settings.timeFormat || "24h");
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(Boolean(settings.ipRestrictionEnabled));
  const [ipWhitelist, setIpWhitelist] = useState(settings.ipWhitelist || "");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSave({
        language,
        currency,
        timeZone,
        weekStart,
        timeFormat,
        ipRestrictionEnabled,
        ipWhitelist,
      });
      setSavedNotice("Allgemeine Einstellungen wurden gespeichert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-general" className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Allgemeine Einstellungen</h2>
          <p className="text-xs text-slate-500">
            Sprache, Zeitzone, Wochenbeginn und Zeitformat für diesen Salon verwalten.
          </p>
        </div>
        <button
          type="button"
          data-testid="general-settings-save"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>

      {savedNotice ? (
        <div
          data-testid="general-settings-saved-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {savedNotice}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SPRACHE
          </label>
          <select
            data-testid="general-language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          >
            <option value="de-DE">Deutsch (Deutschland)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            WÄHRUNG
          </label>
          <select
            data-testid="general-currency-select"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          >
            <option value="EUR">Euro (€)</option>
            <option value="CHF">Schweizer Franken (CHF)</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            ZEITZONE
          </label>
          <select
            data-testid="general-timezone-select"
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          >
            <option value="Europe/Berlin">(GMT+01:00) Berlin</option>
            <option value="Europe/Vienna">(GMT+01:00) Wien</option>
            <option value="Europe/Zurich">(GMT+01:00) Zürich</option>
          </select>
        </div>

        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            WOCHENSTART
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="weekStart"
                data-testid="general-weekstart-monday"
                checked={weekStart === "monday"}
                onChange={() => setWeekStart("monday")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>Montag</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="weekStart"
                data-testid="general-weekstart-sunday"
                checked={weekStart === "sunday"}
                onChange={() => setWeekStart("sunday")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>Sonntag</span>
            </label>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            ZEITFORMAT
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                data-testid="general-timeformat-24h"
                checked={timeFormat === "24h"}
                onChange={() => setTimeFormat("24h")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>13:15 (24-Stunden-Format)</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                data-testid="general-timeformat-12h"
                checked={timeFormat === "12h"}
                onChange={() => setTimeFormat("12h")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>1:15 PM (12-Stunden-Format)</span>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Berechtigungen</h3>
          <p className="mt-1 text-xs text-slate-500">
            IP-Einschränkung: Zugriff auf das Buchungssystem auf bestimmte IP-Adressen Ihres Salons beschränken.
          </p>
          <label className="mt-3 flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              data-testid="general-ip-restriction-checkbox"
              checked={ipRestrictionEnabled}
              onChange={(event) => setIpRestrictionEnabled(event.target.checked)}
              className="h-4 w-4 rounded accent-[#f28b82]"
            />
            <span>Zugriff nur von freigegebenen Salon-IP-Adressen erlauben</span>
          </label>
          {ipRestrictionEnabled ? (
            <input
              type="text"
              value={ipWhitelist}
              onChange={(event) => setIpWhitelist(event.target.value)}
              placeholder="z. B. 192.168.1.10, 84.142.0.1"
              className="mt-2.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DataExportSection() {
  const [tab, setTab] = useState<"monthly" | "lifetime">("monthly");
  const [reportType, setReportType] = useState("appointments");
  const [month, setMonth] = useState("2026-11");
  const [fileType, setFileType] = useState<"csv" | "xls">("csv");
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  return (
    <div data-testid="settings-section-export" className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Datenexport</h2>
        <p className="text-xs text-slate-500">
          Exportieren Sie Termine oder Kundendaten im CSV- oder XLS-Format.
        </p>
      </div>

      <div className="flex gap-6 border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab("monthly")}
          className={`pb-2.5 border-b-2 transition ${
            tab === "monthly"
              ? "border-[#f28b82] text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Monatliche Exporte
        </button>
        <button
          type="button"
          onClick={() => setTab("lifetime")}
          className={`pb-2.5 border-b-2 transition ${
            tab === "lifetime"
              ? "border-[#f28b82] text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Gesamtexporte
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            BERICHTSINFORMATIONEN
          </label>
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          >
            <option value="appointments">Termine</option>
            <option value="customers">Kundenstamm</option>
          </select>
        </div>

        {tab === "monthly" ? (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MONAT
            </label>
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>
        ) : null}

        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            DATEITYP
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="exportFileType"
                checked={fileType === "xls"}
                onChange={() => setFileType("xls")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>XLS</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="exportFileType"
                checked={fileType === "csv"}
                onChange={() => setFileType("csv")}
                className="h-4 w-4 accent-[#f28b82]"
              />
              <span>CSV</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          data-testid="data-export-submit"
          onClick={() =>
            setExportMessage(
              `DSGVO-Schutz: Massenexport (${reportType === "appointments" ? "Termine" : "Kunden"}, ${fileType.toUpperCase()}) erfordert Inhaber-Freigabe.`,
            )
          }
          className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
        >
          Exportieren
        </button>

        {exportMessage ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900">
            {exportMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CompanyInfoSection({
  salonName,
  settings,
  onSave,
}: {
  salonName: string;
  settings: SalonSettingsRecord;
  onSave: (patch: Partial<SalonSettingsRecord> & { salonName?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(salonName);
  const [postalCode, setPostalCode] = useState(settings.postalCode || "22303");
  const [houseNumber, setHouseNumber] = useState(settings.houseNumber || "3");
  const [addressLine, setAddressLine] = useState(settings.addressLine || "Borgweg");
  const [city, setCity] = useState(settings.city || "Hamburg");
  const [phone, setPhone] = useState(settings.phone || "+49 40 60950950");
  const [notificationEmail, setNotificationEmail] = useState(
    settings.notificationEmail || "info@jeannie-nagelstudio.de",
  );
  const [billingEmail, setBillingEmail] = useState(
    settings.billingEmail || "info@jeannie-nagelstudio.de",
  );
  const [smsSender, setSmsSender] = useState(settings.smsSender || "Jeannie");
  const [smsNotificationPhone, setSmsNotificationPhone] = useState(
    settings.smsNotificationPhone || "+49 1520 2384968",
  );
  const [facebookHandle, setFacebookHandle] = useState(settings.facebookHandle || "");
  const [instagramHandle, setInstagramHandle] = useState(
    settings.instagramHandle || "jeanniehamburg",
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSave({
        salonName: name,
        postalCode,
        houseNumber,
        addressLine,
        city,
        phone,
        notificationEmail,
        billingEmail,
        smsSender,
        smsNotificationPhone,
        facebookHandle,
        instagramHandle,
      });
      setSavedNotice("Unternehmensdaten wurden gespeichert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-company" className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unternehmensdaten</h2>
          <p className="text-xs text-slate-500">
            Standortadresse, Kontaktdaten sowie E-Mail- und SMS-Absender verwalten.
          </p>
        </div>
        <button
          type="button"
          data-testid="company-settings-save"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>

      {savedNotice ? (
        <div
          data-testid="company-settings-saved-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {savedNotice}
        </div>
      ) : null}

      {/* Card 1: Company Information matching video 00:75 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Unternehmensinformationen</h3>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SALONNAME
          </label>
          <input
            type="text"
            data-testid="company-salon-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              POSTLEITZAHL
            </label>
            <input
              type="text"
              data-testid="company-postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              HAUSNUMMER
            </label>
            <input
              type="text"
              data-testid="company-house-number"
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ADRESSE / STRASSE
            </label>
            <input
              type="text"
              data-testid="company-address-line"
              value={addressLine}
              onChange={(event) => setAddressLine(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              STADT
            </label>
            <input
              type="text"
              data-testid="company-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            TELEFONNUMMER
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden">
            <span className="border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
              🇩🇪 +49
            </span>
            <input
              type="text"
              data-testid="company-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Email Settings matching video 00:75 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">E-Mail-Einstellungen</h3>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            BENACHRICHTIGUNGS-E-MAIL-ADRESSE
          </label>
          <input
            type="email"
            data-testid="company-notification-email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            KONTAKT-E-MAIL-ADRESSE
          </label>
          <input
            type="email"
            value={billingEmail}
            onChange={(event) => setBillingEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
          />
        </div>
      </div>

      {/* Card 3: SMS Settings matching video 00:75 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">SMS-Einstellungen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SMS-ABSENDERNAME
            </label>
            <input
              type="text"
              value={smsSender}
              onChange={(event) => setSmsSender(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SMS-BENACHRICHTIGUNGSNUMMER
            </label>
            <input
              type="text"
              value={smsNotificationPhone}
              onChange={(event) => setSmsNotificationPhone(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Card 4: Social Information matching video 00:75 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Social-Media-Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              INSTAGRAM
            </label>
            <input
              type="text"
              data-testid="company-instagram"
              value={instagramHandle}
              onChange={(event) => setInstagramHandle(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              FACEBOOK
            </label>
            <input
              type="text"
              value={facebookHandle}
              onChange={(event) => setFacebookHandle(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
