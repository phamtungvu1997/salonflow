"use client";

import { useCallback, useState } from "react";

import type { ConversationPublicView, CustomerOption, SimulatorChannel } from "./types";

export function useAiChat(salonId: string | null) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerId, setCustomerId] = useState<string>("cust_sophie");
  const [channel, setChannel] = useState<SimulatorChannel>("whatsapp");
  const [conversation, setConversation] = useState<ConversationPublicView | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!salonId) return;
    setLoadingCustomers(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?salonId=${encodeURIComponent(salonId)}`);
      if (!res.ok) {
        setError("Kunden konnten nicht geladen werden.");
        return;
      }
      const body = (await res.json()) as {
        customers?: { id: string; displayName: string }[];
      };
      const list = (body.customers ?? []).map((c) => ({
        id: c.id,
        displayName: c.displayName,
      }));
      setCustomers(list);
      setCustomerId((current) => {
        if (list.some((c) => c.id === current)) return current;
        const sophie = list.find((c) => c.id === "cust_sophie");
        return sophie?.id ?? list[0]?.id ?? current;
      });
    } catch {
      setError("Kunden konnten nicht geladen werden.");
    } finally {
      setLoadingCustomers(false);
    }
  }, [salonId]);

  const startChat = useCallback(async () => {
    if (!salonId || !customerId) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-receptionist/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, customerId, channel }),
      });
      const body = (await res.json()) as {
        conversation?: ConversationPublicView;
        error?: string;
      };
      if (!res.ok || !body.conversation) {
        setError(body.error ?? "Gespräch konnte nicht gestartet werden.");
        return;
      }
      setConversation({
        ...body.conversation,
        suggestedServices: body.conversation.suggestedServices ?? [],
        suggestedStaff: body.conversation.suggestedStaff ?? [],
        offeredSlots: body.conversation.offeredSlots ?? [],
        channel: body.conversation.channel ?? channel,
      });
    } catch {
      setError("Gespräch konnte nicht gestartet werden.");
    } finally {
      setStarting(false);
    }
  }, [salonId, customerId, channel]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversation || !text.trim()) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ai-receptionist/conversations/${encodeURIComponent(conversation.id)}/message`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text }),
          },
        );
        const body = (await res.json()) as {
          conversation?: ConversationPublicView;
          error?: string;
        };
        if (!res.ok || !body.conversation) {
          setError(
            body.error ??
              (res.status === 404
                ? "Gespräch abgelaufen (Server neu gestartet). Bitte neues Gespräch starten."
                : "Nachricht konnte nicht gesendet werden."),
          );
          return;
        }
        setConversation({
          ...body.conversation,
          suggestedServices: body.conversation.suggestedServices ?? [],
          suggestedStaff: body.conversation.suggestedStaff ?? [],
          offeredSlots: body.conversation.offeredSlots ?? [],
          calendarHref: body.conversation.calendarHref ?? null,
          preferenceHint: body.conversation.preferenceHint ?? null,
          llmUsed: body.conversation.llmUsed ?? false,
        });
      } catch {
        setError("Nachricht konnte nicht gesendet werden.");
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const approveBooking = useCallback(async () => {
    if (!conversation) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai-receptionist/conversations/${encodeURIComponent(conversation.id)}/approve`,
        { method: "POST" },
      );
      const body = (await res.json()) as {
        conversation?: ConversationPublicView;
        error?: string;
      };
      if (!res.ok || !body.conversation) {
        setError(body.error ?? "Freigabe fehlgeschlagen.");
        return;
      }
      setConversation({
        ...body.conversation,
        suggestedServices: body.conversation.suggestedServices ?? [],
        suggestedStaff: body.conversation.suggestedStaff ?? [],
        offeredSlots: body.conversation.offeredSlots ?? [],
        calendarHref: body.conversation.calendarHref ?? null,
        preferenceHint: body.conversation.preferenceHint ?? null,
        llmUsed: body.conversation.llmUsed ?? false,
      });
    } catch {
      setError("Freigabe fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  }, [conversation]);

  const resetChat = useCallback(() => {
    setConversation(null);
    setError(null);
  }, []);

  return {
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
  };
}
