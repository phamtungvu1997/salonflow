import { describe, expect, it } from "vitest";

import type { SessionUser } from "./auth";
import { authorizeCalendarEventsAccess } from "./outbox";
import { BookingError } from "./time";

const user: SessionUser = {
  id: "user_1",
  email: "a@example.com",
  displayName: "A",
  salonIds: ["salon_jeannie"],
  defaultSalonId: "salon_jeannie",
  rolesBySalon: { salon_jeannie: "receptionist" },
};

describe("M12 outbox authorization", () => {
  it("rejects unauthenticated callers with 401", () => {
    expect(() => authorizeCalendarEventsAccess(null, "salon_jeannie")).toThrow(BookingError);
    try {
      authorizeCalendarEventsAccess(null, "salon_jeannie");
    } catch (error) {
      expect(error).toMatchObject({ status: 401, code: "auth" });
    }
  });

  it("rejects unauthorized salon with 403", () => {
    expect(() => authorizeCalendarEventsAccess(user, "salon_juliet")).toThrow(BookingError);
    try {
      authorizeCalendarEventsAccess(user, "salon_juliet");
    } catch (error) {
      expect(error).toMatchObject({ status: 403, code: "forbidden" });
    }
  });

  it("allows assigned salon", () => {
    expect(authorizeCalendarEventsAccess(user, "salon_jeannie")).toBe(user);
  });
});
