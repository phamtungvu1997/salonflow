import { BookingError } from "@/server/time";

/**
 * Live WhatsApp stays locked until the simulator is proven and the Owner enables it.
 * This adapter never sends messages by default.
 */
export function assertWhatsAppLiveAllowed(): void {
  if (process.env.WHATSAPP_LIVE_ENABLED !== "true") {
    throw new BookingError(
      403,
      "whatsapp_locked",
      "WhatsApp Live ist gesperrt, bis der Simulator stabil freigegeben ist.",
    );
  }
}

export type NormalizedInbound = {
  channel: "whatsapp";
  externalUserId: string;
  text: string;
  providerMessageId: string;
};

export function normalizeWhatsAppWebhook(): NormalizedInbound {
  assertWhatsAppLiveAllowed();
  throw new BookingError(501, "whatsapp_not_connected", "Kein Live-Webhook aktiv.");
}

export function assertInstagramLiveAllowed(): void {
  if (process.env.INSTAGRAM_LIVE_ENABLED !== "true") {
    throw new BookingError(
      403,
      "instagram_locked",
      "Instagram Live ist gesperrt. Der Simulator nutzt denselben Chat, sendet aber nichts.",
    );
  }
}

export function assertTikTokLiveAllowed(): void {
  if (process.env.TIKTOK_LIVE_ENABLED !== "true") {
    throw new BookingError(
      403,
      "tiktok_locked",
      "TikTok Live ist gesperrt. Der Simulator nutzt denselben Chat, sendet aber nichts.",
    );
  }
}
