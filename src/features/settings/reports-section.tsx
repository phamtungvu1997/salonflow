"use client";

import { useEffect, useState, type ReactNode } from "react";

type Row = { label: string; count: number; cents: number };
type Preset = "today" | "week" | "month" | "year";
type Tab = "overview" | "days" | "months" | "services" | "staff" | "vat";

type Report = {
  from: string;
  to: string;
  vatPercent: number;
  appointments: number;
  newCustomers: number;
  grossCents: number;
  netCents: number;
  vatCents: number;
  giftRequestCents: number;
  days: Row[];
  months: Row[];
  services: Row[];
  staff: Row[];
};

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Heute" },
  { id: "week", label: "Diese Woche" },
  { id: "month", label: "Dieser Monat" },
  { id: "year", label: "Dieses Jahr" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Summen" },
  { id: "days", label: "Tage" },
  { id: "months", label: "Monate" },
  { id: "services", label: "Leistungen" },
  { id: "staff", label: "Mitarbeiter" },
  { id: "vat", label: "MwSt." },
];

function euro(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function germanDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return day ? `${day}.${month}.${year}` : iso;
}

export function ReportsSection({ salonId }: { salonId: string }) {
  const [preset, setPreset] = useState<Preset>("month");
  const [tab, setTab] = useState<Tab>("overview");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    void fetch(`/api/reports?salonId=${encodeURIComponent(salonId)}&preset=${preset}`)
      .then(async (response) => {
        const body = (await response.json()) as Report & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Der Bericht konnte nicht geladen werden.");
        if (active) setReport(body);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Der Bericht konnte nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, [salonId, preset]);

  return (
    <div className="reports-sheet space-y-4" data-testid="settings-section-reports">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">Berichte</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {report ? `${germanDate(report.from)} – ${germanDate(report.to)}` : "Zeitraum"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Zeitraum
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value as Preset)}
              className="mt-1 block h-9 rounded-md border border-input bg-card px-2 text-sm normal-case tracking-normal text-foreground"
              data-testid="reports-period"
            >
              {PRESETS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
          >
            Drucken
          </button>
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-3 border-b border-border text-sm">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? "border-b-2 border-foreground pb-2 font-medium" : "pb-2 text-muted-foreground"}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!report ? <p className="text-sm text-muted-foreground">Bericht wird geladen…</p> : null}

      {report && tab === "overview" ? <Overview report={report} /> : null}
      {report && tab === "days" ? <Table title="Tage" rows={report.days} dateLabels /> : null}
      {report && tab === "months" ? <Table title="Monate" rows={report.months} /> : null}
      {report && tab === "services" ? <Table title="Leistungen" rows={report.services} /> : null}
      {report && tab === "staff" ? <Table title="Mitarbeiter" rows={report.staff} /> : null}
      {report && tab === "vat" ? <VatPanel report={report} /> : null}
    </div>
  );
}

function Overview({ report }: { report: Report }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Umsatz brutto" value={euro(report.grossCents)} />
        <Kpi label="Termine" value={String(report.appointments)} />
        <Kpi label="Neue Kunden" value={String(report.newCustomers)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Summen">
          <Line label="Umsatz netto" value={euro(report.netCents)} />
          <Line label={`MwSt. ${report.vatPercent} %`} value={euro(report.vatCents)} />
          <Line label="Umsatz brutto, Leistungen" value={euro(report.grossCents)} />
          <Line label="Produkte" value={euro(0)} />
          <Line label="Gutschein-Anfragen, nicht bezahlt" value={euro(report.giftRequestCents)} />
        </Card>
        <Card title="Zahlung">
          <p className="px-3 py-3 text-sm text-muted-foreground">
            SalonFlow erfasst keine Kasse. Karte, Bar und Bank werden nicht aufgeteilt. Der Leistungspreis gilt als im Salon offen, bis er dort bezahlt wird.
          </p>
          <Line label="Offen im Salon" value={euro(report.grossCents)} />
        </Card>
      </div>
    </div>
  );
}

function VatPanel({ report }: { report: Report }) {
  return (
    <Card title="MwSt.-Übersicht">
      <div className="grid grid-cols-4 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Satz</span><span>Netto</span><span>MwSt.</span><span className="text-right">Brutto</span>
      </div>
      <div className="grid grid-cols-4 px-3 py-2 text-sm">
        <span>{report.vatPercent} %</span>
        <span>{euro(report.netCents)}</span>
        <span>{euro(report.vatCents)}</span>
        <span className="text-right">{euro(report.grossCents)}</span>
      </div>
      <p className="px-3 py-3 text-sm text-muted-foreground">
        Der Standardsatz aus den MwSt.-Einstellungen gilt auf den gespeicherten Leistungspreis. Der Preis ist der Betrag, den die Kundin zahlt.
      </p>
    </Card>
  );
}

function Table({ title, rows, dateLabels = false }: { title: string; rows: Row[]; dateLabels?: boolean }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <p className="px-3 py-4 text-sm text-muted-foreground">In diesem Zeitraum gibt es keine Termine.</p> : null}
      {rows.map((row) => (
        <Line key={row.label} label={`${dateLabels ? germanDate(row.label) : row.label} · ${row.count}`} value={euro(row.cents)} />
      ))}
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-medium">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <h3 className="border-b border-border px-3 py-3 text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
      <span>{label}</span>
      <span className="shrink-0 font-medium">{value}</span>
    </div>
  );
}
