export type SimulatorChannel = "whatsapp" | "instagram" | "tiktok" | "email";

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

export type ChatRole = "customer" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  attachment?: "nail_photo";
};

export type OwnerAlertKind = "approval" | "nail_quote" | "complaint";

export type OwnerAlert = {
  id: string;
  kind: OwnerAlertKind;
  text: string;
  createdAt: string;
  seenAt: string | null;
};

export type CatalogService = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  durationMinutes: number;
  priceCents: number;
  eligibleStaffIds: string[];
};

export type CatalogStaff = {
  id: string;
  displayName: string;
  color: string;
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

export type CollectedBookingFields = {
  serviceId: string | null;
  staffId: string | null;
  staffAny: boolean;
  date: string | null;
  preferAfternoon: boolean;
  preferMorning: boolean;
  start: string | null;
};

export type AiConversation = {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  channel: SimulatorChannel;
  actorUserId: string;
  state: ConversationState;
  messages: ChatMessage[];
  collected: CollectedBookingFields;
  offeredSlots: AvailableSlotOption[];
  suggestedServices: { id: string; name: string; priceCents: number; durationMinutes: number }[];
  suggestedStaff: { id: string; displayName: string; color: string }[];
  proposal: BookingProposal | null;
  lastBookingResult: BookingResultSummary | null;
  calendarHref: string | null;
  preferenceHint: string | null;
  llmUsed: boolean;
  lastError: string | null;
  alerts: OwnerAlert[];
  createdAt: string;
  updatedAt: string;
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
  suggestedServices: { id: string; name: string; priceCents: number; durationMinutes: number }[];
  suggestedStaff: { id: string; displayName: string; color: string }[];
  lastBookingResult: BookingResultSummary | null;
  calendarHref: string | null;
  preferenceHint: string | null;
  llmUsed: boolean;
  lastError: string | null;
  alerts: OwnerAlert[];
};
