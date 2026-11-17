export type SimulatorChannel = "whatsapp" | "instagram" | "tiktok";

export type ConversationState =
  | "NEW_REQUEST"
  | "COLLECTING_DETAILS"
  | "CHECKING_AVAILABILITY"
  | "OFFERING_OPTIONS"
  | "AWAITING_CUSTOMER_CONFIRMATION"
  | "AWAITING_STAFF_APPROVAL"
  | "BOOKING_IN_PROGRESS"
  | "CONFIRMED"
  | "NEEDS_CLARIFICATION"
  | "FAILED";

export type ChatMessage = {
  id: string;
  role: "customer" | "assistant" | "system";
  text: string;
  createdAt: string;
};

export type AvailableSlotOption = {
  start: string;
  end: string;
  startMinute: number;
  endMinute: number;
  availableStaffIds: string[];
};

export type BookingProposal = {
  id: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  customerId: string;
  customerName: string;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  priceCents: number;
  idempotencyKey: string;
  expiresAt: string;
};

export type BookingResultSummary = {
  appointmentId: string;
  reused: boolean;
  serviceName: string;
  staffName: string;
  date: string;
  start: string;
  end: string;
};

export type SuggestedService = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
};

export type SuggestedStaff = {
  id: string;
  displayName: string;
  color: string;
};

export type ConversationPublicView = {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  channel: SimulatorChannel;
  state: ConversationState;
  messages: ChatMessage[];
  proposal: BookingProposal | null;
  offeredSlots: AvailableSlotOption[];
  suggestedServices: SuggestedService[];
  suggestedStaff: SuggestedStaff[];
  lastBookingResult: BookingResultSummary | null;
  calendarHref: string | null;
  preferenceHint: string | null;
  llmUsed: boolean;
  lastError: string | null;
};

export type CustomerOption = {
  id: string;
  displayName: string;
};

export const STATE_LABELS: Record<ConversationState, string> = {
  NEW_REQUEST: "Neue Anfrage",
  COLLECTING_DETAILS: "Details sammeln",
  CHECKING_AVAILABILITY: "Verfügbarkeit prüfen",
  OFFERING_OPTIONS: "Zeiten anbieten",
  AWAITING_CUSTOMER_CONFIRMATION: "Warte auf Bestätigung",
  AWAITING_STAFF_APPROVAL: "Freigabe durch Team",
  BOOKING_IN_PROGRESS: "Buchung läuft",
  CONFIRMED: "Bestätigt",
  NEEDS_CLARIFICATION: "Rückfrage nötig",
  FAILED: "Fehlgeschlagen",
};

export const SIMULATOR_CHANNELS: { id: SimulatorChannel; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
];

export const EXAMPLE_PROMPTS = [
  "Was ist besser: Shellac oder Gel?",
  "Was empfiehlst du für den Alltag?",
  "Was kostet BIAB?",
  "Kann ich morgen Nachmittag einen Termin?",
  "Ja, bitte buchen",
] as const;
