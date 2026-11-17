import { randomUUID } from "node:crypto";

import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

import { loadSalonCatalog } from "./availability";
import { interpretWithLlm } from "./llm";
import { loadCustomerPreference, preferenceHint, rememberCustomerPreference } from "./preferences";
import {
  buildCatalogOverview,
  buildRecommendationReply,
  buildSalonInfoReply,
  compareMethods,
  describeServiceDetails,
} from "./consultation";
import { formatEuro, formatGermanDate, parseCustomerMessage } from "./parser";
import { getConversation, saveConversation, toPublicView } from "./store";
import { createBooking, queryRealAvailability } from "./tools";
import type {
  AiConversation,
  AvailableSlotOption,
  BookingProposal,
  CatalogService,
  ChatMessage,
  ConversationPublicView,
} from "./types";

const PROPOSAL_TTL_MS = 15 * 60_000;

function nowIso(): string {
  return new Date().toISOString();
}

function pushMessage(conversation: AiConversation, role: ChatMessage["role"], text: string) {
  conversation.messages.push({
    id: `msg_${randomUUID()}`,
    role,
    text,
    createdAt: nowIso(),
  });
  conversation.updatedAt = nowIso();
}

function filterPreferredSlots(
  slots: AvailableSlotOption[],
  collected: AiConversation["collected"],
): AvailableSlotOption[] {
  let filtered = slots;
  if (collected.preferAfternoon) {
    filtered = filtered.filter((s) => s.startMinute >= 12 * 60);
  } else if (collected.preferMorning) {
    filtered = filtered.filter((s) => s.startMinute < 12 * 60);
  }
  return filtered;
}

function pickStaffForSlot(
  slot: AvailableSlotOption,
  collected: AiConversation["collected"],
): string | null {
  if (collected.staffId && slot.availableStaffIds.includes(collected.staffId)) {
    return collected.staffId;
  }
  if (collected.staffAny || !collected.staffId) {
    return slot.availableStaffIds[0] ?? null;
  }
  return null;
}

function buildProposal(
  conversation: AiConversation,
  input: {
    serviceId: string;
    serviceName: string;
    staffId: string;
    staffName: string;
    date: string;
    start: string;
    end: string;
    durationMinutes: number;
    priceCents: number;
  },
): BookingProposal {
  return {
    id: `prop_${randomUUID()}`,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    staffId: input.staffId,
    staffName: input.staffName,
    customerId: conversation.customerId,
    customerName: conversation.customerName,
    date: input.date,
    start: input.start,
    end: input.end,
    durationMinutes: input.durationMinutes,
    priceCents: input.priceCents,
    idempotencyKey: `ai_${conversation.id}_${input.date}_${input.start}_${input.staffId}`.slice(
      0,
      80,
    ),
    expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
  };
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

function proposalSummary(proposal: BookingProposal): string {
  return `${proposal.serviceName} am ${formatGermanDate(proposal.date)} um ${proposal.start} Uhr bei ${proposal.staffName} (${formatEuro(proposal.priceCents)})`;
}

async function offerAvailability(
  sql: Db,
  conversation: AiConversation,
): Promise<string> {
  if (!conversation.collected.serviceId || !conversation.collected.date) {
    conversation.state = "COLLECTING_DETAILS";
    return "Alles klar - mir fehlt nur noch die Behandlung oder der Tag. Was davon soll ich zuerst notieren?";
  }

  conversation.state = "CHECKING_AVAILABILITY";
  const availability = await queryRealAvailability(sql, {
    salonId: conversation.salonId,
    serviceId: conversation.collected.serviceId,
    date: conversation.collected.date,
    staffId: conversation.collected.staffAny ? null : conversation.collected.staffId,
  });

  const slots = filterPreferredSlots(availability.slots, conversation.collected);
  conversation.offeredSlots = slots.slice(0, 8);
  conversation.suggestedStaff = [];
  conversation.suggestedServices = [];

  if (slots.length === 0) {
    conversation.state = "NEEDS_CLARIFICATION";
    conversation.proposal = null;
    return `Hmm, am ${formatGermanDate(conversation.collected.date)} ist für ${availability.service.name} gerade nichts Passendes frei. Probieren wir einen anderen Tag?`;
  }

  // If customer already named a time, try to lock a proposal.
  if (conversation.collected.start) {
    const exact =
      slots.find((s) => s.start === conversation.collected.start) ??
      slots.find((s) => s.startMinute === Number(conversation.collected.start!.slice(0, 2)) * 60);
    if (exact) {
      const staffId = pickStaffForSlot(exact, conversation.collected);
      if (staffId) {
        const staffName =
          availability.staff.find((s) => s.id === staffId)?.displayName ?? "Mitarbeiterin";
        conversation.proposal = buildProposal(conversation, {
          serviceId: availability.service.id,
          serviceName: availability.service.name,
          staffId,
          staffName,
          date: availability.date,
          start: exact.start,
          end: exact.end,
          durationMinutes: availability.durationMinutes,
          priceCents: availability.service.priceCents,
        });
        conversation.state = "AWAITING_CUSTOMER_CONFIRMATION";
        return `Super, ${exact.start} Uhr geht.\n${proposalSummary(conversation.proposal)}\n\nSoll ich das so verbindlich eintragen?`;
      }
      return `Die ${conversation.collected.start} Uhr ist gerade nicht frei. Hier sind Alternativen - tippen Sie einfach eine Zeit.`;
    }
    return `Die ${conversation.collected.start} Uhr ist leider weg. Möchten Sie eine der freien Zeiten unten nehmen?`;
  }

  conversation.state = "OFFERING_OPTIONS";
  const when =
    conversation.collected.preferAfternoon
      ? "nachmittags"
      : conversation.collected.preferMorning
        ? "vormittags"
        : "";
  return when
    ? `Perfekt - für ${availability.service.name} am ${formatGermanDate(availability.date)} ${when} habe ich noch was. Welche Uhrzeit passt Ihnen?`
    : `Schön, für ${availability.service.name} am ${formatGermanDate(availability.date)} ist noch was frei. Welche Uhrzeit möchten Sie?`;
}

export async function startConversation(
  sql: Db,
  input: {
    salonId: string;
    customerId: string;
    actorUserId: string;
    channel?: AiConversation["channel"];
  },
): Promise<ConversationPublicView> {
  const customer = await sql<{ id: string; display_name: string }[]>`
    SELECT id, display_name
    FROM customers
    WHERE id = ${input.customerId} AND home_salon_id = ${input.salonId}
    LIMIT 1
  `;
  if (!customer[0]) {
    throw new BookingError(422, "customer_salon", "Kunde gehört nicht zu diesem Salon.");
  }

  const conversation: AiConversation = {
    id: `conv_${randomUUID()}`,
    salonId: input.salonId,
    customerId: customer[0].id,
    customerName: customer[0].display_name,
    channel: input.channel ?? "whatsapp",
    actorUserId: input.actorUserId,
    state: "NEW_REQUEST",
    messages: [],
    collected: {
      serviceId: null,
      staffId: null,
      staffAny: false,
      date: null,
      preferAfternoon: false,
      preferMorning: false,
      start: null,
    },
    offeredSlots: [],
    suggestedServices: [],
    suggestedStaff: [],
    proposal: null,
    lastBookingResult: null,
    calendarHref: null,
    preferenceHint: null,
    llmUsed: false,
    lastError: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const pref = await loadCustomerPreference(sql, input.salonId, customer[0].id);
  conversation.preferenceHint = preferenceHint(pref);
  const name = firstName(customer[0].display_name);
  const memory = conversation.preferenceHint ? `\n${conversation.preferenceHint}` : "";
  pushMessage(
    conversation,
    "assistant",
    `Hallo ${name}, schön dass Sie schreiben. Ich helfe gern bei der Beratung und bei Terminen.${memory}\n\nMöchten Sie eher eine Empfehlung, oder sollen wir direkt schauen, wann es passt?`,
  );
  await saveConversation(sql, conversation);
  return toPublicView(conversation);
}

function setSuggestions(conversation: AiConversation, services: CatalogService[]) {
  conversation.suggestedServices = services.slice(0, 6).map((service) => ({
    id: service.id,
    name: service.name,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
  }));
  conversation.suggestedStaff = [];
}

function setStaffSuggestions(
  conversation: AiConversation,
  staff: { id: string; displayName: string; color: string }[],
) {
  conversation.suggestedStaff = staff.slice(0, 8).map((member) => ({
    id: member.id,
    displayName: member.displayName,
    color: member.color,
  }));
  conversation.suggestedServices = [];
  conversation.offeredSlots = [];
}

function handleConsultation(
  conversation: AiConversation,
  catalog: { services: CatalogService[] },
  intent: ReturnType<typeof parseCustomerMessage>,
): string | null {
  if (!intent.consultIntent) return null;

  const focused =
    (intent.serviceId
      ? catalog.services.find((s) => s.id === intent.serviceId)
      : null) ??
    (conversation.collected.serviceId
      ? catalog.services.find((s) => s.id === conversation.collected.serviceId)
      : null) ??
    null;

  if (intent.consultIntent === "salon_info") {
    conversation.suggestedServices = [];
    return buildSalonInfoReply();
  }

  if (intent.consultIntent === "compare") {
    const reply = compareMethods(catalog.services);
    setSuggestions(
      conversation,
      catalog.services.filter((s) => /shellac|biab|gel|acryl|mani/i.test(s.name)).slice(0, 5),
    );
    return reply;
  }

  if (intent.consultIntent === "catalog") {
    setSuggestions(conversation, catalog.services.slice(0, 6));
    return buildCatalogOverview(catalog.services);
  }

  if (intent.consultIntent === "price" || intent.consultIntent === "duration") {
    if (!focused) {
      setSuggestions(conversation, catalog.services.slice(0, 6));
      return intent.consultIntent === "price"
        ? "Klar - wovon soll ich den Preis sagen? Tippen Sie einfach eine Leistung."
        : "Gerne. Welche Behandlung meinen Sie genau? Dann sage ich Ihnen die Dauer.";
    }
    setSuggestions(conversation, [focused]);
    if (intent.consultIntent === "price") {
      return `${focused.name} liegt bei ${formatEuro(focused.priceCents)} und dauert etwa ${focused.durationMinutes} Minuten. Soll ich gleich nach einem Termin schauen?`;
    }
    return `${focused.name} dauert ungefähr ${focused.durationMinutes} Minuten (${formatEuro(focused.priceCents)}). Passt das zeitlich für Sie?`;
  }

  if (intent.consultIntent === "service_details" && focused) {
    conversation.collected.serviceId = focused.id;
    setSuggestions(conversation, [focused]);
    return `${describeServiceDetails(focused)}\n\nWenn Sie mögen: sagen Sie einfach „morgen“ oder einen anderen Tag - ich prüfe die Zeiten.`;
  }

  if (intent.consultIntent === "recommend" || intent.consultIntent === "service_details") {
    const built = buildRecommendationReply(catalog.services, intent.consultNeed, focused);
    setSuggestions(conversation, built.suggestions);
    if (built.suggestions[0] && intent.consultNeed !== "unknown") {
      // Soft preference only when need is clear; still ask before locking.
    }
    return built.text;
  }

  return null;
}

export async function handleCustomerMessage(
  sql: Db,
  input: {
    conversationId: string;
    text: string;
    actorUserId: string;
  },
): Promise<ConversationPublicView> {
  const conversation = await getConversation(sql, input.conversationId);
  if (!conversation) {
    throw new BookingError(
      404,
      "conversation_not_found",
      "Gespräch nicht gefunden. Bitte starten Sie ein neues Gespräch.",
    );
  }
  // Simulator: allow any authenticated staff user for the salon after reload/HMR.
  conversation.actorUserId = input.actorUserId;

  const text = input.text.trim();
  if (!text) {
    throw new BookingError(422, "empty", "Nachricht ist leer.");
  }

  pushMessage(conversation, "customer", text);
  conversation.lastError = null;

  if (conversation.state === "CONFIRMED") {
    pushMessage(
      conversation,
      "assistant",
      "Der Termin ist schon gebucht. Für eine neue Anfrage starten wir am besten ein frisches Gespräch.",
    );
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }

  const catalog = await loadSalonCatalog(sql, conversation.salonId);
  const intent = parseCustomerMessage(text, catalog);
  if (
    intent.confirmation === true &&
    (conversation.state === "CONFIRMED" || conversation.state === "AWAITING_STAFF_APPROVAL")
  ) {
    pushMessage(
      conversation,
      "assistant",
      conversation.state === "CONFIRMED"
        ? "Der Termin ist schon fest eingetragen."
        : "Liegt schon zur Freigabe bei der Kollegin.",
    );
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }
  try {
    const hint = await interpretWithLlm(text, catalog);
    if (hint) {
      conversation.llmUsed = true;
      if (hint.staffAny) intent.staffAny = true;
      if (hint.preferAfternoon) intent.preferAfternoon = true;
      if (hint.preferMorning) intent.preferMorning = true;
      if (hint.date && /^\d{4}-\d{2}-\d{2}$/.test(hint.date)) intent.date = hint.date;
      if (hint.start && /^\d{2}:\d{2}$/.test(hint.start)) intent.start = hint.start;
      if (hint.confirmation !== null && intent.confirmation === null) {
        intent.confirmation = hint.confirmation;
      }
      if (hint.consult && !intent.consultIntent) intent.consultIntent = hint.consult;
      if (!intent.serviceId && hint.serviceName) {
        const service = catalog.services.find(
          (item) => item.name.toLowerCase() === hint.serviceName!.toLowerCase(),
        );
        if (service) intent.serviceId = service.id;
      }
      if (!intent.staffId && hint.staffName) {
        const member = catalog.staff.find((item) => {
          const first = item.displayName.toLowerCase().split(" ")[0] ?? "";
          return first.length > 1 && hint.staffName!.toLowerCase().includes(first);
        });
        if (member) intent.staffId = member.id;
      }
    }
  } catch {
    conversation.llmUsed = false;
  }

  if (intent.serviceId) conversation.collected.serviceId = intent.serviceId;
  if (intent.staffId) {
    conversation.collected.staffId = intent.staffId;
    conversation.collected.staffAny = false;
  }
  if (intent.staffAny) {
    conversation.collected.staffAny = true;
    conversation.collected.staffId = null;
  }
  if (intent.date) conversation.collected.date = intent.date;
  if (intent.start) conversation.collected.start = intent.start;
  if (intent.preferAfternoon) {
    conversation.collected.preferAfternoon = true;
    conversation.collected.preferMorning = false;
  }
  if (intent.preferMorning) {
    conversation.collected.preferMorning = true;
    conversation.collected.preferAfternoon = false;
  }

  // Invalidate stale proposal when details change after offering.
  if (
    conversation.proposal &&
    conversation.state !== "AWAITING_CUSTOMER_CONFIRMATION" &&
    conversation.state !== "BOOKING_IN_PROGRESS"
  ) {
    conversation.proposal = null;
  }
  if (
    conversation.proposal &&
    (intent.serviceId || intent.date || intent.start || intent.staffId || intent.staffAny)
  ) {
    // Customer changed mind — drop proposal unless they are confirming.
    if (intent.confirmation !== true) {
      conversation.proposal = null;
      conversation.state = "COLLECTING_DETAILS";
    }
  }

  // Confirmation path
  if (
    intent.confirmation === true &&
    conversation.proposal &&
    (conversation.state === "AWAITING_CUSTOMER_CONFIRMATION" ||
      conversation.state === "OFFERING_OPTIONS")
  ) {
    const proposal = conversation.proposal;
    if (new Date(proposal.expiresAt).getTime() < Date.now()) {
      conversation.proposal = null;
      conversation.state = "FAILED";
      conversation.lastError = "Vorschlag abgelaufen";
      pushMessage(
        conversation,
        "assistant",
        "Der Vorschlag ist leider abgelaufen. Ich hole kurz frische Zeiten - tippen Sie danach einfach neu.",
      );
      const reply = await offerAvailability(sql, conversation);
      pushMessage(conversation, "assistant", reply);
      await saveConversation(sql, conversation);
      return toPublicView(conversation);
    }

    conversation.state = "AWAITING_STAFF_APPROVAL";
    conversation.calendarHref = null;
    pushMessage(
      conversation,
      "assistant",
      `Perfekt, ich habe das notiert:\n${proposalSummary(proposal)}\n\nEine Kollegin bestätigt den Termin noch kurz, dann ist er fest im Kalender.`,
    );
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }

  if (intent.rejection && conversation.proposal) {
    conversation.proposal = null;
    conversation.state = "COLLECTING_DETAILS";
    pushMessage(
      conversation,
      "assistant",
      "Kein Problem, lassen wir das. Andere Uhrzeit - oder doch lieber eine andere Behandlung?",
    );
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }

  // Consultation / advice before pushing a booking flow
  if (intent.consultIntent && !intent.bookingIntent && !intent.start) {
    conversation.state = "COLLECTING_DETAILS";
    const consultReply = handleConsultation(conversation, catalog, intent);
    if (consultReply) {
      pushMessage(conversation, "assistant", consultReply);
      await saveConversation(sql, conversation);
      return toPublicView(conversation);
    }
  }

  // Selecting a time from offered options (e.g. "16:00" or "16 Uhr")
  if (
    intent.start &&
    conversation.collected.serviceId &&
    conversation.collected.date &&
    (conversation.state === "OFFERING_OPTIONS" ||
      conversation.state === "CHECKING_AVAILABILITY" ||
      conversation.state === "COLLECTING_DETAILS" ||
      conversation.state === "NEEDS_CLARIFICATION" ||
      conversation.state === "NEW_REQUEST")
  ) {
    const reply = await offerAvailability(sql, conversation);
    pushMessage(conversation, "assistant", reply);
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }

  // Enough info to search availability
  if (conversation.collected.serviceId && conversation.collected.date) {
    if (!conversation.collected.staffId && !conversation.collected.staffAny) {
      conversation.state = "COLLECTING_DETAILS";
      const eligible = catalog.services.find((s) => s.id === conversation.collected.serviceId);
      const staffOptions = catalog.staff
        .filter((st) => eligible?.eligibleStaffIds.includes(st.id))
        .slice(0, 8);
      setStaffSuggestions(conversation, staffOptions);
      pushMessage(
        conversation,
        "assistant",
        "Haben Sie jemanden Festes im Kopf, oder ist Ihnen egal wer? Tippen Sie einfach eine Person.",
      );
      await saveConversation(sql, conversation);
      return toPublicView(conversation);
    }

    conversation.suggestedStaff = [];
    const reply = await offerAvailability(sql, conversation);
    pushMessage(conversation, "assistant", reply);
    await saveConversation(sql, conversation);
    return toPublicView(conversation);
  }

  // Collect missing pieces with natural acknowledgements
  conversation.state = "COLLECTING_DETAILS";
  if (intent.bookingIntent && !conversation.collected.serviceId && conversation.collected.date) {
    setSuggestions(conversation, catalog.services.slice(0, 5));
    pushMessage(
      conversation,
      "assistant",
      `Alles klar, ${formatGermanDate(conversation.collected.date)} notiere ich. Welche Behandlung soll es denn sein?`,
    );
  } else if (!conversation.collected.serviceId && !conversation.collected.date) {
    setSuggestions(conversation, catalog.services.slice(0, 5));
    pushMessage(
      conversation,
      "assistant",
      "Gerne. Möchten Sie eher Shellac, Gel/BIAB, Maniküre oder Pediküre - und wann passt es ungefähr?",
    );
  } else if (!conversation.collected.serviceId) {
    setSuggestions(conversation, catalog.services.slice(0, 5));
    pushMessage(
      conversation,
      "assistant",
      "Welches Feeling suchen Sie - eher Farbe/Alltag, Verstärkung oder Pflege? Tippen Sie gern eine Leistung.",
    );
  } else if (!conversation.collected.date) {
    const serviceName =
      catalog.services.find((s) => s.id === conversation.collected.serviceId)?.name ??
      "die Behandlung";
    pushMessage(
      conversation,
      "assistant",
      `${serviceName} - schön. Welcher Tag wäre Ihnen lieb? Zum Beispiel „morgen“ oder „Donnerstag“.`,
    );
  } else {
    pushMessage(
      conversation,
      "assistant",
      "Kurz nochmal: Welche Behandlung und welcher Tag sollen es sein?",
    );
  }

  await saveConversation(sql, conversation);
  return toPublicView(conversation);
}

export async function approveBooking(
  sql: Db,
  input: { conversationId: string; actorUserId: string },
): Promise<ConversationPublicView> {
  const conversation = await getConversation(sql, input.conversationId);
  if (!conversation) throw new BookingError(404, "not_found", "Gespräch nicht gefunden");
  conversation.actorUserId = input.actorUserId;
  if (conversation.state === "CONFIRMED" && conversation.lastBookingResult) {
    return toPublicView(conversation);
  }
  const proposal = conversation.proposal;
  if (!proposal || conversation.state !== "AWAITING_STAFF_APPROVAL") {
    throw new BookingError(409, "nothing_to_approve", "Kein Termin wartet auf Freigabe.");
  }
  if (new Date(proposal.expiresAt).getTime() < Date.now()) {
    throw new BookingError(409, "proposal_expired", "Vorschlag abgelaufen.");
  }

  conversation.state = "BOOKING_IN_PROGRESS";
  try {
    const result = await createBooking(sql, conversation.actorUserId, {
      salonId: conversation.salonId,
      staffId: proposal.staffId,
      customerId: proposal.customerId,
      serviceId: proposal.serviceId,
      date: proposal.date,
      start: proposal.start,
      idempotencyKey: proposal.idempotencyKey,
    });
    conversation.lastBookingResult = {
      appointmentId: result.appointmentId,
      reused: result.reused,
      serviceName: proposal.serviceName,
      staffName: proposal.staffName,
      date: proposal.date,
      start: proposal.start,
      end: proposal.end,
    };
    conversation.calendarHref = `/kalender?datum=${proposal.date}`;
    conversation.state = "CONFIRMED";
    await rememberCustomerPreference(sql, {
      salonId: conversation.salonId,
      customerId: proposal.customerId,
      serviceId: proposal.serviceId,
      serviceName: proposal.serviceName,
      staffId: proposal.staffId,
      staffName: proposal.staffName,
    });
    pushMessage(
      conversation,
      "assistant",
      `Wunderbar, ist gebucht.\n${proposalSummary(proposal)}\n\nIm Kalender: ${conversation.calendarHref}${result.reused ? " (war schon gespeichert)" : ""}.`,
    );
  } catch (error) {
    conversation.state = "FAILED";
    conversation.proposal = null;
    conversation.lastError =
      error instanceof BookingError ? error.message : "Buchung fehlgeschlagen";
    pushMessage(
      conversation,
      "assistant",
      `Die Freigabe ist nicht durchgegangen: ${conversation.lastError}`,
    );
  }
  await saveConversation(sql, conversation);
  return toPublicView(conversation);
}
