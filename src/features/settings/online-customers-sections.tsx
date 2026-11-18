"use client";

import { useState } from "react";

import type { SalonSettingsRecord } from "./settings-types";

export { OnlineBookingsSection } from "./online-bookings-section";

export function CustomerSettingsSection({
  settings,
  onSave,
}: {
  settings: SalonSettingsRecord;
  onSave: (patch: Partial<SalonSettingsRecord>) => Promise<void>;
}) {
  const [labels, setLabels] = useState<string[]>(
    settings.customerLabels?.length ? settings.customerLabels : ["Favorit", "Stammkundin"],
  );
  const [customFields, setCustomFields] = useState<string[]>(
    settings.customFields?.length ? settings.customFields : ["Bevorzugte Nagelform"],
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSave({
        customerLabels: labels.map((l) => l.trim()).filter(Boolean),
        customFields: customFields.map((f) => f.trim()).filter(Boolean),
      });
      setSavedNotice("Kundeneinstellungen wurden gespeichert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="settings-section-customer-settings" className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kundeneinstellungen</h2>
          <p className="text-xs text-slate-500">
            Kunden-Labels zur Segmentierung sowie benutzerdefinierte Profilfelder verwalten.
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-settings-save"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[#18202c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>

      {savedNotice ? (
        <div
          data-testid="customer-settings-saved-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900"
        >
          {savedNotice}
        </div>
      ) : null}

      {/* Card 1: Customer Labels matching video 02:90 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Kunden-Labels</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Verwenden Sie bis zu 5 Labels (z. B. „Favorit“), um Kundinnen in der Kundenkartei zu markieren.
          </p>
        </div>
        <div className="space-y-2.5">
          {labels.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                data-testid={`customer-label-input-${idx}`}
                value={label}
                onChange={(event) =>
                  setLabels((prev) =>
                    prev.map((item, i) => (i === idx ? event.target.value : item)),
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
              />
            </div>
          ))}
        </div>
        {labels.length < 5 ? (
          <button
            type="button"
            data-testid="customer-add-label-btn"
            onClick={() => setLabels((prev) => [...prev, ""])}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            + Neues Label erstellen
          </button>
        ) : null}
      </div>

      {/* Card 2: Custom Fields matching video 02:90 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Zusätzliche benutzerdefinierte Felder im Kundenprofil
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Fügen Sie eigene Felder wie „Bevorzugte Nagelform“ oder „Allergiehinweis“ hinzu.
          </p>
        </div>
        <div className="space-y-2.5">
          {customFields.map((field, idx) => (
            <input
              key={idx}
              type="text"
              value={field}
              onChange={(event) =>
                setCustomFields((prev) =>
                  prev.map((item, i) => (i === idx ? event.target.value : item)),
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900"
            />
          ))}
        </div>
        {customFields.length < 5 ? (
          <button
            type="button"
            onClick={() => setCustomFields((prev) => [...prev, ""])}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            + Benutzerdefiniertes Feld hinzufügen
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DeferredV1Section({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div
      data-testid="settings-section-deferred-v1"
      className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50/70 p-6 space-y-3"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">
        <span>V1-Architektur-Abgrenzung (Master Architecture V2)</span>
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-xs leading-relaxed text-slate-700">{reason}</p>
      <p className="text-[11px] text-slate-500">
        Gemäß AGENTS.md („No POS, online payments, invoices, inventory or payroll in V1“) ist dieser Bereich in V1 bewusst zurückgestellt und täuscht keine Schein-Speicherung vor.
      </p>
    </div>
  );
}
