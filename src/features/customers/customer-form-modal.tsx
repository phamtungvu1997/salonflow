"use client";

import { Calendar, Heart, Info, Paperclip, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/features/booking/api";
import { CustomerGender, CustomerRecord, customerInitials } from "@/features/customers/customer-types";
import {
  buildCustomerMutationPayload,
  validateCustomerFormDraft,
} from "@/features/customers/customer-validation";

type CustomerFormModalProps = {
  open: boolean;
  salonId: string;
  initialCustomer?: CustomerRecord | null;
  onClose: () => void;
  onSaved: (customerId: string) => Promise<void> | void;
};

export function CustomerFormModal({
  open,
  salonId,
  initialCustomer = null,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEditing = Boolean(initialCustomer);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<CustomerGender>("unknown");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phoneLandline, setPhoneLandline] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState("");
  const [appointmentWarning, setAppointmentWarning] = useState("");
  const [submittedEmpty, setSubmittedEmpty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmittedEmpty(false);
    setErrorMessage(null);
    setCreatingLabel(false);
    setNewLabelText("");
    if (initialCustomer) {
      setFirstName(initialCustomer.firstName || "");
      setLastName(initialCustomer.lastName || "");
      setGender(initialCustomer.gender || "unknown");
      setBirthDate(initialCustomer.birthDate || "");
      setEmail(initialCustomer.email || "");
      setPhoneLandline(initialCustomer.phoneLandline || "");
      setPhone(initialCustomer.phone || "");
      setPostalCode(initialCustomer.postalCode || "");
      setHouseNumber(initialCustomer.houseNumber || "");
      setAddressLine(initialCustomer.addressLine || "");
      setCity(initialCustomer.city || "");
      setLabels(initialCustomer.labels ?? []);
      setAdditionalInfo(initialCustomer.additionalInfo || "");
      setInvoiceInfo(initialCustomer.invoiceInfo || "");
      setAppointmentWarning(initialCustomer.appointmentWarning || "");
    } else {
      setFirstName("");
      setLastName("");
      setGender("unknown");
      setBirthDate("");
      setEmail("");
      setPhoneLandline("");
      setPhone("");
      setPostalCode("");
      setHouseNumber("");
      setAddressLine("");
      setCity("");
      setLabels([]);
      setAdditionalInfo("");
      setInvoiceInfo("");
      setAppointmentWarning("");
    }
  }, [open, initialCustomer]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function toggleLabel(tag: string) {
    setLabels((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  }

  function addCustomLabel() {
    const trimmed = newLabelText.trim();
    if (!trimmed) return;
    if (!labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
    }
    setNewLabelText("");
    setCreatingLabel(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateCustomerFormDraft({ firstName, lastName });
    if (!validation.valid) {
      setSubmittedEmpty(true);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = buildCustomerMutationPayload(salonId, {
        firstName,
        lastName,
        gender,
        birthDate,
        email,
        phone,
        phoneLandline,
        postalCode,
        houseNumber,
        addressLine,
        city,
        labels,
        additionalInfo,
        invoiceInfo,
        appointmentWarning,
      });

      if (initialCustomer) {
        const res = await api<{ customerId: string }>(`/api/customers/${initialCustomer.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        await onSaved(res.customerId);
      } else {
        const res = await api<{ customerId: string }>("/api/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await onSaved(res.customerId);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kundin konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  const availableLabels = Array.from(new Set(["Favorit", ...labels]));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        data-testid="customer-form-modal"
        className="flex max-h-[calc(100vh-36px)] w-[min(740px,96vw)] flex-col overflow-hidden rounded-xl border border-[#d9dde3] bg-white text-[#1c1e21] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h2 id="customer-modal-title" className="text-[18px] font-bold tracking-tight text-[#1c1e21]">
            {isEditing ? "Kundin bearbeiten" : "Kundin erstellen"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            data-testid="customer-modal-close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6a6f76] hover:bg-[#f2f4f7] hover:text-[#1c1e21]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {errorMessage ? (
            <div
              role="alert"
              data-testid="customer-form-error"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800"
            >
              {errorMessage}
            </div>
          ) : null}

          {/* Section 1: Personal information */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Persönliche Angaben</h3>
            <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-first-name-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  VORNAME <span className="text-[#e05a6d]">*</span>
                </label>
                <input
                  id="customer-first-name-input"
                  name="firstName"
                  data-testid="customer-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  autoFocus
                  className={`mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none transition-colors focus:border-[#18202c] ${
                    submittedEmpty && !firstName.trim() ? "border-[#e05a6d]" : "border-[#cfd4dc]"
                  }`}
                />
                {submittedEmpty && !firstName.trim() ? (
                  <p
                    data-testid="customer-first-name-required"
                    className="mt-1 text-[11.5px] font-medium text-[#e05a6d]"
                  >
                    * Pflichtfeld (Vorname erforderlich)
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="customer-last-name-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  NACHNAME <span className="text-[#e05a6d]">*</span>
                </label>
                <input
                  id="customer-last-name-input"
                  name="lastName"
                  data-testid="customer-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nachname"
                  className={`mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none transition-colors focus:border-[#18202c] ${
                    submittedEmpty && !lastName.trim() ? "border-[#e05a6d]" : "border-[#cfd4dc]"
                  }`}
                />
                {submittedEmpty && !lastName.trim() ? (
                  <p
                    data-testid="customer-last-name-required"
                    className="mt-1 text-[11.5px] font-medium text-[#e05a6d]"
                  >
                    * Pflichtfeld (Nachname erforderlich)
                  </p>
                ) : null}
              </div>
            </div>

            {/* Gender radios */}
            <div className="mt-4">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]">
                GESCHLECHT
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-5">
                {(
                  [
                    ["male", "Männlich"],
                    ["female", "Weiblich"],
                    ["non_binary", "Divers"],
                    ["unknown", "Unbekannt"],
                  ] as const
                ).map(([val, label]) => {
                  const active = gender === val;
                  return (
                    <label
                      key={val}
                      className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#1c1e21]"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={val}
                        checked={active}
                        onChange={() => setGender(val)}
                        data-testid={`customer-gender-${val}`}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          active ? "border-[#e05a6d] bg-white" : "border-[#b8bec7] bg-white"
                        }`}
                      >
                        {active ? <span className="h-2 w-2 rounded-full bg-[#e05a6d]" /> : null}
                      </span>
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="mt-4 max-w-[260px]">
              <label
                htmlFor="customer-birth-date-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
              >
                GEBURTSDATUM
              </label>
              <div className="relative mt-1.5">
                <input
                  id="customer-birth-date-input"
                  type="date"
                  name="birthDate"
                  data-testid="customer-birth-date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 pr-9 text-[13px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                />
                <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6f76]" />
              </div>
            </div>
          </section>

          {/* Section 2: Contact information */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Kontaktinformationen</h3>

            <div className="mt-3.5">
              <label
                htmlFor="customer-email-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
              >
                E-MAIL-ADRESSE
              </label>
              <input
                id="customer-email-input"
                name="email"
                type="email"
                data-testid="customer-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                className="mt-1.5 h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-phone-landline-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  TELEFONNUMMER
                </label>
                <div className="mt-1.5 flex h-10 overflow-hidden rounded-md border border-[#cfd4dc] bg-white focus-within:border-[#18202c]">
                  <span className="inline-flex shrink-0 items-center gap-1 border-r border-[#e5e7eb] bg-[#f4f5f7] px-2.5 text-[12px] font-semibold text-[#4b5057]">
                    <span aria-hidden="true">🇩🇪</span> +49
                  </span>
                  <input
                    id="customer-phone-landline-input"
                    name="phoneLandline"
                    data-testid="customer-phone-landline"
                    value={phoneLandline}
                    onChange={(e) => setPhoneLandline(e.target.value)}
                    placeholder="040 123456"
                    className="h-full min-w-0 flex-1 bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-phone-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  MOBILNUMMER
                </label>
                <div className="mt-1.5 flex h-10 overflow-hidden rounded-md border border-[#cfd4dc] bg-white focus-within:border-[#18202c]">
                  <span className="inline-flex shrink-0 items-center gap-1 border-r border-[#e5e7eb] bg-[#f4f5f7] px-2.5 text-[12px] font-semibold text-[#4b5057]">
                    <span aria-hidden="true">🇩🇪</span> +49
                  </span>
                  <input
                    id="customer-phone-input"
                    name="phone"
                    data-testid="customer-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 151 2345678"
                    className="h-full min-w-0 flex-1 bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-postal-code-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  POSTLEITZAHL
                </label>
                <input
                  id="customer-postal-code-input"
                  name="postalCode"
                  data-testid="customer-postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="22303"
                  className="mt-1.5 h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-house-number-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  HAUSNUMMER
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="customer-house-number-input"
                    name="houseNumber"
                    data-testid="customer-house-number"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="3"
                    className="h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 pr-9 text-[13.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                  />
                  <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6f76]" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-address-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  STRASSE / ADRESSE
                </label>
                <input
                  id="customer-address-input"
                  name="addressLine"
                  data-testid="customer-address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Borgweg"
                  className="mt-1.5 h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-city-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
                >
                  STADT
                </label>
                <input
                  id="customer-city-input"
                  name="city"
                  data-testid="customer-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hamburg"
                  className="mt-1.5 h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 text-[13.5px] text-[#1c1e21] outline-none focus:border-[#18202c]"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Customer labels */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Kunden-Labels</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {availableLabels.map((tag) => {
                const selected = labels.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    data-testid={`customer-label-${tag.toLowerCase()}`}
                    onClick={() => toggleLabel(tag)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
                      selected
                        ? "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"
                        : "border-[#cbd5e1] bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${selected ? "fill-[#1d4ed8]" : ""}`} />
                    {selected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
            {creatingLabel ? (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  value={newLabelText}
                  onChange={(e) => setNewLabelText(e.target.value)}
                  placeholder="Label-Name (z.B. Stammkundin)"
                  className="h-8 rounded-md border border-[#cfd4dc] bg-white px-2.5 text-[12.5px]"
                />
                <button
                  type="button"
                  onClick={addCustomLabel}
                  className="h-8 rounded-md bg-[#18202c] px-3 text-[12px] font-semibold text-white"
                >
                  Hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingLabel(false)}
                  className="h-8 rounded-md px-2 text-[12px] text-[#6a6f76]"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingLabel(true)}
                className="mt-2.5 inline-block text-[12.5px] font-semibold text-[#2563eb] hover:underline"
              >
                Neues Label erstellen
              </button>
            )}
          </section>

          {/* Section 4: Custom fields */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Benutzerdefinierte Felder</h3>
            <p className="mt-1.5 text-[12.5px] text-[#5a6068]">
              Eigene Zusatzfelder können unter{" "}
              <span className="font-medium text-[#2563eb]">
                Einstellungen &gt; Kundeneinstellungen
              </span>{" "}
              eingerichtet werden.
            </p>
          </section>

          {/* Section 5: Additional information */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Zusätzliche Informationen</h3>

            <div className="mt-3.5">
              <label
                htmlFor="customer-additional-info-input"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
              >
                ZUSÄTZLICHE KUNDENINFORMATIONEN
                <Info className="h-3.5 w-3.5 text-[#8a9099]" />
              </label>
              <textarea
                id="customer-additional-info-input"
                name="additionalInfo"
                rows={2}
                data-testid="customer-additional-info"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Farbwünsche, Allergien, Getränkepräferenz…"
                className="mt-1.5 w-full rounded-md border border-[#cfd4dc] bg-white px-3 py-2 text-[13px] text-[#1c1e21] outline-none focus:border-[#18202c]"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="customer-invoice-info-input"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
              >
                ZUSÄTZLICHE RECHNUNGSINFORMATIONEN
                <Info className="h-3.5 w-3.5 text-[#8a9099]" />
              </label>
              <textarea
                id="customer-invoice-info-input"
                name="invoiceInfo"
                rows={2}
                data-testid="customer-invoice-info"
                value={invoiceInfo}
                onChange={(e) => setInvoiceInfo(e.target.value)}
                placeholder="Hinweise für Belege (optional)…"
                className="mt-1.5 w-full rounded-md border border-[#cfd4dc] bg-white px-3 py-2 text-[13px] text-[#1c1e21] outline-none focus:border-[#18202c]"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="customer-warning-input"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5a6068]"
              >
                WARNUNG BEIM SPEICHERN VON TERMINEN
                <Info className="h-3.5 w-3.5 text-[#8a9099]" />
              </label>
              <input
                id="customer-warning-input"
                name="appointmentWarning"
                data-testid="customer-warning"
                value={appointmentWarning}
                onChange={(e) => setAppointmentWarning(e.target.value)}
                placeholder="Wird beim Anlegen eines Termins eingeblendet…"
                className="mt-1.5 h-10 w-full rounded-md border border-[#cfd4dc] bg-white px-3 text-[13px] text-[#1c1e21] outline-none focus:border-[#18202c]"
              />
            </div>
          </section>

          {/* Section 6: Profile picture */}
          <section className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]/70 p-4">
            <h3 className="text-[14px] font-bold text-[#1c1e21]">Profilbild</h3>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18202c] text-[13px] font-bold text-white">
                {customerInitials(`${firstName} ${lastName}`) || "SF"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#cfd4dc] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#5a6068]">
                <Paperclip className="h-3.5 w-3.5" />
                Initialen-Avatar aktiv (kein Bild-Upload in V1)
              </span>
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            data-testid="customer-modal-cancel"
            className="h-9 rounded-md border border-[#cfd4dc] bg-white px-4 text-[13px] font-semibold text-[#1c1e21] hover:bg-[#f4f5f7]"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="customer-create"
            className="h-9 rounded-md bg-[#18202c] px-5 text-[13px] font-semibold text-white hover:bg-[#253142] disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
