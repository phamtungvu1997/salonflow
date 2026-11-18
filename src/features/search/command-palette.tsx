"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSalon } from "@/features/salons/salon-context";

type Hit = { id: string; kind: "customer" | "appointment" | "service"; title: string; detail: string; href: string };
type PageHit = { id: string; title: string; detail: string; href: string };

const PAGES: PageHit[] = [
  { id: "kalender", title: "Kalender", detail: "Tages- und Wochenansicht", href: "/kalender" },
  { id: "kunden", title: "Kunden", detail: "Kundenliste", href: "/kunden" },
  { id: "marketing", title: "Marketing", detail: "Rabatte und Warteliste", href: "/marketing" },
  { id: "online", title: "Online", detail: "Buchungslink und Webseite", href: "/online" },
  { id: "settings", title: "Einstellungen", detail: "Salon und Kalender", href: "/einstellungen" },
  { id: "reports", title: "Einstellungen › Berichte", detail: "Umsatz, Termine, MwSt.", href: "/einstellungen?section=reports" },
  { id: "online-bookings", title: "Einstellungen › Online-Buchungen", detail: "Link, Regeln, Widget", href: "/einstellungen?section=online-bookings" },
  { id: "services", title: "Einstellungen › Leistungen", detail: "Katalog und Preise", href: "/einstellungen?section=services" },
  { id: "employees", title: "Einstellungen › Mitarbeiter", detail: "Team", href: "/einstellungen?section=employees" },
  { id: "absences", title: "Einstellungen › Abwesenheiten", detail: "Feiertage und Sperren", href: "/einstellungen?section=absences" },
  { id: "timetable", title: "Einstellungen › Arbeitszeiten", detail: "Schichten", href: "/einstellungen?section=timetable" },
  { id: "billing", title: "Einstellungen › Abrechnung", detail: "SalonFlow-Tarif", href: "/einstellungen?section=billing" },
  { id: "vat", title: "Einstellungen › MwSt.", detail: "Steuersätze", href: "/einstellungen?section=vat" },
  { id: "dialog", title: "Kundendialog", detail: "Nachrichten und Freigaben", href: "/ki-rezeption" },
  { id: "support", title: "Support", detail: "Hilfe und Wünsche", href: "/support" },
];

const KIND_LABEL = { customer: "Kunden", appointment: "Termine", service: "Leistungen" } as const;

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { activeSalon } = useSalon();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de");
    const list = needle
      ? PAGES.filter((page) => `${page.title} ${page.detail}`.toLocaleLowerCase("de").includes(needle))
      : PAGES.slice(0, 6);
    return list;
  }, [query]);

  const rows = useMemo(
    () => [
      ...pages.map((page) => ({ ...page, group: query.trim() ? "Seiten" : "Direkt zu" })),
      ...hits.map((hit) => ({ ...hit, group: KIND_LABEL[hit.kind] })),
    ],
    [pages, hits, query],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHits([]);
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !activeSalon || query.trim().length < 1) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/search?salonId=${encodeURIComponent(activeSalon.id)}&q=${encodeURIComponent(query.trim())}`)
        .then((response) => (response.ok ? response.json() : { hits: [] }))
        .then((body: { hits?: Hit[] }) => setHits(body.hits ?? []))
        .catch(() => setHits([]));
    }, 120);
    return () => window.clearTimeout(handle);
  }, [open, query, activeSalon]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label="Suche"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && rows[active]) {
              event.preventDefault();
              go(rows[active].href);
            }
          }}
          placeholder="Kunden, Seiten und Einstellungen suchen"
          className="h-12 w-full border-b border-border bg-card px-4 text-sm outline-none"
          data-testid="command-search"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {rows.length === 0 ? <p className="px-3 py-6 text-sm text-muted-foreground">Nichts gefunden.</p> : null}
          {rows.map((row, index) => {
            const showGroup = index === 0 || rows[index - 1]?.group !== row.group;
            return (
              <div key={row.id}>
                {showGroup ? (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{row.group}</p>
                ) : null}
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(row.href)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${index === active ? "bg-muted" : ""}`}
                >
                  <span>
                    <span className="block font-medium">{row.title}</span>
                    <span className="block text-xs text-muted-foreground">{row.detail}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Strg+K öffnet die Suche. Esc schließt sie.
        </p>
      </div>
    </div>
  );
}
