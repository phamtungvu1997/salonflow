"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  SalonSettingsRecord,
  ServiceCategoryRecord,
  ServiceRecord,
  StaffMemberRecord,
} from "./settings-types";

type PanelId = "main" | "schedule" | "customer" | "payments" | "style";

interface BookingLinkRow {
  id: string;
  token: string;
  name: string;
  isDefault: boolean;
  shareFormat: "link" | "embed";
  active: boolean;
}

const NOTICE_OPTIONS = [
  { value: 0, label: "Keine" },
  { value: 30, label: "30 Minuten" },
  { value: 60, label: "1 Stunde" },
  { value: 120, label: "2 Stunden" },
  { value: 240, label: "4 Stunden" },
  { value: 1440, label: "1 Tag" },
  { value: 2880, label: "2 Tage" },
];

function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-xs font-medium text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded accent-[#f28b82]"
      />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{hint}</span> : null}
      </span>
    </label>
  );
}

function Radio({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  name: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-800">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-[#f28b82]" />
      {label}
    </label>
  );
}

export function OnlineBookingsSection({
  salonId,
  salonName,
  settings,
  services,
  categories,
  staff,
  onSave,
}: {
  salonId: string;
  salonName: string;
  settings: SalonSettingsRecord;
  services: ServiceRecord[];
  categories: ServiceCategoryRecord[];
  staff: StaffMemberRecord[];
  onSave: (patch: Partial<SalonSettingsRecord>) => Promise<void>;
}) {
  const [open, setOpen] = useState<PanelId>("main");
  const [enabled, setEnabled] = useState(settings.onlineBookingEnabled ?? true);
  const [language, setLanguage] = useState(settings.onlineWidgetLanguage || "de");
  const [bookingOption, setBookingOption] = useState<"bookings" | "requests">(
    settings.onlineBookingOption || "bookings",
  );
  const [customerScope, setCustomerScope] = useState<"all" | "existing">(
    settings.onlineCustomerScope || "all",
  );
  const [allowStaffChoice, setAllowStaffChoice] = useState(settings.onlineAllowStaffChoice ?? true);
  const [staffRequired, setStaffRequired] = useState(settings.onlineStaffChoiceRequired ?? false);
  const [staffFirst, setStaffFirst] = useState(settings.onlineStaffFirstStep ?? true);
  const [assignInOrder, setAssignInOrder] = useState(settings.onlineAssignInOrder ?? false);
  const [showPrice, setShowPrice] = useState(settings.onlineShowPrice ?? true);
  const [showDuration, setShowDuration] = useState(settings.onlineShowDuration ?? true);
  const [allowMulti, setAllowMulti] = useState(settings.onlineAllowMultiService ?? false);
  const [highlightTop, setHighlightTop] = useState(settings.onlineHighlightTopServices ?? true);
  const [topIds, setTopIds] = useState<string[]>(settings.onlineTopServiceIds ?? []);
  const [topOpen, setTopOpen] = useState(false);
  const [interval, setInterval] = useState(settings.onlineIntervalMinutes || 60);
  const [notice, setNotice] = useState(settings.onlineMinNoticeMinutes ?? 0);
  const [advance, setAdvance] = useState(settings.onlineAdvanceMonths || 12);
  const [preventGaps, setPreventGaps] = useState(settings.onlinePreventGaps ?? false);
  const [allowWaitlist, setAllowWaitlist] = useState(settings.onlineAllowWaitlist ?? true);
  const [requestAddress, setRequestAddress] = useState(settings.onlineRequestAddress ?? false);
  const [requestBirth, setRequestBirth] = useState(settings.onlineRequestBirthDate ?? false);
  const [allowNewsletter, setAllowNewsletter] = useState(settings.onlineAllowNewsletter ?? true);
  const [showTerms, setShowTerms] = useState(settings.onlineShowTermsLink ?? false);
  const [showPrivacy, setShowPrivacy] = useState(settings.onlineShowPrivacyLink ?? false);
  const [color, setColor] = useState(settings.onlineWidgetColor || "#18202c");
  const [scheduleView, setScheduleView] = useState<"week" | "month_week">(
    settings.onlineScheduleView || "week",
  );
  const [allowCheck, setAllowCheck] = useState(settings.onlineAllowCheckAppointments ?? true);
  const [showAlert, setShowAlert] = useState(settings.onlineShowCustomAlert ?? false);
  const [alertText, setAlertText] = useState(settings.onlineCustomAlertText || "");
  const [analyticsId, setAnalyticsId] = useState(settings.onlineAnalyticsId || "");
  const [shareMode, setShareMode] = useState<"link" | "button" | "embed">(
    settings.onlineShareMode || "button",
  );
  const [buttonPosition, setButtonPosition] = useState<"right" | "left">(
    settings.onlineButtonPosition || "right",
  );
  const [saving, setSaving] = useState(false);
  const [noticeText, setNoticeText] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [defaultToken, setDefaultToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeServices = useMemo(
    () => services.filter((service) => service.active !== false),
    [services],
  );
  const activeStaff = useMemo(
    () => staff.filter((member) => member.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [staff],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/online-booking/links?salonId=${encodeURIComponent(salonId)}`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body: { defaultLink?: { token: string } } | null) => {
        if (!cancelled && body?.defaultLink?.token) setDefaultToken(body.defaultLink.token);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [salonId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = defaultToken ? `${origin}/b/${defaultToken}` : "";
  const shareSnippet =
    shareMode === "embed" && defaultToken
      ? `<iframe src="${origin}/embed/${defaultToken}" title="Online-Buchung ${salonName}" style="width:100%;min-height:760px;border:0"></iframe>`
      : shareMode === "button" && publicUrl
        ? `<a href="${publicUrl}" style="display:inline-block;background:${color};color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;float:${buttonPosition}">Termin buchen</a>`
        : publicUrl;

  async function save() {
    setSaving(true);
    setNoticeText(null);
    try {
      await onSave({
        onlineBookingEnabled: enabled,
        onlineWidgetLanguage: language,
        onlineBookingOption: bookingOption,
        onlineCustomerScope: customerScope,
        onlineAllowStaffChoice: allowStaffChoice,
        onlineStaffChoiceRequired: allowStaffChoice && staffRequired,
        onlineStaffFirstStep: staffFirst,
        onlineAssignInOrder: assignInOrder,
        onlineShowPrice: showPrice,
        onlineShowDuration: showDuration,
        onlineAllowMultiService: allowMulti,
        onlineHighlightTopServices: highlightTop,
        onlineTopServiceIds: topIds.slice(0, 9),
        onlineIntervalMinutes: interval,
        onlineMinNoticeMinutes: notice,
        onlineAdvanceMonths: advance,
        onlinePreventGaps: preventGaps,
        onlineAllowWaitlist: allowWaitlist,
        onlineRequestAddress: requestAddress,
        onlineRequestBirthDate: requestBirth,
        onlineAllowNewsletter: allowNewsletter,
        onlineShowTermsLink: showTerms,
        onlineShowPrivacyLink: showPrivacy,
        onlineWidgetColor: color,
        onlineScheduleView: scheduleView,
        onlineAllowCheckAppointments: allowCheck,
        onlineShowCustomAlert: showAlert,
        onlineCustomAlertText: alertText.trim(),
        onlineAnalyticsId: analyticsId.trim(),
        onlineShareMode: shareMode,
        onlineButtonPosition: buttonPosition,
      });
      setNoticeText("Online-Buchung gespeichert. Die öffentliche Buchungsseite verwendet diese Regeln.");
    } finally {
      setSaving(false);
    }
  }

  function toggleTop(id: string) {
    setTopIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 9) return current;
      return [...current, id];
    });
  }

  async function copySnippet() {
    if (!shareSnippet) return;
    await navigator.clipboard.writeText(shareSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div data-testid="settings-section-online-bookings" className="grid gap-6 xl:grid-cols-[minmax(0,680px)_minmax(260px,1fr)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Online-Buchungen</h2>
            <p className="text-xs text-slate-500">
              Alles rund um Online-Termine und das Buchungs-Widget für {salonName}.
            </p>
          </div>
          <button
            type="button"
            data-testid="online-bookings-save"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>

        {noticeText ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900">
            {noticeText}
          </div>
        ) : null}

        <Accordion
          title="Haupteinstellungen"
          open={open === "main"}
          onToggle={() => setOpen(open === "main" ? "schedule" : "main")}
        >
          <Check
            checked={enabled}
            onChange={setEnabled}
            label="Online-Buchung ist eingeschaltet"
            hint="Ausgeschaltet nimmt der öffentliche Link keine neuen Termine an. Bestehende Termine bleiben im Kalender."
          />
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sprache von Widget und E-Mails
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-900"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Buchungsart</legend>
            <Radio name="booking-option" checked={bookingOption === "bookings"} onChange={() => setBookingOption("bookings")} label="Online-Buchungen" />
            <Radio name="booking-option" checked={bookingOption === "requests"} onChange={() => setBookingOption("requests")} label="Buchungsanfragen" />
          </fieldset>
          {bookingOption === "requests" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
              Kundinnen senden eine Anfrage. Der Termin steht erst im Kalender, wenn das Team ihn freigibt. Die Booking Engine bleibt die einzige Stelle, die den Termin anlegt.
            </p>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gilt für</legend>
            <Radio name="customer-scope" checked={customerScope === "all"} onChange={() => setCustomerScope("all")} label="Alle Kundinnen" />
            <Radio name="customer-scope" checked={customerScope === "existing"} onChange={() => setCustomerScope("existing")} label="Nur Bestandskundinnen" />
          </fieldset>
          {customerScope === "existing" ? (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-950">
              Neue Kundinnen können online nicht buchen. Die E-Mail muss schon zu einer Kundin dieses Salons gehören.
            </p>
          ) : null}

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-xs font-bold text-slate-900">Mitarbeiterauswahl</p>
            <Check checked={allowStaffChoice} onChange={setAllowStaffChoice} label="Kundinnen dürfen eine Mitarbeiterin wählen" />
            {allowStaffChoice ? (
              <div className="ml-6 flex gap-4">
                <Radio name="staff-req" checked={!staffRequired} onChange={() => setStaffRequired(false)} label="Optional" />
                <Radio name="staff-req" checked={staffRequired} onChange={() => setStaffRequired(true)} label="Pflicht" />
              </div>
            ) : null}
            <Check checked={staffFirst} onChange={setStaffFirst} label="Mitarbeiterauswahl als ersten Schritt zeigen" />
            <Check
              checked={assignInOrder}
              onChange={setAssignInOrder}
              label="Termine in der Mitarbeiterreihenfolge vergeben"
              hint="Ohne Wunsch nimmt die Buchung die erste freie Person in der gespeicherten Reihenfolge. Sonst die Person mit den wenigsten Terminen an dem Tag."
            />
            <button type="button" onClick={() => setOrderOpen(true)} className="text-[11px] font-bold text-sky-700 hover:underline">
              Reihenfolge festlegen
            </button>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-xs font-bold text-slate-900">Leistungen</p>
            <Check checked={showPrice} onChange={setShowPrice} label="Preis anzeigen" />
            <Check checked={showDuration} onChange={setShowDuration} label="Dauer anzeigen" />
            <Check checked={allowMulti} onChange={setAllowMulti} label="Mehrere Leistungen auswählbar" />
            <Check checked={highlightTop} onChange={setHighlightTop} label="Top-Leistungen hervorheben" />
            <div>
              <button
                type="button"
                onClick={() => setTopOpen((value) => !value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs text-slate-800"
              >
                {topIds.length} ausgewählt (max. 9)
              </button>
              {topOpen ? (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {activeServices.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={topIds.includes(service.id)}
                        onChange={() => toggleTop(service.id)}
                      />
                      {service.name}
                    </label>
                  ))}
                  <button type="button" onClick={() => setTopOpen(false)} className="w-full bg-[#18202c] py-1.5 text-[11px] font-bold text-white">
                    OK
                  </button>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {topIds.map((id) => {
                  const service = activeServices.find((item) => item.id === id);
                  if (!service) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTop(id)}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                    >
                      {service.name} ×
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Accordion>

        <Accordion title="Zeitplan" open={open === "schedule"} onToggle={() => setOpen(open === "schedule" ? "main" : "schedule")}>
          <SelectField label="Online-Buchungsintervall" value={interval} onChange={setInterval} options={[{ value: 15, label: "15 Min." }, { value: 30, label: "30 Min." }, { value: 60, label: "60 Min." }]} />
          <SelectField label="Mindestabstand zwischen Buchung und Terminbeginn" value={notice} onChange={setNotice} options={NOTICE_OPTIONS} />
          <SelectField label="Wie weit im Voraus online gebucht werden kann" value={advance} onChange={setAdvance} options={[{ value: 1, label: "1 Monat" }, { value: 3, label: "3 Monate" }, { value: 6, label: "6 Monate" }, { value: 12, label: "12 Monate" }]} />
          <Check
            checked={preventGaps}
            onChange={setPreventGaps}
            label="Lücken im Kalender vermeiden"
            hint="Zeigt nur Zeiten am Schichtanfang, am Schichtende oder direkt an einem bestehenden Termin."
          />
          <div className="rounded-lg border border-slate-200 p-3">
            <Check checked={allowWaitlist} onChange={setAllowWaitlist} label="Kundinnen dürfen sich auf die Warteliste setzen" />
            <p className="mt-2 text-[11px] text-slate-500">
              Benachrichtigungen gehen an {settings.notificationEmail || "die Salon-E-Mail"}. Die Warteliste selbst liegt unter Marketing.
            </p>
          </div>
        </Accordion>

        <Accordion title="Kundendaten" open={open === "customer"} onToggle={() => setOpen(open === "customer" ? "main" : "customer")}>
          <p className="text-[11px] text-slate-500">Name, E-Mail und Telefon sind immer Pflicht.</p>
          <Check checked={requestAddress} onChange={setRequestAddress} label="Adresse abfragen" />
          <Check checked={requestBirth} onChange={setRequestBirth} label="Geburtsdatum abfragen" />
          <Check checked={allowNewsletter} onChange={setAllowNewsletter} label="Newsletter-Anmeldung anbieten" />
          <Check checked={showTerms} onChange={setShowTerms} label="Hinweis auf die AGB zeigen" />
          <Check checked={showPrivacy} onChange={setShowPrivacy} label="Hinweis auf die Datenschutzerklärung zeigen" />
        </Accordion>

        <Accordion title="Online-Zahlungen" open={open === "payments"} onToggle={() => setOpen(open === "payments" ? "main" : "payments")} badge="1">
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-950">
            Online-Zahlungen und Anzahlungen sind in SalonFlow V1 nicht angebunden. Kundinnen buchen den Termin und bezahlen im Salon. Es wird kein Zahlungsanbieter aufgerufen.
          </p>
        </Accordion>

        <Accordion title="Stil und Teilen" open={open === "style"} onToggle={() => setOpen(open === "style" ? "main" : "style")}>
          <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Farbe
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white" />
            <input value={color} onChange={(event) => setColor(event.target.value)} className="w-28 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs normal-case tracking-normal text-slate-900" />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kalenderansicht</legend>
            <Radio name="view" checked={scheduleView === "week"} onChange={() => setScheduleView("week")} label="Woche" />
            <Radio name="view" checked={scheduleView === "month_week"} onChange={() => setScheduleView("month_week")} label="Monat und Woche" />
          </fieldset>
          <Check checked={allowCheck} onChange={setAllowCheck} label="Hinweis „Termine anzeigen“ im Widget" />
          <Check checked={showAlert} onChange={setShowAlert} label="Eigenen Hinweis im Widget zeigen" />
          {showAlert ? (
            <textarea
              value={alertText}
              onChange={(event) => setAlertText(event.target.value)}
              rows={2}
              maxLength={300}
              placeholder="z. B. Bitte ohne Gel-Nägel zum Auffüllen kommen."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          ) : null}
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Google-Analytics-ID
            <input
              value={analyticsId}
              onChange={(event) => setAnalyticsId(event.target.value)}
              placeholder="G-"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-900"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Widget teilen</legend>
            <Radio name="share" checked={shareMode === "link"} onChange={() => setShareMode("link")} label="Link zum Teilen" />
            <Radio name="share" checked={shareMode === "button"} onChange={() => setShareMode("button")} label="Code für einen Button auf der Website" />
            <Radio name="share" checked={shareMode === "embed"} onChange={() => setShareMode("embed")} label="Code für ein offenes Widget auf der Website" />
          </fieldset>
          {shareMode === "button" ? (
            <div className="flex gap-4">
              <Radio name="pos" checked={buttonPosition === "right"} onChange={() => setButtonPosition("right")} label="Rechts" />
              <Radio name="pos" checked={buttonPosition === "left"} onChange={() => setButtonPosition("left")} label="Links" />
            </div>
          ) : null}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-600">
              Diesen Code oder Link nach dem Speichern auf der Website einfügen. Farbe und Sprache stecken in den Salon-Einstellungen, der Link öffnet die echte Buchung.
            </p>
            <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md bg-white p-2 text-[11px] text-slate-800">
              {shareSnippet || "Buchungslink wird geladen…"}
            </pre>
            <button type="button" onClick={() => void copySnippet()} className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-bold text-slate-800">
              {copied ? "Kopiert" : "Kopieren"}
            </button>
          </div>
          <button type="button" onClick={() => setCustomOpen(true)} className="text-[11px] font-bold text-sky-700 hover:underline">
            Eigenes Buchungs-Widget mit gefilterten Leistungen erstellen
          </button>
        </Accordion>

        <BookingRequestsPanel salonId={salonId} />
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-xs xl:sticky xl:top-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vorschau nach dem Speichern</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="px-4 py-3 text-white" style={{ backgroundColor: color }}>
            <p className="text-sm font-bold">{salonName}</p>
            <p className="text-[11px] text-white/80">{language === "en" ? "Book online" : "Online Termin buchen"}</p>
          </div>
          <div className="space-y-2 p-4 text-xs text-slate-700">
            {showAlert && alertText ? <p className="rounded-md bg-amber-50 px-2 py-1 text-amber-900">{alertText}</p> : null}
            <p className="font-semibold">{allowStaffChoice && staffFirst ? "1. Mitarbeiterin" : "1. Leistung"}</p>
            <p className="rounded-lg border border-slate-200 px-3 py-2">
              Shellac
              {showDuration ? " · 45 Min." : ""}
              {showPrice ? " · 42,00 €" : ""}
            </p>
            <p className="text-[11px] text-slate-500">
              {bookingOption === "requests" ? "Wird als Anfrage gesendet." : "Wird direkt über die Booking Engine gebucht."}
              {customerScope === "existing" ? " Nur Bestandskundinnen." : ""}
            </p>
            {publicUrl ? (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-block font-bold text-sky-700 hover:underline">
                Öffentliche Buchung öffnen
              </a>
            ) : null}
          </div>
        </div>
      </aside>

      {orderOpen ? (
        <EmployeeOrderDialog
          salonId={salonId}
          staff={activeStaff}
          onClose={() => setOrderOpen(false)}
        />
      ) : null}
      {customOpen ? (
        <CustomWidgetDialog
          salonId={salonId}
          services={activeServices}
          categories={categories}
          staff={activeStaff}
          onClose={() => setCustomOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  badge,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-900">
        <span className="flex items-center gap-2">
          {open ? "▾" : "▸"} {title}
          {badge ? <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">{badge}</span> : null}
        </span>
      </button>
      {open ? <div className="space-y-3 border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BookingRequestsPanel({ salonId }: { salonId: string }) {
  const [rows, setRows] = useState<
    { id: string; customerName: string; serviceName: string; staffName: string; requestedDate: string; requestedStart: string; status: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/online-booking/requests?salonId=${encodeURIComponent(salonId)}`);
    if (!response.ok) return;
    const body = (await response.json()) as { requests?: typeof rows };
    setRows(body.requests ?? []);
  }, [salonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(requestId: string, decision: "approve" | "reject") {
    setError(null);
    const response = await fetch("/api/online-booking/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, requestId, decision }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string; requests?: typeof rows };
    if (!response.ok) {
      setError(body.error ?? "Die Anfrage konnte nicht entschieden werden.");
      return;
    }
    setRows(body.requests ?? []);
  }

  const pending = rows.filter((row) => row.status === "pending");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900">Offene Buchungsanfragen</h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Freigeben legt den Termin über die Booking Engine an. Ist die Zeit inzwischen belegt, bleibt die Anfrage offen und der Kalender unverändert.
      </p>
      {error ? <p className="mt-2 text-[11px] text-rose-700">{error}</p> : null}
      {pending.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">Keine offenen Anfragen.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {pending.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
              <span>
                <span className="font-semibold text-slate-900">{row.customerName}</span>
                <span className="text-slate-500"> · {row.serviceName} · {row.staffName} · {row.requestedDate} {row.requestedStart}</span>
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => void decide(row.id, "approve")} className="rounded-md bg-[#18202c] px-2 py-1 text-[11px] font-bold text-white">Freigeben</button>
                <button type="button" onClick={() => void decide(row.id, "reject")} className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700">Ablehnen</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmployeeOrderDialog({
  salonId,
  staff,
  onClose,
}: {
  salonId: string;
  staff: StaffMemberRecord[];
  onClose: () => void;
}) {
  const [rows, setRows] = useState(staff);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const copy = [...rows];
    const [item] = copy.splice(index, 1);
    if (!item) return;
    copy.splice(next, 0, item);
    setRows(copy);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      for (let index = 0; index < rows.length; index += 1) {
        const member = rows[index];
        if (!member) continue;
        const response = await fetch(`/api/staff/${member.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ salonId, sortOrder: index + 1 }),
        });
        if (!response.ok) {
          setError("Die Reihenfolge konnte nicht gespeichert werden.");
          return;
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Mitarbeiterreihenfolge</h3>
          <button type="button" onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Oben steht die Person, die bei „Keine Präferenz“ zuerst einen freien Termin bekommt, wenn die Reihenfolge aktiv ist.
        </p>
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between py-2 text-xs">
              <span className="font-semibold text-slate-800">{index + 1}. {member.displayName}</span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} className="rounded border border-slate-300 px-2 py-0.5">Hoch</button>
                <button type="button" onClick={() => move(index, 1)} className="rounded border border-slate-300 px-2 py-0.5">Runter</button>
              </span>
            </li>
          ))}
        </ul>
        {error ? <p className="mt-2 text-[11px] text-rose-700">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs">Abbrechen</button>
          <button type="button" disabled={saving} onClick={() => void save()} className="rounded-md bg-[#18202c] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Speichert…" : "Reihenfolge speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomWidgetDialog({
  salonId,
  services,
  categories,
  staff,
  onClose,
}: {
  salonId: string;
  services: ServiceRecord[];
  categories: ServiceCategoryRecord[];
  staff: StaffMemberRecord[];
  onClose: () => void;
}) {
  const [allServices, setAllServices] = useState(true);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [allStaff, setAllStaff] = useState(true);
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [shareFormat, setShareFormat] = useState<"link" | "embed">("link");
  const [result, setResult] = useState<BookingLinkRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceRecord[]>();
    for (const service of services) {
      const key = service.categoryName || "Weitere";
      map.set(key, [...(map.get(key) ?? []), service]);
    }
    return [...map.entries()];
  }, [services]);

  function toggleId(list: string[], id: string, setList: (value: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function generate() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/online-booking/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          shareFormat,
          allServices,
          serviceIds: allServices ? [] : serviceIds,
          allStaff,
          staffIds: allStaff ? [] : staffIds,
        }),
      });
      const body = (await response.json()) as { link?: BookingLinkRow; error?: string };
      if (!response.ok || !body.link) {
        setError(body.error ?? "Der Link konnte nicht erzeugt werden.");
        return;
      }
      setResult(body.link);
    } finally {
      setSaving(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = result
    ? result.shareFormat === "embed"
      ? `${origin}/embed/${result.token}`
      : `${origin}/b/${result.token}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Widget mit eigener Auswahl</h3>
          <button type="button" onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Ein eigener Link mit vorausgewählten Leistungen und Mitarbeiterinnen, zum Beispiel für Instagram oder die Website.
        </p>

        <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={allServices} onChange={(event) => setAllServices(event.target.checked)} />
          Alle Leistungen ({services.length})
        </label>
        {!allServices ? (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
            {grouped.map(([name, items]) => (
              <div key={name}>
                <button type="button" onClick={() => setOpenCategory(openCategory === name ? null : name)} className="flex w-full justify-between px-3 py-1.5 text-left text-xs font-semibold" style={{ backgroundColor: items[0]?.categoryColor || "#eef2f6" }}>
                  <span>{name}</span>
                  <span>{items.filter((item) => serviceIds.includes(item.id)).length} / {items.length}</span>
                </button>
                {openCategory === name
                  ? items.map((service) => (
                      <label key={service.id} className="flex items-center gap-2 px-3 py-1 text-xs">
                        <input type="checkbox" checked={serviceIds.includes(service.id)} onChange={() => toggleId(serviceIds, service.id, setServiceIds)} />
                        {service.name}
                      </label>
                    ))
                  : null}
              </div>
            ))}
            {categories.length === 0 ? null : null}
          </div>
        ) : null}

        <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={allStaff} onChange={(event) => setAllStaff(event.target.checked)} />
          Alle Mitarbeiterinnen ({staff.length})
        </label>
        {!allStaff ? (
          <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-slate-200">
            {staff.map((member) => (
              <label key={member.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-1 text-xs">
                <input type="checkbox" checked={staffIds.includes(member.id)} onChange={() => toggleId(staffIds, member.id, setStaffIds)} />
                {member.displayName}
              </label>
            ))}
          </div>
        ) : null}

        <fieldset className="mt-3 space-y-1">
          <Radio name="custom-share" checked={shareFormat === "link"} onChange={() => setShareFormat("link")} label="Link zum Teilen" />
          <Radio name="custom-share" checked={shareFormat === "embed"} onChange={() => setShareFormat("embed")} label="Code für ein offenes Widget" />
        </fieldset>

        {error ? <p className="mt-2 text-[11px] text-rose-700">{error}</p> : null}
        {url ? (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-bold text-slate-700">{result?.name}</p>
            <p className="mt-1 break-all text-[11px] text-slate-800">{url}</p>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(url)}
              className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold"
            >
              Kopieren
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs">Schließen</button>
          <button type="button" disabled={saving} onClick={() => void generate()} className="rounded-md bg-[#18202c] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Erzeugt…" : "Link erzeugen"}
          </button>
        </div>
      </div>
    </div>
  );
}
