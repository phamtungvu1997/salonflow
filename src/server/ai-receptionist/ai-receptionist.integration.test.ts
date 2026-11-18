import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { closeSql, getSql } from "@/server/db";

import {
  approveBooking,
  clearAiConversationsForTests,
  handleCustomerMessage,
  startConversation,
} from "./index";

const salonId = "salon_jeannie";
const actor = "user_owner";

/** Next Tuesday in Berlin, at least two days ahead, so the slot is not already in the past. */
function upcomingTuesday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  let add = (2 - (weekday[pick("weekday")] ?? 1) + 7) % 7;
  if (add < 2) add += 7;
  const cursor = new Date(Date.UTC(Number(pick("year")), Number(pick("month")) - 1, Number(pick("day")) + add));
  return cursor.toISOString().slice(0, 10);
}

const bookingDate = upcomingTuesday();

describe.skipIf(!process.env.DATABASE_URL)("AI receptionist booking simulator", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for AI receptionist integration tests");
    }
  });

  beforeEach(() => {
    clearAiConversationsForTests();
  });

  afterAll(async () => {
    await closeSql();
  });

  it("creates a real appointment only after explicit confirmation", async () => {
    const sql = getSql();
    const staffId = `staff_${randomUUID()}`;
    const serviceId = `svc_${randomUUID()}`;
    const customerId = `cust_${randomUUID()}`;
    const serviceName = `AI Sim Shellac ${serviceId.slice(-4)}`;

    await sql.begin(async (tx) => {
      await tx`INSERT INTO staff (id, display_name, color) VALUES (${staffId}, ${"AI " + staffId.slice(-4)}, '#8fb4a8')`;
      await tx`
        INSERT INTO staff_salon_assignments (id, staff_id, salon_id)
        VALUES (${`asg_${randomUUID()}`}, ${staffId}, ${salonId})
      `;
      await tx`
        INSERT INTO resources (id, resource_type, staff_id)
        VALUES (${`res_${staffId}`}, 'staff', ${staffId})
      `;
      await tx`
        INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
        VALUES (${`shift_${randomUUID()}`}, ${staffId}, ${salonId}, 2, ${9 * 60}, ${19 * 60})
      `;
      await tx`INSERT INTO services (id, name) VALUES (${serviceId}, ${serviceName})`;
      await tx`
        INSERT INTO salon_services (salon_id, service_id, duration_minutes, price_cents)
        VALUES (${salonId}, ${serviceId}, 60, 3900)
      `;
      await tx`INSERT INTO staff_services (staff_id, service_id) VALUES (${staffId}, ${serviceId})`;
      await tx`
        INSERT INTO customers (id, display_name, home_salon_id)
        VALUES (${customerId}, 'AI Simulator Kundin', ${salonId})
      `;
    });

    const started = await startConversation(sql, {
      salonId,
      customerId,
      actorUserId: actor,
    });

    const afterService = await handleCustomerMessage(sql, {
      conversationId: started.id,
      text: `${serviceName} am ${bookingDate}`,
      actorUserId: actor,
    });
    expect(afterService.state).toBe("COLLECTING_DETAILS");

    const afterStaff = await handleCustomerMessage(sql, {
      conversationId: started.id,
      text: "Egal wer",
      actorUserId: actor,
    });
    expect(["OFFERING_OPTIONS", "NEEDS_CLARIFICATION"]).toContain(afterStaff.state);
    expect(afterStaff.offeredSlots.length).toBeGreaterThan(0);

    const slot = afterStaff.offeredSlots.find((s) => s.start === "16:00") ?? afterStaff.offeredSlots[0]!;
    const afterTime = await handleCustomerMessage(sql, {
      conversationId: started.id,
      text: `${slot.start} Uhr`,
      actorUserId: actor,
    });
    expect(afterTime.state).toBe("AWAITING_CUSTOMER_CONFIRMATION");
    expect(afterTime.proposal?.start).toBe(slot.start);
    expect(afterTime.lastBookingResult).toBeNull();

    const waiting = await handleCustomerMessage(sql, {
      conversationId: started.id,
      text: "Ja, bitte buchen",
      actorUserId: actor,
    });
    expect(waiting.state).toBe("AWAITING_STAFF_APPROVAL");
    expect(waiting.lastBookingResult).toBeNull();

    const confirmed = await approveBooking(sql, {
      conversationId: started.id,
      actorUserId: actor,
    });
    expect(confirmed.state).toBe("CONFIRMED");
    expect(confirmed.lastBookingResult?.appointmentId).toBeTruthy();
    expect(confirmed.calendarHref).toContain(confirmed.lastBookingResult!.date);

    const rows = await sql<{ id: string }[]>`
      SELECT id FROM appointments WHERE id = ${confirmed.lastBookingResult!.appointmentId}
    `;
    expect(rows).toHaveLength(1);

    const again = await handleCustomerMessage(sql, {
      conversationId: started.id,
      text: "Ja, bitte buchen",
      actorUserId: actor,
    });
    expect(again.state).toBe("CONFIRMED");
    expect(again.lastBookingResult?.appointmentId).toBe(
      confirmed.lastBookingResult?.appointmentId,
    );
  });
});
