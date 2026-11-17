"use client";

import { Mail, MessageCircle, Phone, Plug } from "lucide-react";

const CHANNELS = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    status: "Vorbereitung",
    note: "Live gesperrt, bis der Simulator stabil ist · kein Versand",
    icon: MessageCircle,
  },
  {
    id: "instagram",
    name: "Instagram Direct",
    status: "Vorbereitung",
    note: "Gleicher Simulator wie WhatsApp · Live-Versand gesperrt",
    icon: MessageCircle,
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    status: "Vorbereitung",
    note: "Meta Business Messaging · noch nicht verbunden",
    icon: MessageCircle,
  },
  {
    id: "tiktok",
    name: "TikTok Direct",
    status: "Vorbereitung",
    note: "Gleicher Simulator · offizielle TikTok-Nachrichten noch nicht freigegeben",
    icon: MessageCircle,
  },
  {
    id: "email",
    name: "E-Mail",
    status: "Geplant",
    note: "Thread-sichere Adapter · kein Versand aktiv",
    icon: Mail,
  },
  {
    id: "phone",
    name: "Telefonie",
    status: "Geplant",
    note: "Nur eingehende Anrufe nach Freigabe",
    icon: Phone,
  },
] as const;

export function IntegrationsWorkspace() {
  return (
    <div
      data-testid="page-integrationen"
      className="min-h-[calc(100vh-52px)] bg-[#f4f5f7] p-6 lg:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Plug className="size-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Integrationen</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Kanäle für die spätere KI-Rezeption vorbereiten. Es werden noch keine
                  Kundenkonten verbunden und keine Nachrichten versendet.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
              Architektur · Keine Live-Verbindung
            </span>
          </div>
        </header>

        <section
          aria-label="Geplante Kanäle"
          className="grid gap-3 sm:grid-cols-2"
        >
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <article
                key={channel.id}
                data-testid={`integration-card-${channel.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">{channel.name}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{channel.note}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {channel.status}
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <p className="text-xs text-slate-500">
          Alle Buchungen laufen weiterhin ausschließlich über die SalonFlow Booking Engine.
          Externe Anbieter werden erst nach Owner-Freigabe angebunden.
        </p>
      </div>
    </div>
  );
}
