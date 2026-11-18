"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { SettingsSectionId } from "./settings-types";

type Bundle = {
  vat: { id: string; name: string; percent: number; isDefault: boolean }[];
  loyalty: { mode: "off" | "spend" | "service"; eurosPerPoint: number };
  invoice: { autoGenerate: boolean; showDate: boolean; header: string; footer: string };
  site: { title: string; subtitle: string; body: string; domain: string };
  priceWidget: { width: number; height: number; color: string };
  feedback: { prompt: string; color: string };
  gift: { amounts: number[]; buttonPosition: "left" | "right" };
};

export function WidgetsSection({
  salonId,
  section,
}: {
  salonId: string;
  section: SettingsSectionId;
}) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    void fetch(`/api/widgets?salonId=${encodeURIComponent(salonId)}`)
      .then((response) => response.json())
      .then((body: { widgets: Bundle; salonName: string; contactEmail: string }) => {
        setBundle(body.widgets);
        setSalonName(body.salonName);
        setEmail(body.contactEmail);
      });
  }, [salonId]);

  async function save(patch: Partial<Bundle>) {
    const response = await fetch("/api/widgets", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, ...patch }),
    });
    if (!response.ok) {
      setNotice("Speichern hat nicht geklappt.");
      return;
    }
    const body = (await response.json()) as { widgets: Bundle };
    setBundle(body.widgets);
    setNotice("Gespeichert. Die öffentlichen Seiten nutzen diese Werte.");
  }

  if (!bundle) return <p className="text-sm text-muted-foreground">Wird geladen…</p>;

  return (
    <div className="max-w-3xl space-y-4">
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}
      {section === "vat" ? (
        <Card title="MwSt.-Sätze" text="Der Standardsatz wird auf Belege aus dem Terminpreis gerechnet.">
          {bundle.vat.map((rate) => (
            <label key={rate.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={rate.isDefault}
                onChange={() =>
                  void save({
                    vat: bundle.vat.map((item) => ({ ...item, isDefault: item.id === rate.id })),
                  })
                }
              />
              {rate.name}
              <input
                type="number"
                value={rate.percent}
                className="w-16 rounded-md border px-2 py-1"
                onChange={(event) =>
                  setBundle({
                    ...bundle,
                    vat: bundle.vat.map((item) =>
                      item.id === rate.id ? { ...item, percent: Number(event.target.value) } : item,
                    ),
                  })
                }
              />
              %
            </label>
          ))}
          <Save onClick={() => void save({ vat: bundle.vat })} />
        </Card>
      ) : null}
      {section === "loyalty" ? (
        <Card title="Treuepunkte" text="Punkte entstehen, wenn ein Termin auf „Erledigt“ gesetzt wird. Kein Produktverkauf.">
          {(
            [
              ["off", "Keine Punkte"],
              ["spend", "1 Punkt je ausgegebenem Betrag"],
              ["service", "1 Punkt je erledigtem Termin"],
            ] as const
          ).map(([mode, label]) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={bundle.loyalty.mode === mode}
                onChange={() => setBundle({ ...bundle, loyalty: { ...bundle.loyalty, mode } })}
              />
              {label}
            </label>
          ))}
          {bundle.loyalty.mode === "spend" ? (
            <label className="text-sm">
              Euro je Punkt
              <input
                type="number"
                value={bundle.loyalty.eurosPerPoint}
                onChange={(event) =>
                  setBundle({
                    ...bundle,
                    loyalty: { ...bundle.loyalty, eurosPerPoint: Number(event.target.value) },
                  })
                }
                className="ml-2 w-20 rounded-md border px-2 py-1"
              />
            </label>
          ) : null}
          <Save onClick={() => void save({ loyalty: bundle.loyalty })} />
        </Card>
      ) : null}
      {section === "invoices" ? (
        <Card title="Rechnungen & Belege" text="Belege nutzen den gespeicherten Terminpreis und den Standard-MwSt.-Satz. Es wird nicht kassiert.">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={bundle.invoice.autoGenerate}
              onChange={(event) =>
                setBundle({ ...bundle, invoice: { ...bundle.invoice, autoGenerate: event.target.checked } })
              }
            />
            Beleg aus bestätigten Terminen vorbereiten
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={bundle.invoice.showDate}
              onChange={(event) =>
                setBundle({ ...bundle, invoice: { ...bundle.invoice, showDate: event.target.checked } })
              }
            />
            Datum auf dem Beleg zeigen
          </label>
          <input
            value={bundle.invoice.header}
            placeholder={salonName || "Kopfzeile"}
            onChange={(event) => setBundle({ ...bundle, invoice: { ...bundle.invoice, header: event.target.value } })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={bundle.invoice.footer}
            onChange={(event) => setBundle({ ...bundle, invoice: { ...bundle.invoice, footer: event.target.value } })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
          />
          <Save onClick={() => void save({ invoice: bundle.invoice })} />
        </Card>
      ) : null}
      {section === "microsite" ? (
        <Card title="Mikroseite" text="Öffentliche Seite mit Ihren Texten. Die Adresse können Sie kopieren.">
          <p className="break-all rounded-md bg-secondary px-3 py-2 text-xs">{origin}/widget/seite/{salonId}</p>
          <Copy text={`${origin}/widget/seite/${salonId}`} />
          <input value={bundle.site.domain} placeholder="Eigene Domain, nur als Hinweis" onChange={(event) => setBundle({ ...bundle, site: { ...bundle.site, domain: event.target.value } })} className="w-full rounded-md border px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">Kontakt: {email || "keine E-Mail hinterlegt"}</p>
          <input value={bundle.site.title} placeholder="Überschrift" onChange={(event) => setBundle({ ...bundle, site: { ...bundle.site, title: event.target.value } })} className="w-full rounded-md border px-3 py-2 text-sm" />
          <input value={bundle.site.subtitle} placeholder="Untertitel" onChange={(event) => setBundle({ ...bundle, site: { ...bundle.site, subtitle: event.target.value } })} className="w-full rounded-md border px-3 py-2 text-sm" />
          <textarea value={bundle.site.body} placeholder="Text" onChange={(event) => setBundle({ ...bundle, site: { ...bundle.site, body: event.target.value } })} className="w-full rounded-md border px-3 py-2 text-sm" rows={4} />
          <Save onClick={() => void save({ site: bundle.site })} />
        </Card>
      ) : null}
      {section === "pricing-widget" ? (
        <Card title="Preislisten-Widget" text="Zeigt Namen, Dauer und Preis aus den aktiven Leistungen.">
          <div className="flex gap-2">
            <Num label="Breite" value={bundle.priceWidget.width} onChange={(width) => setBundle({ ...bundle, priceWidget: { ...bundle.priceWidget, width } })} />
            <Num label="Höhe" value={bundle.priceWidget.height} onChange={(height) => setBundle({ ...bundle, priceWidget: { ...bundle.priceWidget, height } })} />
            <input type="color" value={bundle.priceWidget.color} onChange={(event) => setBundle({ ...bundle, priceWidget: { ...bundle.priceWidget, color: event.target.value } })} />
          </div>
          <pre className="overflow-auto rounded-md bg-secondary p-2 text-[11px]">{`<iframe src="${origin}/widget/preise/${salonId}" style="width:${bundle.priceWidget.width}px;height:${bundle.priceWidget.height}px;border:0"></iframe>`}</pre>
          <Copy text={`<iframe src="${origin}/widget/preise/${salonId}" style="width:${bundle.priceWidget.width}px;height:${bundle.priceWidget.height}px;border:0"></iframe>`} />
          <iframe title="Preisvorschau" src={`${origin}/widget/preise/${salonId}`} className="w-full rounded-xl border" style={{ height: 280 }} />
          <Save onClick={() => void save({ priceWidget: bundle.priceWidget })} />
        </Card>
      ) : null}
      {section === "feedback-widget" ? (
        <Card title="Bewertungs-Widget" text="Kundinnen geben 1 bis 5 Sterne. Die Bewertung wird nur für diesen Salon gespeichert.">
          <input value={bundle.feedback.prompt} onChange={(event) => setBundle({ ...bundle, feedback: { ...bundle.feedback, prompt: event.target.value } })} className="w-full rounded-md border px-3 py-2 text-sm" />
          <pre className="overflow-auto rounded-md bg-secondary p-2 text-[11px]">{`${origin}/widget/feedback/${salonId}`}</pre>
          <Copy text={`${origin}/widget/feedback/${salonId}`} />
          <Save onClick={() => void save({ feedback: bundle.feedback })} />
        </Card>
      ) : null}
      {section === "giftcard" ? (
        <Card title="Gutschein-Widget" text="Es wird kein Betrag eingezogen. Der Wunsch landet als offene Anfrage im Salon.">
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">Kein Zahlungsanbieter verbunden. Der Gutschein wird nicht automatisch bezahlt oder verschickt.</p>
          <pre className="overflow-auto rounded-md bg-secondary p-2 text-[11px]">{`${origin}/widget/gutschein/${salonId}`}</pre>
          <Copy text={`${origin}/widget/gutschein/${salonId}`} />
          <Save onClick={() => void save({ gift: bundle.gift })} />
        </Card>
      ) : null}
    </div>
  );
}

function Card({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
    </section>
  );
}

function Save({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
      Speichern
    </button>
  );
}

function Copy({ text }: { text: string }) {
  return (
    <button type="button" onClick={() => void navigator.clipboard.writeText(text)} className="rounded-full border px-3 py-1 text-xs font-semibold">
      Kopieren
    </button>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 block w-24 rounded-md border px-2 py-1 text-sm" />
    </label>
  );
}
