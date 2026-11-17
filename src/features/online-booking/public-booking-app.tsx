"use client";

import { Calendar, Check, ChevronLeft, Clock, MapPin, ShieldCheck, User } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { berlinToday } from "@/features/calendar/calendar-date";

type PublicService = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  durationMinutes: number;
  priceCents: number;
  eligibleStaffIds: string[];
  highlighted: boolean;
};

type PublicStaff = {
  id: string;
  displayName: string;
  color: string;
  sortOrder: number;
  serviceIds: string[];
};

type PublicRules = {
  salonId: string;
  salonName: string;
  city: string;
  phone: string;
  addressLine: string;
  houseNumber: string;
  postalCode: string;
  enabled: boolean;
  language: string;
  bookingOption: "bookings" | "requests";
  customerScope: "all" | "existing";
  allowStaffChoice: boolean;
  staffChoiceRequired: boolean;
  staffFirstStep: boolean;
  assignInOrder: boolean;
  showPrice: boolean;
  showDuration: boolean;
  allowMultiService: boolean;
  highlightTopServices: boolean;
  topServiceIds: string[];
  intervalMinutes: number;
  minNoticeMinutes: number;
  advanceMonths: number;
  preventGaps: boolean;
  allowWaitlist: boolean;
  requestAddress: boolean;
  requestBirthDate: boolean;
  allowNewsletter: boolean;
  showTermsLink: boolean;
  showPrivacyLink: boolean;
  widgetColor: string;
  scheduleView: "week" | "month_week";
  allowCheckAppointments: boolean;
  showCustomAlert: boolean;
  customAlertText: string;
  shareMode: "link" | "button" | "embed";
  buttonPosition: "right" | "left";
};

type PublicSlot = {
  start: string;
  end: string;
  startMinute: number;
  endMinute: number;
  availableStaffIds: string[];
};

type ConfirmationResult = {
  mode: "confirmed" | "request";
  referenceCode: string;
  appointmentId: string | null;
  requestId: string | null;
  salonName: string;
  serviceName: string;
  staffName: string;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  priceCents: number;
};

function formatPriceDe(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDateDe(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}.${m}.${y}`;
}

export function PublicBookingApp({
  token,
  embedded = false,
}: {
  token: string;
  embedded?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [rules, setRules] = useState<PublicRules | null>(null);
  const [linkInfo, setLinkInfo] = useState<{
    token: string;
    name: string;
    allServices: boolean;
    allStaff: boolean;
  } | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [staff, setStaff] = useState<PublicStaff[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("any");
  const [selectedDate, setSelectedDate] = useState<string>(() => berlinToday());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFatalError(null);
    try {
      const res = await fetch(`/api/public/booking/${encodeURIComponent(token)}`);
      const body = (await res.json()) as {
        error?: string;
        link?: { token: string; name: string; allServices: boolean; allStaff: boolean };
        rules?: PublicRules;
        services?: PublicService[];
        staff?: PublicStaff[];
      };
      if (!res.ok || !body.rules) {
        setFatalError(body.error ?? "Dieser Buchungslink konnte nicht geladen werden.");
        return;
      }
      setLinkInfo(body.link ?? null);
      setRules(body.rules);
      setServices(body.services ?? []);
      setStaff(body.staff ?? []);
      if (body.rules.allowStaffChoice && body.rules.staffChoiceRequired && body.staff?.[0]) {
        setSelectedStaffId(body.staff[0].id);
      }
    } catch {
      setFatalError("Verbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const selectedService = useMemo(
    () => services.find((sv) => sv.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  // Filter employees compatible with chosen service (or all allowed when staff-first).
  const visibleStaff = useMemo(() => {
    if (!selectedService) return staff;
    return staff.filter((member) => selectedService.eligibleStaffIds.includes(member.id));
  }, [staff, selectedService]);

  // Filter services compatible with chosen employee when staff is chosen first.
  const visibleServices = useMemo(() => {
    if (!selectedStaffId || selectedStaffId === "any") return services;
    return services.filter((sv) => sv.eligibleStaffIds.includes(selectedStaffId));
  }, [services, selectedStaffId]);

  const loadSlots = useCallback(async () => {
    if (!selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        serviceId: selectedServiceId,
        staffId: selectedStaffId || "any",
      });
      const res = await fetch(
        `/api/public/booking/${encodeURIComponent(token)}?${params.toString()}`,
      );
      const body = (await res.json()) as {
        error?: string;
        availability?: { slots: PublicSlot[] };
      };
      if (!res.ok) {
        setSlots([]);
        setSubmitError(body.error ?? null);
        return;
      }
      const nextSlots = body.availability?.slots ?? [];
      setSlots(nextSlots);
      if (selectedSlot && !nextSlots.some((s) => s.start === selectedSlot)) {
        setSelectedSlot("");
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [token, selectedDate, selectedServiceId, selectedStaffId, selectedSlot]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  // Notify parent page when embedded in an iframe so host can adjust height safely.
  useEffect(() => {
    if (!embedded || typeof window === "undefined") return;
    try {
      window.parent?.postMessage(
        {
          type: "salonflow:embed:ready",
          token,
        },
        "*",
      );
    } catch {
      // ignore cross-origin frame restrictions
    }
  }, [embedded, token, confirmation, selectedServiceId, slots.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedServiceId || !selectedDate || !selectedSlot) {
      setSubmitError("Bitte wählen Sie Leistung, Datum und eine freie Uhrzeit aus.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/booking/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          staffId: rules?.allowStaffChoice ? selectedStaffId : "any",
          date: selectedDate,
          start: selectedSlot,
          firstName,
          lastName,
          email,
          phone,
          addressLine: rules?.requestAddress ? addressLine : undefined,
          postalCode: rules?.requestAddress ? postalCode : undefined,
          city: rules?.requestAddress ? city : undefined,
          birthDate: rules?.requestBirthDate ? birthDate : undefined,
          notes,
          newsletterOptIn: rules?.allowNewsletter ? newsletterOptIn : false,
          privacyAccepted,
          idempotencyKey: `pub_${token}_${selectedDate}_${selectedSlot}_${email.trim().toLowerCase()}`,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        code?: string;
        booking?: ConfirmationResult;
      };
      if (!res.ok || !body.booking) {
        setSubmitError(
          body.error ?? "Die Buchung konnte nicht abgeschlossen werden. Bitte prüfen Sie Ihre Auswahl.",
        );
        if (res.status === 409) {
          await loadSlots();
        }
        return;
      }
      setConfirmation(body.booking);
    } catch {
      setSubmitError("Netzwerkfehler beim Speichern der Buchung.");
    } finally {
      setSubmitting(false);
    }
  }

  const accentColor = rules?.widgetColor || "#18202c";

  if (loading) {
    return (
      <div
        data-testid="public-booking-loading"
        className="flex min-h-[420px] items-center justify-center bg-[#f4f5f7] p-6 text-sm text-slate-600"
      >
        Online-Buchung wird geladen…
      </div>
    );
  }

  if (fatalError || !rules) {
    return (
      <div
        data-testid="public-booking-unavailable"
        className="mx-auto my-10 max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700 font-bold">
          !
        </div>
        <h1 className="text-lg font-bold text-slate-900">Buchung derzeit nicht möglich</h1>
        <p data-testid="public-booking-fatal-error" className="mt-2 text-xs text-slate-600">
          {fatalError ?? "Dieser Buchungslink ist nicht verfügbar."}
        </p>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div
        data-testid="public-booking-confirmation"
        className="mx-auto my-6 max-w-xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {confirmation.mode === "request" ? "Buchungsanfrage eingegangen" : "Termin bestätigt"}
            </span>
            <h1 className="text-lg font-bold text-slate-900">{confirmation.salonName}</h1>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          {confirmation.mode === "request"
            ? "Ihre Terminanfrage wurde im Salon registriert und wird zeitnah geprüft."
            : "Ihr Termin wurde verbindlich im Salon-Kalender eingetragen."}
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Referenzcode</span>
            <span data-testid="public-booking-reference" className="font-mono font-bold text-slate-900">
              {confirmation.referenceCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Leistung</span>
            <span className="font-semibold text-slate-900">{confirmation.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mitarbeiterin</span>
            <span className="font-semibold text-slate-900">{confirmation.staffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Datum & Uhrzeit</span>
            <span className="font-semibold text-slate-900">
              {formatDateDe(confirmation.date)} · {confirmation.start} – {confirmation.end} Uhr
            </span>
          </div>
          {rules.showDuration ? (
            <div className="flex justify-between">
              <span className="text-slate-500">Dauer</span>
              <span className="text-slate-800">{confirmation.durationMinutes} Min.</span>
            </div>
          ) : null}
          {rules.showPrice ? (
            <div className="flex justify-between">
              <span className="text-slate-500">Preis</span>
              <span className="font-bold text-slate-900">
                {formatPriceDe(confirmation.priceCents)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] text-slate-500">
          Hinweis: In der Entwicklungsumgebung werden keine externen E-Mails oder SMS versendet; Ihr Termin ist direkt in der SalonFlow-Datenbank gespeichert.
        </div>

        <button
          type="button"
          data-testid="public-booking-book-another"
          onClick={() => {
            setConfirmation(null);
            setSelectedSlot("");
            void loadSlots();
          }}
          style={{ backgroundColor: accentColor }}
          className="mt-5 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:opacity-95"
        >
          Weiteren Termin buchen
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid={embedded ? "public-booking-embed-root" : "public-booking-page"}
      className={embedded ? "bg-white p-3 sm:p-5" : "min-h-screen bg-[#f4f5f7] py-6 px-3 sm:px-6"}
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Salon header */}
        <div
          style={{ backgroundColor: accentColor }}
          className="px-5 py-4 text-white sm:px-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/75">
                SalonFlow Online-Terminbuchung
              </p>
              <h1 data-testid="public-booking-salon-name" className="text-lg font-bold">
                {rules.salonName}
              </h1>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              🇩🇪 Deutsch
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {rules.addressLine} {rules.houseNumber}, {rules.postalCode} {rules.city}
            </span>
          </p>
          {linkInfo && (!linkInfo.allServices || !linkInfo.allStaff) ? (
            <p
              data-testid="public-booking-filter-badge"
              className="mt-2 inline-block rounded-md bg-white/15 px-2.5 py-0.5 text-[11px]"
            >
              Gefilterte Auswahl: {linkInfo.name}
            </p>
          ) : null}
        </div>

        {rules.showCustomAlert && rules.customAlertText ? (
          <div
            data-testid="public-booking-custom-alert"
            className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-900"
          >
            {rules.customAlertText}
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="divide-y divide-slate-100">
          {/* Employee selection (shown first if staffFirstStep is enabled, matching video 00:27) */}
          {rules.allowStaffChoice ? (
            <section className="p-5 sm:p-6 space-y-3" data-testid="public-step-staff">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  {rules.staffFirstStep ? "1. Wählen Sie einen Mitarbeiter aus" : "Mitarbeiterin auswählen"}
                </h2>
                <span className="text-[11px] text-slate-500">
                  {rules.staffChoiceRequired ? "Pflichtfeld" : "Optional"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {!rules.staffChoiceRequired ? (
                  <button
                    type="button"
                    data-testid="public-staff-any"
                    onClick={() => setSelectedStaffId("any")}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                      selectedStaffId === "any"
                        ? "border-slate-900 bg-slate-900/5 font-bold text-slate-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Keine Mitarbeiterpräferenz</span>
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Auswählen
                    </span>
                  </button>
                ) : null}

                {visibleStaff.map((member) => {
                  const active = selectedStaffId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      data-testid={`public-staff-${member.id}`}
                      onClick={() => setSelectedStaffId(member.id)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                        active
                          ? "border-slate-900 bg-slate-900/5 font-bold text-slate-900"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span>{member.displayName}</span>
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {active ? "Gewählt" : "Auswählen"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Service selection */}
          <section className="p-5 sm:p-6 space-y-3" data-testid="public-step-service">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {rules.allowStaffChoice && rules.staffFirstStep
                  ? "2. Leistung auswählen"
                  : "1. Leistung auswählen"}
              </h2>
              <span className="text-[11px] text-slate-500">
                {visibleServices.length} verfügbar
              </span>
            </div>

            {visibleServices.some((s) => s.highlighted) ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Beliebte Top-Leistungen
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {visibleServices
                    .filter((s) => s.highlighted)
                    .map((svc) => (
                      <button
                        key={`top_${svc.id}`}
                        type="button"
                        data-testid={`public-top-service-${svc.id}`}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs ${
                          selectedServiceId === svc.id
                            ? "border-slate-900 bg-amber-50/70 font-bold"
                            : "border-amber-200 bg-amber-50/30 hover:border-amber-300"
                        }`}
                      >
                        <span>{svc.name}</span>
                        <span className="text-slate-600">
                          {rules.showDuration ? `${svc.durationMinutes} Min.` : ""}{" "}
                          {rules.showPrice ? `· ${formatPriceDe(svc.priceCents)}` : ""}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {visibleServices.map((svc) => {
                const active = selectedServiceId === svc.id;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    data-testid={`public-service-${svc.id}`}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                      active
                        ? "border-slate-900 bg-slate-900/5 font-bold text-slate-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div>
                      <span className="block">{svc.name}</span>
                      <span className="text-[11px] text-slate-400">{svc.categoryName}</span>
                    </div>
                    <div className="text-right text-xs">
                      {rules.showPrice ? (
                        <span className="block font-bold text-slate-900">
                          {formatPriceDe(svc.priceCents)}
                        </span>
                      ) : null}
                      {rules.showDuration ? (
                        <span className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {svc.durationMinutes} Min.
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Date & available time slots */}
          <section className="p-5 sm:p-6 space-y-3" data-testid="public-step-datetime">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Datum & freie Uhrzeit</h2>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  data-testid="public-booking-date"
                  value={selectedDate}
                  min={berlinToday()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            {!selectedServiceId ? (
              <p className="rounded-lg bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                Bitte wählen Sie zuerst eine Leistung aus, um freie Zeiten zu sehen.
              </p>
            ) : loadingSlots ? (
              <p className="text-xs text-slate-500">Verfügbare Zeiten werden geprüft…</p>
            ) : slots.length === 0 ? (
              <div
                data-testid="public-no-slots"
                className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-3 text-xs text-amber-900"
              >
                An diesem Tag sind keine freien Zeiten verfügbar. Bitte wählen Sie ein anderes Datum.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" data-testid="public-slot-grid">
                {slots.map((slot) => {
                  const active = selectedSlot === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      data-testid={`public-slot-${slot.start}`}
                      onClick={() => setSelectedSlot(slot.start)}
                      style={active ? { backgroundColor: accentColor, color: "#fff" } : undefined}
                      className={`rounded-lg border px-2.5 py-2 text-center text-xs font-semibold transition ${
                        active
                          ? "border-transparent shadow-xs"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                      }`}
                    >
                      {slot.start}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Customer details + GDPR */}
          <section className="p-5 sm:p-6 space-y-3" data-testid="public-step-customer">
            <h2 className="text-sm font-bold text-slate-900">Ihre Kontaktdaten</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Vorname *
                </label>
                <input
                  type="text"
                  required
                  data-testid="public-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Nachname *
                </label>
                <input
                  type="text"
                  required
                  data-testid="public-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  required
                  data-testid="public-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  required
                  data-testid="public-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            {rules.requestAddress ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Straße & Hausnummer"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="PLZ"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Ort"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            ) : null}

            {rules.requestBirthDate ? (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Geburtsdatum
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Anmerkung zum Termin (optional)
              </label>
              <textarea
                rows={2}
                data-testid="public-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  data-testid="public-privacy-consent"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#f28b82]"
                />
                <span>
                  Ich stimme der Verarbeitung meiner Angaben zur Terminvereinbarung gemäß Datenschutzerklärung zu. *
                </span>
              </label>

              {rules.allowNewsletter ? (
                <label className="flex items-start gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    data-testid="public-newsletter-optin"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#f28b82]"
                  />
                  <span>
                    Ich möchte gelegentlich Salon-Neuigkeiten per E-Mail erhalten (optional, jederzeit widerrufbar).
                  </span>
                </label>
              ) : null}
            </div>

            {submitError ? (
              <div
                data-testid="public-booking-error"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
              >
                {submitError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !selectedServiceId || !selectedSlot}
              data-testid="public-booking-submit"
              style={{ backgroundColor: accentColor }}
              className="w-full rounded-xl px-5 py-3 text-xs font-bold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              {submitting
                ? "Wird geprüft & gespeichert…"
                : rules.bookingOption === "requests"
                  ? "Terminanfrage absenden"
                  : "Termin verbindlich buchen"}
            </button>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Echtzeit-Verfügbarkeit durch SalonFlow Booking Engine
              </span>
              {rules.allowCheckAppointments ? <span>Hast du bereits gebucht? Termine anzeigen</span> : null}
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
