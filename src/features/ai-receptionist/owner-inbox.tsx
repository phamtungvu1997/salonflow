"use client";

import type { ConversationPublicView, OwnerAlert, SimulatorChannel } from "./types";

const CHANNEL_LABEL: Record<SimulatorChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  email: "E-Mail",
};

const ALERT_LABEL: Record<OwnerAlert["kind"], string> = {
  approval: "Freigabe",
  nail_quote: "Nagelbild",
  complaint: "Beschwerde",
};

export function OwnerInbox({
  conversations,
  activeId,
  channelFilter,
  onChannelFilter,
  onOpen,
  onDismiss,
}: {
  conversations: ConversationPublicView[];
  activeId: string | null;
  channelFilter: SimulatorChannel | "all";
  onChannelFilter: (channel: SimulatorChannel | "all") => void;
  onOpen: (conversation: ConversationPublicView) => void;
  onDismiss: (conversationId: string, alertId: string) => void;
}) {
  const alerts = conversations.flatMap((conversation) =>
    (conversation.alerts ?? [])
      .filter((alert) => !alert.seenAt)
      .map((alert) => ({ alert, conversation })),
  );
  const visible =
    channelFilter === "all"
      ? conversations
      : conversations.filter((conversation) => conversation.channel === channelFilter);

  return (
    <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Inhaber-Posteingang</h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Alle KI-Gespräche dieses Salons. Hinweise erscheinen bei Freigabe, Nagelbild und Beschwerde.
        </p>
      </div>

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Hinweise ({alerts.length})
        </p>
        {alerts.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Keine offenen Hinweise.</p>
        ) : (
          alerts.map(({ alert, conversation }) => (
            <div
              key={alert.id}
              className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left"
            >
              <span className="text-[10px] font-bold uppercase text-amber-800">
                {ALERT_LABEL[alert.kind]} · {CHANNEL_LABEL[conversation.channel]}
              </span>
              <span className="mt-1 block text-xs font-semibold text-slate-900">{conversation.customerName}</span>
              <span className="mt-0.5 block text-[11px] text-slate-700">{alert.text}</span>
              <span className="mt-2 flex gap-2">
                <button type="button" onClick={() => onOpen(conversation)} className="text-[11px] font-semibold text-slate-900 underline">
                  Öffnen
                </button>
                <button type="button" onClick={() => onDismiss(conversation.id, alert.id)} className="text-[11px] font-semibold text-slate-600 underline">
                  Gelesen
                </button>
              </span>
            </div>
          ))
        )}
      </section>

      <div className="flex flex-wrap gap-1">
        {(["all", "whatsapp", "instagram", "tiktok", "email"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChannelFilter(item)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              channelFilter === item ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {item === "all" ? "Alle" : CHANNEL_LABEL[item]}
          </button>
        ))}
      </div>

      <section className="max-h-[420px] space-y-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-xs text-slate-500">Noch kein Gespräch auf diesem Kanal.</p>
        ) : (
          visible.map((conversation) => {
            const last = [...conversation.messages].reverse().find((message) => message.role !== "system");
            const openAlerts = (conversation.alerts ?? []).filter((alert) => !alert.seenAt).length;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onOpen(conversation)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  activeId === conversation.id ? "border-slate-900 bg-slate-50" : "border-slate-200"
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900">
                  {conversation.customerName}
                  <span className="font-medium text-slate-500">{CHANNEL_LABEL[conversation.channel]}</span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-600">
                  {last?.attachment === "nail_photo" ? "Nagelbild · " : ""}
                  {last?.text || "Noch keine Nachricht"}
                </span>
                {openAlerts > 0 ? (
                  <span className="mt-1 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    {openAlerts} offen
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </section>
    </aside>
  );
}
