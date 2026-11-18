"use client";

import { CalendarDays, Clock, Printer, Settings, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Menu = "shortcuts" | "pricing" | null;

export function CalendarTitleTools({ salonId }: { salonId: string | null }) {
  const [menu, setMenu] = useState<Menu>(null);
  const [dynamicOn, setDynamicOn] = useState(false);
  const [pending, setPending] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!salonId || !menu) return;
    let active = true;
    void Promise.all([
      fetch(`/api/marketing?salonId=${encodeURIComponent(salonId)}`).then((response) => response.json()),
      fetch(`/api/online-booking/requests?salonId=${encodeURIComponent(salonId)}`).then((response) => response.json()),
    ])
      .then(([marketing, requests]) => {
        if (!active) return;
        setDynamicOn(Boolean(marketing?.marketingSettings?.dynamicPricingEnabled));
        const rows = (requests?.requests ?? []) as { status?: string }[];
        setPending(rows.filter((row) => row.status === "pending").length);
      })
      .catch(() => {
        if (active) setError("Die Kalenderwerkzeuge konnten nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, [salonId, menu]);

  useEffect(() => {
    if (!menu) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [menu]);

  async function toggleDynamic(next: boolean) {
    if (!salonId) return;
    setSaving(true);
    setError(null);
    const response = await fetch("/api/marketing", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, dynamicPricingEnabled: next }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      marketingSettings?: { dynamicPricingEnabled?: boolean };
    };
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Die dynamische Preisregel konnte nicht gespeichert werden.");
      return;
    }
    setDynamicOn(Boolean(body.marketingSettings?.dynamicPricingEnabled));
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-1">
      <button
        type="button"
        aria-label="Kalender-Menü"
        aria-expanded={menu === "shortcuts"}
        onClick={() => setMenu((current) => (current === "shortcuts" ? null : "shortcuts"))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
        data-testid="calendar-shortcuts"
      >
        <Settings className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Dynamische Preise"
        aria-pressed={dynamicOn}
        onClick={() => setMenu((current) => (current === "pricing" ? null : "pricing"))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
        data-testid="calendar-dynamic-pricing"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>

      {menu === "shortcuts" ? (
        <div className="absolute left-0 top-8 z-30 w-64 rounded-xl border border-border bg-card p-1 shadow-panel">
          <MenuLink href="/einstellungen?section=calendar" icon={Settings} label="Kalendereinstellungen" />
          <MenuLink href="/einstellungen?section=timetable" icon={Clock} label="Arbeitszeiten" />
          <MenuLink href="/einstellungen?section=services" icon={Sparkles} label="Leistungen" />
          <MenuLink href="/einstellungen?section=online-bookings" icon={CalendarDays} label="Online-Buchungen" />
          <MenuLink
            href="/einstellungen?section=online-bookings"
            icon={CalendarDays}
            label={pending > 0 ? `Buchungsanfragen (${pending})` : "Buchungsanfragen"}
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Kalender drucken
          </button>
        </div>
      ) : null}

      {menu === "pricing" ? (
        <div className="absolute left-8 top-8 z-30 w-72 rounded-xl border border-border bg-card p-3 shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Dynamische Preise</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Liegt ein Termin in einem Preiszeitfenster, gilt dieser Preis für neue Online-Buchungen. Bestehende Termine bleiben unverändert.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dynamicOn}
              disabled={!salonId || saving}
              onClick={() => void toggleDynamic(!dynamicOn)}
              className={`relative h-5 w-9 shrink-0 rounded-full ${dynamicOn ? "bg-primary" : "bg-muted"}`}
              data-testid="dynamic-pricing-switch"
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow ${dynamicOn ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
          <Link href="/marketing" className="mt-3 inline-block text-xs font-medium">
            Zeitfenster im Marketing bearbeiten
          </Link>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Settings;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
