"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { EXAMPLE_PROMPTS, type ConversationPublicView, type SimulatorChannel } from "./types";

const CHANNEL_CHROME: Record<
  SimulatorChannel,
  { mark: string; title: string; header: string; page: string }
> = {
  whatsapp: {
    mark: "WA",
    title: "WhatsApp",
    header: "bg-[#075e54]",
    page: "bg-[#efeae2]",
  },
  instagram: {
    mark: "IG",
    title: "Instagram",
    header: "bg-[#c13584]",
    page: "bg-[#f7f2f5]",
  },
  tiktok: {
    mark: "TT",
    title: "TikTok",
    header: "bg-[#111111]",
    page: "bg-[#f3f3f3]",
  },
};

type ChatPanelProps = {
  conversation: ConversationPublicView | null;
  channel?: SimulatorChannel;
  sending: boolean;
  onSend: (text: string) => Promise<void>;
};

export function AiChatPanel({ conversation, channel = "whatsapp", sending, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const showConfirmButton =
    Boolean(conversation?.proposal) &&
    conversation!.state === "AWAITING_CUSTOMER_CONFIRMATION";

  const showSlotButtons =
    Boolean(conversation) &&
    !showConfirmButton &&
    (conversation?.offeredSlots.length ?? 0) > 0 &&
    (conversation!.state === "OFFERING_OPTIONS" ||
      conversation!.state === "NEEDS_CLARIFICATION" ||
      conversation!.state === "CHECKING_AVAILABILITY");

  const suggestedStaff = conversation?.suggestedStaff ?? [];
  const showStaffButtons =
    Boolean(conversation) &&
    suggestedStaff.length > 0 &&
    !showSlotButtons &&
    !showConfirmButton &&
    conversation!.state !== "CONFIRMED" &&
    conversation!.state !== "BOOKING_IN_PROGRESS";

  const activeChannel = conversation?.channel ?? channel;
  const chrome = CHANNEL_CHROME[activeChannel];
  const suggestedServices = conversation?.suggestedServices ?? [];
  const showServiceButtons =
    Boolean(conversation) &&
    suggestedServices.length > 0 &&
    !showStaffButtons &&
    !showSlotButtons &&
    !showConfirmButton &&
    conversation!.state !== "CONFIRMED" &&
    conversation!.state !== "BOOKING_IN_PROGRESS";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    conversation?.messages.length,
    conversation?.offeredSlots.length,
    conversation?.suggestedServices.length,
    conversation?.suggestedStaff.length,
    conversation?.state,
  ]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !conversation) return;
    setDraft("");
    await onSend(text);
  }

  return (
    <section
      data-testid="ai-chat-panel"
      className={`flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 shadow-xs ${chrome.page}`}
    >
      <header className={`flex items-center gap-3 border-b border-black/5 px-4 py-3 text-white ${chrome.header}`}>
        <div className="flex size-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
          {chrome.mark}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {conversation?.customerName ?? `${chrome.title}-Simulator`}
          </p>
          <p className="text-[11px] text-white/80">
            {conversation
              ? `Simulierter ${chrome.title}-Chat · keine Live-Verbindung`
              : "Noch kein Gespräch gestartet"}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {!conversation ? (
          <p className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">
            Wählen Sie links eine Kundin und starten Sie den Simulator.
          </p>
        ) : (
          <>
            {conversation.messages.map((message) => {
              const mine = message.role === "customer";
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  data-testid={`ai-chat-msg-${message.role}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "rounded-br-sm bg-[#d9fdd3] text-slate-900"
                        : "rounded-bl-sm bg-white text-slate-900"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}

            {showServiceButtons ? (
              <div
                data-testid="ai-service-buttons"
                className="flex max-w-[92%] flex-col gap-2 rounded-xl bg-white/90 p-2.5 shadow-sm"
              >
                <p className="text-[11px] font-medium text-slate-500">Leistungen tippen:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      disabled={sending}
                      data-testid={`ai-service-${service.id}`}
                      onClick={() => void onSend(service.name)}
                      className="rounded-lg border border-slate-200 bg-[#f7faf9] px-3 py-2 text-left text-sm text-slate-800 hover:border-[#075e54]/40 hover:bg-[#e7f8f2] disabled:opacity-50"
                    >
                      <span className="block font-semibold">{service.name}</span>
                      <span className="block text-[11px] text-slate-500">
                        {(service.priceCents / 100).toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}{" "}
                        · {service.durationMinutes} Min.
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showStaffButtons ? (
              <div
                data-testid="ai-staff-buttons"
                className="flex max-w-[92%] flex-col gap-2 rounded-xl bg-white/90 p-2.5 shadow-sm"
              >
                <p className="text-[11px] font-medium text-slate-500">Mitarbeiterin wählen:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    data-testid="ai-staff-any"
                    onClick={() => void onSend("Egal wer")}
                    className="rounded-lg border border-[#075e54]/30 bg-[#e7f8f2] px-3 py-2 text-sm font-semibold text-[#064e46] hover:bg-[#d3f1e8] disabled:opacity-50"
                  >
                    Egal wer
                  </button>
                  {suggestedStaff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      disabled={sending}
                      data-testid={`ai-staff-${member.id}`}
                      onClick={() => void onSend(member.displayName)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-[#075e54]/40 hover:bg-[#f7faf9] disabled:opacity-50"
                    >
                      <span
                        className="inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: member.color || "#64748b" }}
                        aria-hidden
                      >
                        {member.displayName
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      {member.displayName}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showSlotButtons ? (
              <div
                data-testid="ai-slot-buttons"
                className="flex max-w-[92%] flex-wrap gap-2 rounded-xl bg-white/90 p-2.5 shadow-sm"
              >
                {conversation.offeredSlots.map((slot) => (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    type="button"
                    disabled={sending}
                    data-testid={`ai-slot-${slot.start}`}
                    onClick={() => void onSend(slot.start)}
                    className="min-w-[4.5rem] rounded-lg border border-[#075e54]/25 bg-[#e7f8f2] px-3 py-2 text-sm font-semibold text-[#064e46] hover:bg-[#d3f1e8] disabled:opacity-50"
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            ) : null}

            {showConfirmButton ? (
              <div className="flex max-w-[92%] flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sending}
                  data-testid="ai-confirm-booking"
                  onClick={() => void onSend("Ja, bitte buchen")}
                  className="rounded-lg bg-[#075e54] px-3 py-2 text-sm font-semibold text-white hover:bg-[#064e46] disabled:opacity-50"
                >
                  Ja, bitte buchen
                </button>
                <button
                  type="button"
                  disabled={sending}
                  data-testid="ai-reject-booking"
                  onClick={() => void onSend("Nein")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Andere Zeit
                </button>
              </div>
            ) : null}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {conversation ? (
        <div className="space-y-2 border-t border-black/5 bg-[#f0f2f5] px-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={sending}
                onClick={() => void onSend(prompt)}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              data-testid="ai-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending}
              placeholder="Nachricht als Kundin schreiben…"
              className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#075e54]"
            />
            <button
              type="submit"
              data-testid="ai-chat-send"
              disabled={sending || !draft.trim()}
              className="rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Senden
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
