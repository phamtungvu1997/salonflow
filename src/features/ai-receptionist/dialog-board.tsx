"use client";

import { useState } from "react";

import type { ConversationPublicView, SimulatorChannel } from "./types";
import { STATE_LABELS } from "./types";

const CHANNEL_LABEL: Record<SimulatorChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  email: "E-Mail",
};

export function DialogBoard({
  salonName,
  conversations,
  onOpen,
  onNew,
  onCalendar,
  onSendQuote,
  onSendComplaint,
}: {
  salonName: string;
  conversations: ConversationPublicView[];
  onOpen: (conversation: ConversationPublicView) => void;
  onNew: () => void;
  onCalendar: () => void;
  onSendQuote: (conversationId: string, euros: number, note: string) => Promise<void>;
  onSendComplaint: (
    conversationId: string,
    choice: "apology" | "rebook" | "goodwill" | "callback",
    note: string,
  ) => Promise<void>;
}) {
  const alerts = conversations.flatMap((conversation) =>
    (conversation.alerts ?? []).filter((alert) => !alert.seenAt).map((alert) => ({ alert, conversation })),
  );
  const waiting = conversations.filter((conversation) => conversation.state === "AWAITING_STAFF_APPROVAL");
  const quotes = alerts.filter((item) => item.alert.kind === "nail_quote");
  const complaints = alerts.filter((item) => item.alert.kind === "complaint");
  const counts = (["whatsapp", "instagram", "tiktok", "email"] as const).map((channel) => ({
    channel,
    count: conversations.filter((conversation) => conversation.channel === channel).length,
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Guten Tag</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kundendialog für {salonName}. Offene Hinweise, Freigaben und Gespräche an einem Ort.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCalendar}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
          >
            Kalender
          </button>
          <button
            type="button"
            onClick={onNew}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Neues Gespräch
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.8fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Gespräche nach Kanal</h2>
              <p className="text-xs text-muted-foreground">{conversations.length} gespeicherte Dialoge</p>
            </div>
          </div>
          <div className="mt-6 flex h-36 items-end gap-4">
            {counts.map((item) => (
              <div key={item.channel} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-2xl bg-secondary/70 px-2">
                  <div
                    className="w-full rounded-xl bg-primary/80"
                    style={{ height: `${Math.max(12, (item.count / max) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{CHANNEL_LABEL[item.channel]}</span>
                <span className="text-sm font-semibold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Angebote aus Nagelbildern</h2>
          <p className="text-xs text-muted-foreground">Sie nennen den Preis. Der Agent antwortet im Kanal der Kundin.</p>
          <div className="mt-4 space-y-3">
            {quotes.length === 0 ? (
              <p className="rounded-2xl bg-secondary/60 px-3 py-4 text-sm text-muted-foreground">Kein Foto wartet auf ein Angebot.</p>
            ) : (
              quotes.map(({ conversation }) => (
                <QuoteCard
                  key={conversation.id}
                  name={conversation.customerName}
                  channel={CHANNEL_LABEL[conversation.channel]}
                  onOpen={() => onOpen(conversation)}
                  onSend={(euros, note) => onSendQuote(conversation.id, euros, note)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Beschwerden</h2>
        <p className="text-xs text-muted-foreground">Wählen Sie, wie der Agent antworten soll. Die Nachricht geht in denselben Kanal.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offene Beschwerde.</p>
          ) : (
            complaints.map(({ conversation, alert }) => (
              <ComplaintCard
                key={alert.id}
                name={conversation.customerName}
                channel={CHANNEL_LABEL[conversation.channel]}
                preview={alert.text}
                onOpen={() => onOpen(conversation)}
                onSend={(choice, note) => onSendComplaint(conversation.id, choice, note)}
              />
            ))
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.7fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Letzte Dialoge</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {conversations.slice(0, 4).map((conversation) => {
              const last = [...conversation.messages].reverse().find((message) => message.role !== "system");
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onOpen(conversation)}
                  className="rounded-2xl bg-secondary/50 p-4 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{conversation.customerName}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-primary">
                    {CHANNEL_LABEL[conversation.channel]} · {STATE_LABELS[conversation.state]}
                  </span>
                  <span className="mt-2 block line-clamp-2 text-xs text-muted-foreground">
                    {last?.text || "Noch keine Nachricht"}
                  </span>
                </button>
              );
            })}
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Starten Sie das erste Gespräch.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Zur Freigabe</h2>
          <div className="mt-4 space-y-3">
            {waiting.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kein Termin wartet auf Bestätigung.</p>
            ) : (
              waiting.slice(0, 5).map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onOpen(conversation)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border px-3 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold">{conversation.customerName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {conversation.proposal
                        ? `${conversation.proposal.serviceName} · ${conversation.proposal.start}`
                        : "Vorschlag öffnen"}
                    </span>
                  </span>
                  <span className="text-primary">→</span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuoteCard({
  name,
  channel,
  onOpen,
  onSend,
}: {
  name: string;
  channel: string;
  onOpen: () => void;
  onSend: (euros: number, note: string) => Promise<void>;
}) {
  const [euros, setEuros] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <div className="rounded-2xl border border-border p-3">
      <button type="button" onClick={onOpen} className="text-left">
        <span className="block text-sm font-semibold">{name}</span>
        <span className="text-[11px] font-semibold text-primary">Antwort über {channel}</span>
      </button>
      <div className="mt-2 flex gap-2">
        <input
          value={euros}
          onChange={(event) => setEuros(event.target.value.replace(",", "."))}
          placeholder="Preis in €"
          className="w-28 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optionaler Satz"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        disabled={sending || Number(euros) <= 0}
        onClick={() => {
          setSending(true);
          void onSend(Number(euros), note).finally(() => setSending(false));
        }}
        className="mt-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        {sending ? "Sendet…" : `Angebot über ${channel} senden`}
      </button>
    </div>
  );
}

function ComplaintCard({
  name,
  channel,
  preview,
  onOpen,
  onSend,
}: {
  name: string;
  channel: string;
  preview: string;
  onOpen: () => void;
  onSend: (choice: "apology" | "rebook" | "goodwill" | "callback", note: string) => Promise<void>;
}) {
  const [choice, setChoice] = useState<"apology" | "rebook" | "goodwill" | "callback">("apology");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const options = [
    ["apology", "Entschuldigung"],
    ["rebook", "Neuer Termin"],
    ["goodwill", "10 € gut"],
    ["callback", "Rückruf"],
  ] as const;
  return (
    <div className="rounded-2xl border border-border p-3">
      <button type="button" onClick={onOpen} className="text-left">
        <span className="block text-sm font-semibold">{name}</span>
        <span className="text-[11px] font-semibold text-primary">Antwort über {channel}</span>
      </button>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{preview}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {options.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setChoice(id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              choice === id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Eigener Satz, optional"
        className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={sending}
        onClick={() => {
          setSending(true);
          void onSend(choice, note).finally(() => setSending(false));
        }}
        className="mt-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        {sending ? "Sendet…" : `Antwort über ${channel} senden`}
      </button>
    </div>
  );
}
