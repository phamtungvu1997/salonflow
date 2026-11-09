"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { api } from "@/features/booking/api";

export type InlineCustomerEditData = {
  id: string;
  salonId: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function EditCustomerInlineModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: InlineCustomerEditData;
  onClose: () => void;
  onSaved: (updated: {
    displayName: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  }) => void;
}) {
  const nameParts = customer.displayName.trim().split(/\s+/);
  const defaultFirst = customer.firstName || nameParts[0] || "";
  const defaultLast = customer.lastName || nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(defaultFirst);
  const [lastName, setLastName] = useState(defaultLast);
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(
    (customer.phone ?? "").replace(/^\+49\s*/, ""),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst && !trimmedLast) {
      setError("Vorname oder Nachname ist erforderlich.");
      return;
    }

    setSaving(true);
    setError(null);
    const fullPhone = phone.trim()
      ? phone.trim().startsWith("+")
        ? phone.trim()
        : `+49 ${phone.trim()}`
      : null;
    const displayName = [trimmedFirst, trimmedLast].filter(Boolean).join(" ").trim();

    try {
      if (customer.id) {
        await api(`/api/customers/${customer.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            salonId: customer.salonId,
            displayName,
            firstName: trimmedFirst,
            lastName: trimmedLast,
            email: email.trim() || null,
            phone: fullPhone,
          }),
        });
      }
      onSaved({
        displayName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: email.trim() || null,
        phone: fullPhone,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kundin konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1c1e21]/45 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
      role="presentation"
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Kundin bearbeiten"
        data-testid="appointment-customer-edit-modal"
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-[min(560px,94vw)] overflow-hidden rounded-[12px] border border-[#e2e5ea] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.34)]"
      >
        <header className="flex h-[56px] items-center justify-between border-b border-[#eef0f3] px-6">
          <h3 className="text-[16px] font-bold text-[#1c1e21]">Kundin bearbeiten</h3>
          <button
            type="button"
            aria-label="Kundendialog schließen"
            data-testid="appointment-customer-edit-close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#f4f5f7] hover:text-[#1c1e21]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 p-6">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#b42318]"
            >
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#6d7480]">
                Vorname *
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="inline-customer-first-name"
                autoFocus
                placeholder="Vorname"
                className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white px-3 text-sm text-[#1c1e21] focus:border-[#111827] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#6d7480]">
                Nachname *
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="inline-customer-last-name"
                placeholder="Nachname"
                className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white px-3 text-sm text-[#1c1e21] focus:border-[#111827] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#6d7480]">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="inline-customer-email"
              placeholder="kundin@beispiel.de"
              className="h-10 w-full rounded-lg border border-[#d9dde3] bg-white px-3 text-sm text-[#1c1e21] focus:border-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#6d7480]">
              Mobiltelefonnummer
            </label>
            <div className="flex h-10 overflow-hidden rounded-lg border border-[#d9dde3] bg-white focus-within:border-[#111827]">
              <span className="inline-flex shrink-0 items-center gap-1 border-r border-[#e5e7eb] bg-[#f7f8fa] px-3 text-xs font-semibold text-[#4b5057]">
                <span aria-hidden>🇩🇪</span> +49
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="inline-customer-phone"
                placeholder="177 6662220"
                className="h-full min-w-0 flex-1 bg-white px-3 text-sm text-[#1c1e21] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2.5 border-t border-[#eef0f3] bg-[#fafbfc] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            data-testid="inline-customer-cancel"
            className="h-9 rounded-lg border border-[#d9dde3] bg-white px-4 text-xs font-semibold text-[#1c1e21] hover:bg-[#f4f5f7]"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="inline-customer-save"
            className="h-9 rounded-lg bg-[#111827] px-5 text-xs font-semibold text-white hover:bg-[#1f2937] disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </footer>
      </form>
    </div>
  );
}
