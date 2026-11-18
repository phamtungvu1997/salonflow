"use client";

import { Mail, MessageCircle, Phone, Plug } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useSalon } from "@/features/salons/salon-context";

type ChannelState = {
  id: string;
  name: string;
  note: string;
  simulatorSupported: boolean;
  simulatorEnabled: boolean;
  liveLocked: boolean;
};

const ICONS: Record<string, typeof Mail> = {
  email: Mail,
  phone: Phone,
};

export function IntegrationsWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { activeSalon, ready } = useSalon();
  const salonId = activeSalon?.id ?? null;
  const [channels, setChannels] = useState<ChannelState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!salonId) return;
    const response = await fetch(`/api/integrations?salonId=${encodeURIComponent(salonId)}`);
    const body = (await response.json()) as { channels?: ChannelState[]; error?: string };
    if (!response.ok) {
      setError(body.error ?? "Integrationen konnten nicht geladen werden.");
      return;
    }
    setChannels(body.channels ?? []);
    setError(null);
  }, [salonId]);

  useEffect(() => {
    void load().catch(() => setError("Integrationen konnten nicht geladen werden."));
  }, [load]);

  async function toggle(channel: ChannelState) {
    if (!salonId || !channel.simulatorSupported || pending) return;
    const next = !channel.simulatorEnabled;
    setPending(channel.id);
    setChannels((current) =>
      current.map((item) => (item.id === channel.id ? { ...item, simulatorEnabled: next } : item)),
    );
    try {
      const response = await fetch("/api/integrations", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, channel: channel.id, simulatorEnabled: next }),
      });
      const body = (await response.json()) as { channels?: ChannelState[]; error?: string };
      if (!response.ok) {
        setError(body.error ?? "Der Kanal konnte nicht gespeichert werden.");
        await load();
        return;
      }
      setChannels(body.channels ?? []);
      setError(null);
    } catch {
      setError("Der Kanal konnte nicht gespeichert werden.");
      await load();
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      data-testid="page-integrationen"
      className={embedded ? "space-y-4" : "min-h-[calc(100vh-52px)] bg-background p-4 md:p-6"}
    >
      <div className={embedded ? "space-y-4" : "mx-auto max-w-5xl space-y-4"}>
        <header className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
                <Plug className="size-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-lg font-medium tracking-tight text-foreground">Integrationen</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {activeSalon
                    ? `${activeSalon.name}: Simulator für den Kundendialog ein- oder ausschalten. Live-Versand bleibt gesperrt.`
                    : ready
                      ? "Kein Salon geladen."
                      : "Salon wird geladen."}
                </p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
              Kein Live-Versand
            </span>
          </div>
        </header>

        {error ? (
          <p className="rounded-md border border-[#f0c7c4] bg-[#fdf4f3] px-3 py-2 text-sm text-[#8a2e28]" role="alert">
            {error}
          </p>
        ) : null}

        <section aria-label="Kanäle" className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => {
            const Icon = ICONS[channel.id] ?? MessageCircle;
            return (
              <article
                key={channel.id}
                data-testid={`integration-card-${channel.id}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-medium text-foreground">{channel.name}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{channel.note}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {channel.simulatorSupported ? "Simulator" : "Nicht verfügbar"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Live-Versand gesperrt</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={channel.simulatorEnabled}
                    aria-label={`${channel.name} Simulator`}
                    data-testid={`integration-switch-${channel.id}`}
                    disabled={!channel.simulatorSupported || pending === channel.id || !salonId}
                    onClick={() => void toggle(channel)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                      channel.simulatorEnabled ? "bg-foreground" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform ${
                        channel.simulatorEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {channel.simulatorEnabled ? (
                  <Link
                    href="/ki-rezeption"
                    className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Im Kundendialog testen
                  </Link>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
