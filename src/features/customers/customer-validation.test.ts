import { describe, expect, it } from "vitest";

import {
  buildCustomerMutationPayload,
  validateCustomerFormDraft,
} from "@/features/customers/customer-validation";
import { customerInitials, formatCustomerDate } from "@/features/customers/customer-types";

describe("customer domain validation and formatting", () => {
  it("requires both firstName and lastName on the customer form (CUS-003)", () => {
    const empty = validateCustomerFormDraft({ firstName: " ", lastName: "" });
    expect(empty.valid).toBe(false);
    if (!empty.valid) {
      expect(empty.missingFirstName).toBe(true);
      expect(empty.missingLastName).toBe(true);
    }

    const valid = validateCustomerFormDraft({
      firstName: " Klara ",
      lastName: " Beispiel ",
    });
    expect(valid).toEqual({
      valid: true,
      firstName: "Klara",
      lastName: "Beispiel",
      displayName: "Klara Beispiel",
    });
  });

  it("normalizes customer mutation payloads and formats German dates", () => {
    const payload = buildCustomerMutationPayload("salon_jeannie", {
      firstName: "Valerie ",
      lastName: " Lindqvist",
      gender: "female",
      birthDate: "1995-04-18",
      email: " valerie@example.test ",
      phone: " +49 151 88442211 ",
      phoneLandline: "",
      postalCode: "22303",
      houseNumber: "16",
      addressLine: "Borgweg",
      city: "Hamburg",
      labels: ["Favorit"],
      additionalInfo: " Mandelform ",
      invoiceInfo: "",
      appointmentWarning: "",
    });
    expect(payload.displayName).toBe("Valerie Lindqvist");
    expect(payload.email).toBe("valerie@example.test");
    expect(payload.phone).toBe("+49 151 88442211");
    expect(customerInitials(payload.displayName)).toBe("VL");
    expect(formatCustomerDate("2026-11-09T10:00:00+01:00")).toBe("09-11-2026");
  });
});
