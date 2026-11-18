import { describe, expect, it } from "vitest";

import { assertInstagramLiveAllowed, assertTikTokLiveAllowed, assertWhatsAppLiveAllowed } from "../channels/whatsapp";
import { expectedBookingDecision, scoreChatQuality } from "./quality";

describe("evaluation harness", () => {
  it("scores chat quality separately from booking correctness", () => {
    const reply = "Shellac hält im Alltag gut und kostet 42,00 €. BIAB ist die stärkere Variante.";
    const quality = scoreChatQuality(reply);
    expect(quality.score).toBe(3);
    expect(expectedBookingDecision({
      customerConfirmed: true,
      staffApproved: false,
      slotStillFree: true,
    })).toBe("await_staff");
    expect(expectedBookingDecision({
      customerConfirmed: true,
      staffApproved: true,
      slotStillFree: true,
    })).toBe("booked");
  });

  it("keeps live WhatsApp locked by default", () => {
    delete process.env.WHATSAPP_LIVE_ENABLED;
    delete process.env.INSTAGRAM_LIVE_ENABLED;
    delete process.env.TIKTOK_LIVE_ENABLED;
    expect(() => assertWhatsAppLiveAllowed()).toThrow(/gesperrt/);
    expect(() => assertInstagramLiveAllowed()).toThrow(/gesperrt/);
    expect(() => assertTikTokLiveAllowed()).toThrow(/gesperrt/);
  });
});
