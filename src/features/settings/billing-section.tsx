"use client";

import { useCallback, useEffect, useState } from "react";

type Invoice = {
  id: string;
  number: string;
  periodStart: string;
  dueOn: string;
  totalCents: number;
  status: "open" | "paid" | "overdue";
};

type BillingView = {
  planName: string;
  planCents: number;
  activeSeats: number;
  extraSeats: number;
  employeeCents: number;
  totalCents: number;
  autopayEnabled: boolean;
  openInvoices: Invoice[];
  paidInvoices: Invoice[];
};

const FAQ = [
  ["Warum ist die Rechnung höher als sonst?", "Die Mitarbeiterzeile hängt von den aktiven Mitarbeiterinnen ab. Zwei Plätze sind im Studio-Tarif enthalten, jeder weitere Platz kostet 5,00 € im Monat."],
  ["Was bedeutet „fällig“?", "Das Datum, bis zu dem die Rechnung als offen gilt. Danach steht sie als überfällig, bis Sie die Zahlung vermerken."],
  ["Kann ich den Tarif wechseln?", "In dieser Version gibt es den Studio-Tarif. Ein anderer Tarif wird nicht berechnet."],
  ["Kann ich pausieren?", "Eine Pause gibt es hier nicht. Die laufende Monatsrechnung bleibt sichtbar."],
  ["Zahle ich für Kabinen oder Geräte?", "Nein. Nur der Tarif und zusätzliche Mitarbeiterplätze."],
  ["Ich habe überwiesen. Warum ist die Rechnung noch offen?", "Es ist kein Zahlungsdienst verbunden. Die Rechnung wird offen angezeigt, bis Sie „Zahlung vermerken“ wählen. Es wird nichts von einer Karte abgebucht."],
  ["Gibt es Lastschrift?", "Automatisch merken speichert nur Ihren Wunsch. Ohne Zahlungsanbieter wird nichts eingezogen."],
];

function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function BillingSection({ salonId, salonName }: { salonId: string; salonName: string }) {
  const [data, setData] = useState<BillingView | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaid, setShowPaid] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch(`/api/billing?salonId=${encodeURIComponent(salonId)}`);
    if (!response.ok) {
      setError("Abrechnung konnte nicht geladen werden.");
      return;
    }
    setData((await response.json()) as BillingView);
  }, [salonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, ...body }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Das hat nicht geklappt.");
      return;
    }
    setData((await response.json()) as BillingView);
  }

  function download(invoice: Invoice) {
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${invoice.number}</title>
      <style>body{font-family:Georgia,serif;margin:48px;color:#2b2430}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:8px 0;border-bottom:1px solid #e4d5cb}</style>
      </head><body><h1>SalonFlow</h1><p>Rechnung ${invoice.number}<br>Salon: ${salonName}<br>Zeitraum ab ${invoice.periodStart}<br>Fällig ${invoice.dueOn}</p>
      <p>Bitte überweisen Sie den Betrag mit dem Verwendungszweck <strong>${invoice.number}</strong>. Es wird keine Karte belastet.</p>
      <table><tr><td>Studio-Tarif</td><td align="right">${euro(data?.planCents ?? 0)}</td></tr>
      <tr><td>Zusätzliche Mitarbeiterplätze</td><td align="right">${euro(invoice.totalCents - (data?.planCents ?? 0))}</td></tr>
      <tr><td><strong>Gesamt</strong></td><td align="right"><strong>${euro(invoice.totalCents)}</strong></td></tr></table>
      <p>Status: ${invoice.status === "paid" ? "Bezahlt" : invoice.status === "overdue" ? "Überfällig" : "Offen"}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  }

  if (!data) return <p className="text-sm text-muted-foreground">Abrechnung wird geladen…</p>;

  return (
    <div data-testid="settings-section-billing" className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Abrechnung</h2>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <section className="rounded-3xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Ihre Mitgliedschaft</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Studio-Tarif</span><span>{euro(data.planCents)}</span></div>
            <div className="flex justify-between text-muted-foreground">
              <span>Mitarbeiterinnen ({data.activeSeats} aktiv, {data.extraSeats} zusätzlich)</span>
              <span>{euro(data.employeeCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Gesamt</span><span>{euro(data.totalCents)} / Monat</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-xs">
            <span>Automatische Zahlung merken. Es wird nichts abgebucht.</span>
            <button
              type="button"
              onClick={() => void act({ action: "autopay", enabled: !data.autopayEnabled })}
              className="font-semibold text-primary"
            >
              {data.autopayEnabled ? "Gemerkt" : "Merken"}
            </button>
          </div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Häufige Fragen</h3>
          <div className="mt-2 divide-y divide-border">
            {FAQ.map(([question, answer], index) => (
              <button key={question} type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full py-2 text-left text-sm">
                <span className="font-medium">{question}</span>
                {openFaq === index ? <span className="mt-1 block text-xs text-muted-foreground">{answer}</span> : null}
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="space-y-4">
        <section className="rounded-3xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Offene Rechnungen</h3>
          <p className="mt-1 text-xs text-muted-foreground">Offen halten, damit der Zugang nicht als gesperrt gilt.</p>
          <div className="mt-3 space-y-2">
            {data.openInvoices.length === 0 ? <p className="text-sm text-muted-foreground">Keine offene Rechnung.</p> : null}
            {data.openInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {invoice.dueOn} · {euro(invoice.totalCents)}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${invoice.status === "overdue" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                    {invoice.status === "overdue" ? "Überfällig" : "Offen"}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{invoice.number}</span>
                </span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => void act({ action: "pay", invoiceId: invoice.id })} className="rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">Zahlung vermerken</button>
                  <button type="button" onClick={() => download(invoice)} className="rounded-full border border-border px-2 py-1 text-[11px]">PDF</button>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Bezahlte Rechnungen</h3>
            <button type="button" onClick={() => setShowPaid((value) => !value)} className="text-[11px] font-semibold text-primary">
              {showPaid ? "Ausblenden" : "Alle anzeigen"}
            </button>
          </div>
          {showPaid ? (
            <div className="mt-3 space-y-2 text-sm">
              {data.paidInvoices.length === 0 ? <p className="text-muted-foreground">Noch keine bezahlte Rechnung.</p> : null}
              {data.paidInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <span>{invoice.dueOn} · {euro(invoice.totalCents)} <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Bezahlt</span></span>
                  <button type="button" onClick={() => download(invoice)} className="text-[11px] font-semibold">PDF</button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
