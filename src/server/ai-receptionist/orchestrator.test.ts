import { describe, expect, it } from "vitest";

import type { AiConversation } from "./types";

function baseConversation(overrides: Partial<AiConversation> = {}): AiConversation {
  const now = new Date().toISOString();
  return {
    id: "conv_test",
    salonId: "salon_jeannie",
    customerId: "cust_sophie",
    customerName: "Sophie Wagner",
    channel: "whatsapp",
    actorUserId: "user_owner",
    state: "AWAITING_CUSTOMER_CONFIRMATION",
    messages: [],
    collected: {
      serviceId: "svc_shellac",
      staffId: "staff_julia",
      staffAny: false,
      date: "2026-11-17",
      preferAfternoon: true,
      preferMorning: false,
      start: "16:00",
    },
    offeredSlots: [],
    suggestedServices: [],
    suggestedStaff: [],
    proposal: {
      id: "prop_1",
      serviceId: "svc_shellac",
      serviceName: "Shellac",
      staffId: "staff_julia",
      staffName: "Julia Krüger",
      customerId: "cust_sophie",
      customerName: "Sophie Wagner",
      date: "2026-11-17",
      start: "16:00",
      end: "17:00",
      durationMinutes: 60,
      priceCents: 3500,
      idempotencyKey: "ai_conv_test_key_123456",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
    lastBookingResult: null,
    calendarHref: null,
    preferenceHint: null,
    llmUsed: false,
    lastError: null,
    alerts: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("AI receptionist proposal safety", () => {
  it("keeps active proposals before expiry", () => {
    const conversation = baseConversation();
    expect(conversation.proposal?.start).toBe("16:00");
    expect(new Date(conversation.proposal!.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("marks expired proposals as past-due for booking gate", () => {
    const conversation = baseConversation({
      proposal: {
        ...baseConversation().proposal!,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      },
    });
    expect(new Date(conversation.proposal!.expiresAt).getTime()).toBeLessThan(Date.now());
  });

  it("does not allow booking without an active proposal object", () => {
    const conversation = baseConversation({ proposal: null, state: "OFFERING_OPTIONS" });
    expect(conversation.proposal).toBeNull();
    expect(conversation.state).not.toBe("AWAITING_CUSTOMER_CONFIRMATION");
  });
});
