import { ensureDefaultPublicBookingLink } from "@/server/online-booking";
import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

import { formatEuro } from "./parser";
import { getConversation, saveConversation, toPublicView } from "./store";
import type { AiConversation, ConversationPublicView, SimulatorChannel } from "./types";

function channelLine(channel: SimulatorChannel): string {
  if (channel === "instagram") return "Ich antworte Ihnen hier auf Instagram.";
  if (channel === "tiktok") return "Ich antworte Ihnen hier auf TikTok.";
  if (channel === "email") return "Ich antworte Ihnen per E-Mail.";
  return "Ich antworte Ihnen hier auf WhatsApp.";
}

function push(conversation: AiConversation, text: string) {
  conversation.messages.push({
    id: `msg_${crypto.randomUUID()}`,
    role: "assistant",
    text,
    createdAt: new Date().toISOString(),
  });
  conversation.updatedAt = new Date().toISOString();
}

export async function sendOwnerReply(
  sql: Db,
  input: {
    salonId: string;
    conversationId: string;
    kind: "nail_quote" | "complaint";
    quoteEuros?: number;
    note?: string;
    complaintChoice?: "apology" | "rebook" | "goodwill" | "callback";
  },
): Promise<ConversationPublicView> {
  const conversation = await getConversation(sql, input.conversationId);
  if (!conversation || conversation.salonId !== input.salonId) {
    throw new BookingError(404, "missing", "Gespräch nicht gefunden.");
  }
  const where = channelLine(conversation.channel);
  const extra = input.note?.trim();

  if (input.kind === "nail_quote") {
    if (!input.quoteEuros || input.quoteEuros <= 0) {
      throw new BookingError(422, "quote", "Bitte einen Preis für das Angebot eingeben.");
    }
    const cents = Math.round(input.quoteEuros * 100);
    const link = await ensureDefaultPublicBookingLink(sql, input.salonId);
    const base = (process.env.PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    push(
      conversation,
      `${where} Danke für das Foto. Für diese Nägel liegt unser Angebot bei ${formatEuro(cents)}.${extra ? ` ${extra}` : ""} Wenn Sie möchten, buchen Sie hier: ${base}/b/${link.token} — oder schreiben Sie mir Tag und Uhrzeit.`,
    );
  } else {
    const choice = input.complaintChoice ?? "apology";
    const body =
      choice === "rebook"
        ? "Es tut uns leid. Wir bieten Ihnen gern einen neuen Termin an. Schreiben Sie uns einfach Tag und Leistung."
        : choice === "goodwill"
          ? "Es tut uns leid. Als Entgegenkommen setzen wir Ihnen 10 € auf den nächsten Termin gut."
          : choice === "callback"
            ? "Es tut uns leid. Wir rufen Sie dazu persönlich an."
            : "Es tut uns leid, dass Sie unzufrieden sind. Wir möchten das in Ordnung bringen.";
    push(conversation, `${where} ${body}${extra ? ` ${extra}` : ""}`);
  }

  conversation.alerts = (conversation.alerts ?? []).map((alert) =>
    alert.kind === input.kind && !alert.seenAt
      ? { ...alert, seenAt: new Date().toISOString() }
      : alert,
  );
  await saveConversation(sql, conversation);
  return toPublicView(conversation);
}
