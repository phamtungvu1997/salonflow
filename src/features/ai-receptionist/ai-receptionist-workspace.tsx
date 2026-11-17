"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

import { useSalon } from "@/features/salons/salon-context";

import { AiChatPanel } from "./chat-panel";
import { AiProposalPanel } from "./proposal-panel";
import { SIMULATOR_CHANNELS } from "./types";
import { useAiChat } from "./use-ai-chat";

export function AiReceptionistWorkspace() {
  const { activeSalon, ready: salonReady } = useSalon();
  const salonId = activeSalon?.id ?? (salonReady ? "salon_jeannie" : null);
  const {
    customers,
    customerId,
    setCustomerId,
    channel,
    setChannel,
    conversation,
    loadingCustomers,
    sending,
    starting,
    error,
    loadCustomers,
    startChat,
    sendMessage,
    approveBooking,
    resetChat,
  } = useAiChat(salonId);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  return (
    <div
      data-testid="page-ki-rezeption"
      className="min-h-[calc(100vh-52px)] bg-[#f4f5f7] p-6 lg:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Bot className="size-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">KI-Rezeption</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Derselbe Chat für WhatsApp, Instagram und TikTok. Beratung und Termine laufen über
                  die Booking Engine, nach Ihrer Freigabe. Live-Versand bleibt gesperrt.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
              Simulator · Bestätigte Neuanlage
            </span>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[180px] text-xs font-semibold text-slate-600">
              Kanal
              <select
                data-testid="ai-channel-select"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                value={channel}
                disabled={Boolean(conversation)}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
              >
                {SIMULATOR_CHANNELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[220px] flex-1 text-xs font-semibold text-slate-600">
              Demo-Kundin
              <select
                data-testid="ai-customer-select"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                value={customerId}
                disabled={loadingCustomers || !customers.length || Boolean(conversation)}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                {customers.length === 0 ? (
                  <option value="">Keine Kunden geladen</option>
                ) : (
                  customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.displayName}
                    </option>
                  ))
                )}
              </select>
            </label>
            {!conversation ? (
              <button
                type="button"
                data-testid="ai-start-chat"
                onClick={() => void startChat()}
                disabled={starting || !salonId || !customerId}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {starting ? "Startet…" : "Chat starten"}
              </button>
            ) : (
              <button
                type="button"
                data-testid="ai-reset-chat"
                onClick={resetChat}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
              >
                Neues Gespräch
              </button>
            )}
            <Link
              href="/kalender"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Zum Kalender
            </Link>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-rose-700" data-testid="ai-chat-error">
              {error}
            </p>
          ) : null}
          {!salonId ? (
            <p className="mt-3 text-sm text-amber-800">
              Bitte einen Salon auswählen (oben in der Leiste).
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <AiChatPanel
            conversation={conversation}
            channel={channel}
            sending={sending}
            onSend={sendMessage}
          />
          <AiProposalPanel
            conversation={conversation}
            approving={sending}
            onApprove={() => void approveBooking()}
          />
        </div>
      </div>
    </div>
  );
}
