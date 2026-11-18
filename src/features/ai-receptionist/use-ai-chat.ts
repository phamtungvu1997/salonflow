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
  const [inbox, setInbox] = useState<ConversationPublicView[]>([]);

  const loadInbox = useCallback(async () => {
    if (!salonId) return;
    try {
      const res = await fetch(`/api/ai-receptionist/inbox?salonId=${encodeURIComponent(salonId)}`);
      if (!res.ok) return;
      const body = (await res.json()) as { conversations?: ConversationPublicView[] };
      setInbox(body.conversations ?? []);
    } catch {
      // The open chat still works if the inbox list fails to refresh.
    }
  }, [salonId]);

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
        customers?: { id: string; displayName: string; email?: string | null }[];
      };
      const list = (body.customers ?? []).map((c) => ({
        id: c.id,
        displayName: c.displayName,
        email: c.email?.trim() ?? "",
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

  const startChat = useCallback(async (
    input?: string | { fromEmail: string; subject?: string; emailBody: string },
  ) => {
    if (!salonId || !customerId) return;
    setStarting(true);
    setError(null);
    const email = typeof input === "object" ? input : undefined;
    try {
      const res = await fetch("/api/ai-receptionist/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          salonId,
          customerId,
          channel: email ? "email" : channel,
          commentText: typeof input === "string" ? input.trim() || undefined : undefined,
          fromEmail: email?.fromEmail.trim() || undefined,
          subject: email?.subject?.trim() || undefined,
          emailBody: email?.emailBody.trim() || undefined,
        }),
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
        alerts: body.conversation.alerts ?? [],
        channel: body.conversation.channel ?? channel,
      });
      void loadInbox();
    } catch {
      setError("Gespräch konnte nicht gestartet werden.");
    } finally {
      setStarting(false);
    }
  }, [salonId, customerId, channel, loadInbox]);

  const sendMessage = useCallback(
    async (text: string, nailPhoto = false) => {
      if (!conversation || (!text.trim() && !nailPhoto)) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ai-receptionist/conversations/${encodeURIComponent(conversation.id)}/message`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text, nailPhoto }),
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
          alerts: body.conversation.alerts ?? [],
          calendarHref: body.conversation.calendarHref ?? null,
          preferenceHint: body.conversation.preferenceHint ?? null,
          llmUsed: body.conversation.llmUsed ?? false,
        });
        void loadInbox();
      } catch {
        setError("Nachricht konnte nicht gesendet werden.");
      } finally {
        setSending(false);
      }
    },
    [conversation, loadInbox],
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
        alerts: body.conversation.alerts ?? [],
        calendarHref: body.conversation.calendarHref ?? null,
        preferenceHint: body.conversation.preferenceHint ?? null,
        llmUsed: body.conversation.llmUsed ?? false,
      });
      void loadInbox();
    } catch {
      setError("Freigabe fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  }, [conversation, loadInbox]);

  const openConversation = useCallback((next: ConversationPublicView) => {
    setConversation({
      ...next,
      alerts: next.alerts ?? [],
      suggestedServices: next.suggestedServices ?? [],
      suggestedStaff: next.suggestedStaff ?? [],
      offeredSlots: next.offeredSlots ?? [],
    });
    setChannel(next.channel);
    setError(null);
  }, []);

  const sendOwnerReply = useCallback(
    async (payload: {
      conversationId: string;
      kind: "nail_quote" | "complaint";
      quoteEuros?: number;
      note?: string;
      complaintChoice?: "apology" | "rebook" | "goodwill" | "callback";
    }) => {
      if (!salonId) return;
      setError(null);
      const res = await fetch("/api/ai-receptionist/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, ...payload }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        conversation?: ConversationPublicView;
      };
      if (!res.ok) {
        setError(body.error ?? "Die Antwort konnte nicht gesendet werden.");
        return;
      }
      const next = body.conversation;
      if (next) {
        setConversation((current) =>
          current?.id === next.id
            ? {
                ...next,
                alerts: next.alerts ?? [],
                suggestedServices: next.suggestedServices ?? [],
                suggestedStaff: next.suggestedStaff ?? [],
                offeredSlots: next.offeredSlots ?? [],
              }
            : current,
        );
      }
      await loadInbox();
    },
    [salonId, loadInbox],
  );

  const dismissAlert = useCallback(
    async (conversationId: string, alertId: string) => {
      if (!salonId) return;
      const res = await fetch("/api/ai-receptionist/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salonId, conversationId, alertId }),
      });
      if (!res.ok) return;
      await loadInbox();
      setConversation((current) => {
        if (!current || current.id !== conversationId) return current;
        return {
          ...current,
          alerts: current.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, seenAt: new Date().toISOString() } : alert,
          ),
        };
      });
    },
    [salonId, loadInbox],
  );

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
    inbox,
    loadingCustomers,
    sending,
    starting,
    error,
    loadCustomers,
    loadInbox,
    startChat,
    sendMessage,
    approveBooking,
    openConversation,
    dismissAlert,
    sendOwnerReply,
    resetChat,
  };
}
