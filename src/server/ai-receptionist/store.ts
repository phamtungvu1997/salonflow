import type { Db } from "@/server/db";

import type { AiConversation, ConversationPublicView } from "./types";

type GlobalAiStore = {
  salonflowAiConversations?: Map<string, AiConversation>;
  salonflowAiStoreReady?: Promise<void>;
};

const globalStore = globalThis as unknown as GlobalAiStore;

function memoryStore(): Map<string, AiConversation> {
  if (!globalStore.salonflowAiConversations) {
    globalStore.salonflowAiConversations = new Map();
  }
  return globalStore.salonflowAiConversations;
}

async function ensureTable(sql: Db): Promise<void> {
  if (!globalStore.salonflowAiStoreReady) {
    globalStore.salonflowAiStoreReady = (async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS ai_sim_conversations (
          id text PRIMARY KEY,
          salon_id text NOT NULL,
          actor_user_id text NOT NULL,
          payload jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    })();
  }
  await globalStore.salonflowAiStoreReady;
}

function normalizeConversation(raw: AiConversation): AiConversation {
  return {
    ...raw,
    offeredSlots: raw.offeredSlots ?? [],
    suggestedServices: raw.suggestedServices ?? [],
    suggestedStaff: raw.suggestedStaff ?? [],
    messages: raw.messages ?? [],
    calendarHref: raw.calendarHref ?? null,
    preferenceHint: raw.preferenceHint ?? null,
    llmUsed: raw.llmUsed ?? false,
    channel: raw.channel ?? "whatsapp",
  };
}

export async function saveConversation(sql: Db, conversation: AiConversation): Promise<void> {
  const normalized = normalizeConversation(conversation);
  memoryStore().set(normalized.id, normalized);
  try {
    await ensureTable(sql);
    // JSON.stringify keeps non-ASCII as \\uXXXX so WIN1252 local clusters accept the parameter.
    const payloadJson = JSON.stringify(normalized);
    await sql.unsafe(
      `INSERT INTO ai_sim_conversations (id, salon_id, actor_user_id, payload, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET
         payload = EXCLUDED.payload,
         actor_user_id = EXCLUDED.actor_user_id,
         updated_at = now()`,
      [normalized.id, normalized.salonId, normalized.actorUserId, payloadJson],
    );
  } catch (error) {
    // Memory singleton still keeps the chat usable if durable write fails.
    console.error("ai_sim_conversations persist failed", error);
  }
}

export async function getConversation(sql: Db, id: string): Promise<AiConversation | null> {
  const cached = memoryStore().get(id);
  if (cached) return normalizeConversation(cached);

  await ensureTable(sql);
  const rows = await sql<{ payload: AiConversation }[]>`
    SELECT payload FROM ai_sim_conversations WHERE id = ${id} LIMIT 1
  `;
  const payload = rows[0]?.payload;
  if (!payload) return null;
  const normalized = normalizeConversation(payload);
  memoryStore().set(normalized.id, normalized);
  return normalized;
}

export function toPublicView(conversation: AiConversation): ConversationPublicView {
  const normalized = normalizeConversation(conversation);
  return {
    id: normalized.id,
    salonId: normalized.salonId,
    customerId: normalized.customerId,
    customerName: normalized.customerName,
    channel: normalized.channel,
    state: normalized.state,
    messages: normalized.messages,
    proposal: normalized.proposal,
    offeredSlots: normalized.offeredSlots,
    suggestedServices: normalized.suggestedServices,
    suggestedStaff: normalized.suggestedStaff,
    lastBookingResult: normalized.lastBookingResult,
    calendarHref: normalized.calendarHref,
    preferenceHint: normalized.preferenceHint,
    llmUsed: normalized.llmUsed,
    lastError: normalized.lastError,
  };
}

/** Test helper — clears in-memory store (DB rows left for inspection). */
export function clearAiConversationsForTests(): void {
  memoryStore().clear();
}
