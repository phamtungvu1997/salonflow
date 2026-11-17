export type ChatQuality = {
  natural: boolean;
  notTooLong: boolean;
  noInventedCurrency: boolean;
  score: number;
};

/** Language quality only — booking correctness is scored separately. */
export function scoreChatQuality(reply: string): ChatQuality {
  const natural = /[a-zA-ZäöüÄÖÜß]/.test(reply) && !/Buchungsnr\./.test(reply);
  const notTooLong = reply.length > 20 && reply.length < 900;
  const noInventedCurrency = !/€\s*0[,.]00/.test(reply);
  const score = [natural, notTooLong, noInventedCurrency].filter(Boolean).length;
  return { natural, notTooLong, noInventedCurrency, score };
}

export type BookingDecision = "collect" | "offer" | "await_staff" | "booked" | "refuse";

/** Booking correctness is independent from how nice the sentence sounds. */
export function expectedBookingDecision(input: {
  customerConfirmed: boolean;
  staffApproved: boolean;
  slotStillFree: boolean;
}): BookingDecision {
  if (!input.customerConfirmed) return "offer";
  if (!input.staffApproved) return "await_staff";
  if (!input.slotStillFree) return "refuse";
  return "booked";
}
