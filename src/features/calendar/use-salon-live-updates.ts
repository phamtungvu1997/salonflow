"use client";

import { useEffect, useRef, useState } from "react";

export type SalonLiveEvent = {
  salonId: string;
  eventType: string;
  aggregateId: string;
  createdAt: string;
  cursor: string;
};

export type SalonLiveStatus = "idle" | "sse" | "poll";

type PollResponse = {
  cursor: string | null;
  events: SalonLiveEvent[];
};

const DEFAULT_POLL_MS = 20_000;
const SSE_RETRY_MS = 5_000;

/**
 * M12: Prefer SSE invalidations for the active salon; fall back to cursor polling.
 * Payloads are scopes/IDs only — clients always refetch the authoritative calendar slice.
 */
export function useSalonLiveUpdates(
  salonId: string | undefined,
  onInvalidate: () => void,
  options?: { pollIntervalMs?: number; enabled?: boolean },
): SalonLiveStatus {
  const onInvalidateRef = useRef(onInvalidate);
  onInvalidateRef.current = onInvalidate;
  const cursorRef = useRef<string | null>(null);
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_MS;
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<SalonLiveStatus>("idle");

  useEffect(() => {
    if (!salonId || !enabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let pollTimer: number | null = null;
    let retryTimer: number | null = null;
    let catchUpTimer: number | null = null;
    let source: EventSource | null = null;
    let mode: "sse" | "poll" = "sse";

    function clearTimers() {
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (catchUpTimer !== null) {
        window.clearTimeout(catchUpTimer);
        catchUpTimer = null;
      }
    }

    function applyEvents(events: SalonLiveEvent[], nextCursor: string | null) {
      if (cancelled || events.length === 0) {
        if (nextCursor) cursorRef.current = nextCursor;
        return;
      }
      if (nextCursor) cursorRef.current = nextCursor;
      onInvalidateRef.current();
    }

    /** Catch-up refetch after SSE attach/bootstrap so peers never skip commits made before subscribe. */
    function requestCatchUp() {
      if (cancelled) return;
      if (catchUpTimer !== null) window.clearTimeout(catchUpTimer);
      catchUpTimer = window.setTimeout(() => {
        catchUpTimer = null;
        if (!cancelled) onInvalidateRef.current();
      }, 0);
    }

    async function pollOnce() {
      if (cancelled || !salonId) return;
      const params = new URLSearchParams({ salonId, mode: "poll" });
      if (cursorRef.current) params.set("cursor", cursorRef.current);
      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: { accept: "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return;
        throw new Error(`poll ${response.status}`);
      }
      const body = (await response.json()) as PollResponse;
      applyEvents(body.events ?? [], body.cursor);
    }

    function startPolling(reason: "fallback" | "primary") {
      mode = "poll";
      setStatus("poll");
      clearTimers();
      if (source) {
        source.close();
        source = null;
      }
      void pollOnce().catch(() => {});
      pollTimer = window.setInterval(() => {
        void pollOnce().catch(() => {});
      }, pollIntervalMs);
      if (reason === "fallback") {
        retryTimer = window.setTimeout(() => {
          if (!cancelled) startSse();
        }, SSE_RETRY_MS * 3);
      }
    }

    function startSse() {
      if (cancelled || !salonId) return;
      clearTimers();
      if (source) {
        source.close();
        source = null;
      }
      mode = "sse";
      let preferPoll = false;
      const params = new URLSearchParams({ salonId });
      if (cursorRef.current) params.set("cursor", cursorRef.current);
      const next = new EventSource(`/api/events?${params.toString()}`, {
        withCredentials: true,
      });
      source = next;

      next.onopen = () => {
        if (cancelled) return;
        setStatus("sse");
        // Prefer SSE attach catch-up immediately; cursor frame may also request sync.
        requestCatchUp();
      };

      next.addEventListener("calendar.invalidate", (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse((event as MessageEvent).data) as SalonLiveEvent;
          if (payload.salonId !== salonId) return;
          applyEvents([payload], payload.cursor);
        } catch {
          // Ignore malformed frames; poll/refetch path remains available.
        }
      });

      next.addEventListener("cursor", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            cursor?: string;
            sync?: boolean;
          };
          if (payload.cursor) cursorRef.current = payload.cursor;
          // Server bootstrap advances to tip without replaying history — force authoritative refetch.
          if (payload.sync !== false) {
            requestCatchUp();
          }
        } catch {
          // ignore
        }
      });

      next.addEventListener("error", (event) => {
        // Server-sent auth/lifetime close (SF-044 revalidation or max stream TTL).
        if (cancelled) return;
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { code?: string };
          if (payload.code === "poll") {
            preferPoll = true;
            next.close();
            source = null;
            startPolling("primary");
            return;
          }
          if (payload.code === "forbidden" || payload.code === "expired") {
            next.close();
            source = null;
            startPolling("fallback");
          }
        } catch {
          // Browser transport errors use onerror instead.
        }
      });

      next.onerror = () => {
        if (cancelled || preferPoll) return;
        next.close();
        source = null;
        startPolling("fallback");
      };
    }

    startSse();

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void pollOnce().catch(() => {
          if (mode === "sse") startPolling("fallback");
        });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimers();
      document.removeEventListener("visibilitychange", onVisibility);
      if (source) source.close();
      setStatus("idle");
    };
  }, [salonId, enabled, pollIntervalMs]);

  return status;
}
