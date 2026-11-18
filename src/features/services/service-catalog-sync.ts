"use client";

const CHANNEL_NAME = "salonflow-service-catalog";
const STORAGE_KEY = "salonflow:service-catalog-updated-at";
const CUSTOM_EVENT_NAME = "salonflow:services-updated";

export type ServiceCatalogChangePayload = {
  salonId: string;
  serviceId?: string;
  action?: "created" | "updated" | "deactivated" | "category" | "prices";
  timestamp: number;
};

export function notifyServiceCatalogUpdated(
  salonId: string,
  meta?: { serviceId?: string; action?: ServiceCatalogChangePayload["action"] },
): void {
  if (typeof window === "undefined") return;
  const payload: ServiceCatalogChangePayload = {
    salonId,
    serviceId: meta?.serviceId,
    action: meta?.action ?? "updated",
    timestamp: Date.now(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }

  try {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: payload }));
  } catch {
    // Ignore custom event errors
  }

  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Ignore BroadcastChannel errors
    }
  }
}

export function subscribeServiceCatalogUpdates(
  salonId: string,
  onUpdate: (payload?: ServiceCatalogChangePayload) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  function handlePayload(payload: ServiceCatalogChangePayload | undefined) {
    if (!payload || payload.salonId === salonId) {
      onUpdate(payload);
    }
  }

  function onCustomEvent(event: Event) {
    const custom = event as CustomEvent<ServiceCatalogChangePayload>;
    handlePayload(custom.detail);
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as ServiceCatalogChangePayload;
      handlePayload(parsed);
    } catch {
      onUpdate();
    }
  }

  function onFocusOrVisible() {
    if (document.visibilityState === "visible") {
      onUpdate();
    }
  }

  window.addEventListener(CUSTOM_EVENT_NAME, onCustomEvent);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocusOrVisible);
  document.addEventListener("visibilitychange", onFocusOrVisible);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<ServiceCatalogChangePayload>) => {
        handlePayload(event.data);
      };
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener(CUSTOM_EVENT_NAME, onCustomEvent);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocusOrVisible);
    document.removeEventListener("visibilitychange", onFocusOrVisible);
    if (channel) {
      try {
        channel.close();
      } catch {
        // Ignore
      }
    }
  };
}
