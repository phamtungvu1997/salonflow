"use client";

import { useEffect, useState } from "react";
import type { SimulatorChannel } from "./types";
import Link from "next/link";

import { useSalon } from "@/features/salons/salon-context";

import { AiChatPanel } from "./chat-panel";
import { DialogBoard } from "./dialog-board";
import { OwnerInbox } from "./owner-inbox";
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
    inbox,
    loadInbox,
    openConversation,
    dismissAlert,
    sendOwnerReply,
  } = useAiChat(salonId);
  const [channelFilter, setChannelFilter] = useState<SimulatorChannel | "all">("all");
  const [enabledChannels, setEnabledChannels] = useState<SimulatorChannel[]>(
    SIMULATOR_CHANNELS.map((item) => item.id),
  );
  const [desk, setDesk] = useState<"overview" | "thread">("overview");
  const [commentText, setCommentText] = useState("Was kostet Shellac?");
  const [fromEmail, setFromEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("Terminanfrage");
  const [emailBody, setEmailBody] = useState(
    "Guten Tag, ich möchte morgen um 10 Uhr einen Termin für Shellac. Geht das?",
  );
  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  useEffect(() => {
    void loadCustomers();
    void loadInbox();
  }, [loadCustomers, loadInbox]);

  useEffect(() => {
    if (!salonId) return;
    let cancelled = false;
    void fetch(`/api/integrations?salonId=${encodeURIComponent(salonId)}`)
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          channels?: { id: SimulatorChannel; simulatorEnabled: boolean }[];
        };
        if (cancelled) return;
        const enabled = (body.channels ?? [])
          .filter((item) => item.simulatorEnabled)
          .map((item) => item.id)
          .filter((id): id is SimulatorChannel =>
            SIMULATOR_CHANNELS.some((item) => item.id === id),
          );
        setEnabledChannels(enabled);
        if (enabled.length > 0 && !enabled.includes(channel)) setChannel(enabled[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [salonId, channel, setChannel]);

  useEffect(() => {
    if (selectedCustomer?.email) setFromEmail(selectedCustomer.email);
  }, [selectedCustomer?.email]);

  return (
    <div
      data-testid="page-ki-rezeption"
      className="min-h-[calc(100vh-52px)] p-4 md:p-6"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        {desk === "overview" ? (
          <DialogBoard
            salonName={activeSalon?.name ?? "den Salon"}
            conversations={inbox}
            onOpen={(item) => {
              openConversation(item);
              setDesk("thread");
            }}
            onNew={() => {
              resetChat();
              setDesk("thread");
            }}
            onCalendar={() => {
              window.location.href = "/kalender";
            }}
            onSendQuote={(conversationId, euros, note) =>
              sendOwnerReply({ conversationId, kind: "nail_quote", quoteEuros: euros, note })
            }
            onSendComplaint={(conversationId, choice, note) =>
              sendOwnerReply({ conversationId, kind: "complaint", complaintChoice: choice, note })
            }
          />
        ) : null}

        {desk === "thread" ? (
        <>
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Kundendialog</p>
              <h2 className="text-lg font-semibold text-foreground">Gespräch</h2>
            </div>
            <button
              type="button"
              onClick={() => setDesk("overview")}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
            >
              Zur Übersicht
            </button>
          </div>
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
                {(enabledChannels.length ? SIMULATOR_CHANNELS.filter((item) => enabledChannels.includes(item.id)) : SIMULATOR_CHANNELS).map((item) => (
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
          {channel === "email" && !conversation ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">Eingehende E-Mail</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Der Agent liest Absender, Betreff und Text. Die Adresse muss zu einer Kundin dieses Salons gehören. Die Antwort bleibt ein Entwurf und wird nicht gesendet. Ein Termin entsteht erst nach Freigabe.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  "Guten Tag, ich möchte morgen um 10 Uhr einen Termin für Shellac. Geht das?",
                  "Was kostet Shellac?",
                  "Wie kann ich einen Termin machen?",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setEmailBody(sample)}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    {sample.length > 42 ? `${sample.slice(0, 42)}…` : sample}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  Von
                  <input
                    value={fromEmail}
                    onChange={(event) => setFromEmail(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  />
                </label>
                <label className="text-[11px] font-semibold text-slate-600">
                  Betreff
                  <input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  />
                </label>
              </div>
              <textarea
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <button
                type="button"
                disabled={starting || !salonId || !fromEmail.includes("@") || emailBody.trim().length < 2}
                onClick={() =>
                  void startChat({
                    fromEmail,
                    subject: emailSubject,
                    emailBody,
                  })
                }
                className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                E-Mail lesen
              </button>
            </div>
          ) : null}
          {channel !== "whatsapp" && channel !== "email" && !conversation ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">
                Kommentar unter einem Beitrag
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Der Agent antwortet privat per Direktnachricht, mit Preis aus dem Katalog und dem Online-Buchungslink. Es wird nichts auf Instagram oder TikTok gesendet.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  "Was kostet Shellac?",
                  "Wie kann ich einen Termin machen?",
                  "Ich möchte einen Termin",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setCommentText(sample)}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  className="min-w-[240px] flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  aria-label="Kommentar"
                />
                <button
                  type="button"
                  disabled={starting || !salonId || !customerId || commentText.trim().length < 2}
                  onClick={() => void startChat(commentText)}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Privat antworten
                </button>
              </div>
            </div>
          ) : channel === "whatsapp" && !conversation ? (
            <p className="mt-3 text-[11px] text-slate-500">
              WhatsApp hat keine Kommentare unter Beiträgen. Die Kundin schreibt dort selbst in den Chat. Kommentare gelten für Instagram und TikTok.
            </p>
          ) : null}
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

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_minmax(240px,0.7fr)]">
          <OwnerInbox
            conversations={inbox}
            activeId={conversation?.id ?? null}
            channelFilter={channelFilter}
            onChannelFilter={setChannelFilter}
            onOpen={(item) => {
              openConversation(item);
              setDesk("thread");
            }}
            onDismiss={(conversationId, alertId) => void dismissAlert(conversationId, alertId)}
          />
          <AiChatPanel
            conversation={conversation}
            channel={channel}
            sending={sending}
            onSend={sendMessage}
            onSendPhoto={() => sendMessage("", true)}
          />
          <AiProposalPanel
            conversation={conversation}
            approving={sending}
            onApprove={() => void approveBooking()}
          />
        </div>
        </>
        ) : null}
      </div>
    </div>
  );
}
