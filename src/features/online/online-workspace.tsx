"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSalon } from "@/features/salons/salon-context";

type Review = { id: string; rating: number; comment: string; createdAt: string };

type Desk = {
  salonName: string;
  bookingPath: string;
  sitePath: string;
  description: string;
  googleRequested: boolean;
  instagram: string;
  facebook: string;
  phone: string;
  email: string;
  address: string;
  serviceCount: number;
  onlineBookingCount: number;
  siteTitle: string;
  siteSubtitle: string;
  siteBody: string;
  siteDomain: string;
  reviews: Review[];
};

type Tab = "marktplatz" | "widget" | "website" | "google";
type Market = "overview" | "profile" | "reviews";

const TABS: { id: Tab; label: string }[] = [
  { id: "marktplatz", label: "Marktplatz" },
  { id: "widget", label: "Buchungs-Widget" },
  { id: "website", label: "Webseite" },
  { id: "google", label: "Über Google buchen" },
];

export function OnlineWorkspace() {
  const { activeSalon } = useSalon();
  const salonId = activeSalon?.id ?? null;
  const [desk, setDesk] = useState<Desk | null>(null);
  const [tab, setTab] = useState<Tab>("marktplatz");
  const [market, setMarket] = useState<Market>("overview");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!salonId) return;
    let active = true;
    void fetch(`/api/online?salonId=${encodeURIComponent(salonId)}`)
      .then(async (response) => {
        const body = (await response.json()) as Desk & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Online konnte nicht geladen werden.");
        if (active) setDesk(body);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Online konnte nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, [salonId]);

  async function save(payload: Record<string, unknown>) {
    if (!salonId) return;
    setError(null);
    setNotice(null);
    const response = await fetch("/api/online", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId, ...payload }),
    });
    const body = (await response.json()) as Desk & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Speichern ist fehlgeschlagen.");
      return;
    }
    setDesk(body);
    setNotice("Gespeichert.");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bookingUrl = desk ? `${origin}${desk.bookingPath}` : "";
  const siteUrl = desk ? `${origin}${desk.sitePath}` : "";
  const companyReady = Boolean(desk && desk.phone && desk.email && desk.address);
  const servicesReady = (desk?.serviceCount ?? 0) > 0;

  return (
    <div className="min-h-full" data-testid="page-online">
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-medium">Online</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={tab === item.id ? "border-b-2 border-foreground pb-1 font-medium" : "pb-1 text-muted-foreground"}
              data-testid={`online-tab-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6">
        {!desk ? <p className="text-sm text-muted-foreground">Wird geladen…</p> : null}
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="mb-3 text-sm text-foreground">{notice}</p> : null}

        {desk && tab === "marktplatz" ? (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav className="h-fit rounded-xl border border-border bg-card p-2">
              {(
                [
                  ["overview", "Übersicht"],
                  ["profile", "Profil"],
                  ["reviews", "Bewertungen"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMarket(id)}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm ${market === id ? "bg-muted font-medium" : ""}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="space-y-4">
              {market === "overview" ? (
                <>
                  <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="font-medium">Eigene Buchungsseite</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {desk.onlineBookingCount} Termine kamen bisher über den eigenen Link. Treatwell ist nicht verbunden.
                    </p>
                    <p className="mt-3 inline-flex rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                      {companyReady && servicesReady ? "Bereit" : "In Arbeit"}
                    </p>
                  </section>
                  <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="font-medium">Einrichtung</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      <Check done label="Buchungslink vorhanden" />
                      <Check done={servicesReady} label={`${desk.serviceCount} aktive Leistungen`} />
                      <Check done={companyReady} label="Firma, Telefon und E-Mail sind hinterlegt" />
                      <Check done={false} label="Marktplatz-Vertrag — nicht verbunden" />
                      <Check done={false} label="Bankverbindung — kein Zahlungsanbieter" />
                      <Check done={false} label="Identitätsprüfung — nicht verbunden" />
                    </ul>
                    <Link href="/einstellungen" className="mt-4 inline-block text-sm font-medium">
                      Firmendaten in den Einstellungen
                    </Link>
                  </section>
                </>
              ) : null}
              {market === "profile" ? (
                <ProfileForm key={salonId ?? "profile"} desk={desk} onSave={(fields) => void save({ action: "profile", ...fields })} />
              ) : null}
              {market === "reviews" ? (
                <section className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-medium">Bewertungen</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Diese Stimmen kommen aus dem Bewertungs-Widget dieses Salons.
                  </p>
                  {desk.reviews.length === 0 ? (
                    <p className="mt-4 text-sm">Noch keine Bewertung.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {desk.reviews.map((review) => (
                        <li key={review.id} className="border-t border-border pt-3 text-sm">
                          <div className="font-medium">{review.rating} von 5</div>
                          <p>{review.comment || "Ohne Kommentar."}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}
            </div>
          </div>
        ) : null}

        {desk && tab === "widget" ? (
          <section className="max-w-3xl space-y-4">
            <div>
              <h2 className="font-medium">Buchungen in Sekunden annehmen</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Das ist der Buchungslink von {desk.salonName}. Teilen Sie ihn auf WhatsApp, Instagram oder per E-Mail.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buchungslink</div>
              <div className="mt-2 break-all text-sm" data-testid="online-booking-url">{bookingUrl}</div>
              <button
                type="button"
                className="mt-3 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                onClick={() => {
                  void navigator.clipboard.writeText(bookingUrl).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? "Kopiert" : "Kopieren"}
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">QR-Code</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Für Schaufenster, Tresen oder Preisliste. Der Scan öffnet dieselbe Buchungsseite.
              </p>
              {/* QR is generated by our API as SVG; next/image does not optimize that response. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR-Code zur Buchungsseite"
                src={`/api/online/qr?salonId=${encodeURIComponent(salonId ?? "")}`}
                className="mt-4 h-48 w-48 bg-card"
              />
              <a
                className="mt-3 inline-block text-sm font-medium"
                href={`/api/online/qr?salonId=${encodeURIComponent(salonId ?? "")}`}
                download="buchung.svg"
              >
                QR-Code herunterladen
              </a>
            </div>
            <Link href="/einstellungen" className="text-sm font-medium">
              Weitere Optionen unter Einstellungen, Online-Buchungen
            </Link>
          </section>
        ) : null}

        {desk && tab === "website" ? (
          <WebsiteForm
            key={salonId ?? "site"}
            desk={desk}
            siteUrl={siteUrl}
            bookingUrl={bookingUrl}
            salonId={salonId ?? ""}
            onSaved={(next) => {
              setDesk(next);
              setNotice("Die Webseite ist gespeichert.");
              setError(null);
            }}
            onError={setError}
          />
        ) : null}

        {desk && tab === "google" ? (
          <section className="max-w-3xl space-y-4">
            <p className="inline-flex rounded-md bg-secondary px-2 py-1 text-xs font-medium">Nicht verbunden</p>
            <h2 className="font-medium">Aus der Google-Suche eine Buchung machen</h2>
            <p className="text-sm text-muted-foreground">
              Google Search und Google Maps sind nicht angebunden. Der Schalter merkt nur, dass dieser Salon den Knopf später will. Gäste landen dann auf dem eigenen Buchungslink, nicht auf einem fremden Marktplatz.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={desk.googleRequested}
                onChange={(event) => void save({ action: "google", googleRequested: event.target.checked })}
              />
              Buchung über Google vorbereiten
            </label>
            <p className="text-sm">Zieladresse: {bookingUrl}</p>
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <h3 className="font-medium">Häufige Fragen</h3>
              <p className="mt-3 font-medium">Warum sehe ich den Knopf nicht bei Google?</p>
              <p className="text-muted-foreground">Weil kein Google-Konto verbunden ist. Der Wunsch allein schaltet nichts bei Google frei.</p>
              <p className="mt-3 font-medium">Welche Regeln gelten für den Link?</p>
              <p className="text-muted-foreground">Dieselben wie bei der Online-Buchung: Leistungen, Wartezeit, Warteliste und Freigabe. Es wird keine Karte belastet.</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{done ? "●" : "○"}</span>
      {label}
    </li>
  );
}

function ProfileForm({
  desk,
  onSave,
}: {
  desk: Desk;
  onSave: (fields: { description: string; instagram: string; facebook: string }) => void;
}) {
  const [description, setDescription] = useState(desk.description);
  const [instagram, setInstagram] = useState(desk.instagram);
  const [facebook, setFacebook] = useState(desk.facebook);
  return (
    <form
      className="rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ description, instagram, facebook });
      }}
    >
      <h2 className="font-medium">Profil von {desk.salonName}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desk.address}</p>
      <p className="text-sm text-muted-foreground">{desk.phone} · {desk.email}</p>
      <label className="mt-4 block text-sm">
        Beschreibung
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
        />
      </label>
      <label className="mt-3 block text-sm">
        Instagram
        <input value={instagram} onChange={(event) => setInstagram(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
      </label>
      <label className="mt-3 block text-sm">
        Facebook
        <input value={facebook} onChange={(event) => setFacebook(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
      </label>
      <button type="submit" className="mt-4 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
        Profil speichern
      </button>
    </form>
  );
}

function WebsiteForm({
  desk,
  siteUrl,
  bookingUrl,
  salonId,
  onSaved,
  onError,
}: {
  desk: Desk;
  siteUrl: string;
  bookingUrl: string;
  salonId: string;
  onSaved: (desk: Desk) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState(desk.siteTitle);
  const [subtitle, setSubtitle] = useState(desk.siteSubtitle);
  const [body, setBody] = useState(desk.siteBody);
  const [domain, setDomain] = useState(desk.siteDomain);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/widgets", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        salonId,
        site: { title, subtitle, body, domain },
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      onError(payload.error ?? "Die Webseite konnte nicht gespeichert werden.");
      return;
    }
    const fresh = await fetch(`/api/online?salonId=${encodeURIComponent(salonId)}`);
    onSaved((await fresh.json()) as Desk);
  }

  return (
    <form className="max-w-3xl space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <h2 className="font-medium">Eigene Salon-Webseite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Die Seite zeigt Text, Kontakt und den Buchungslink. Es wird kein Monatspreis berechnet und keine Agentur beauftragt.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <label className="block text-sm">
          Titel
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
        </label>
        <label className="block text-sm">
          Untertitel
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
        </label>
        <label className="block text-sm">
          Text
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
        </label>
        <label className="block text-sm">
          Wunschdomain, nur als Notiz
          <input value={domain} onChange={(event) => setDomain(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2" />
        </label>
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          Webseite speichern
        </button>
      </div>
      <p className="text-sm">
        <a className="font-medium" href={siteUrl} target="_blank" rel="noreferrer">Seite ansehen</a>
        <span className="text-muted-foreground"> · Buchung: {bookingUrl}</span>
      </p>
    </form>
  );
}
