import { describe, expect, it } from "vitest";

import { parseCustomerMessage } from "./parser";
import type { CatalogService, CatalogStaff } from "./types";

const services: CatalogService[] = [
  {
    id: "svc_shellac",
    name: "Shellac",
    categoryId: "cat_shellac",
    categoryName: "Shellac",
    durationMinutes: 60,
    priceCents: 3500,
    eligibleStaffIds: ["staff_julia"],
  },
  {
    id: "svc_mani",
    name: "Maniküre",
    categoryId: "cat_mani",
    categoryName: "Maniküre",
    durationMinutes: 45,
    priceCents: 2800,
    eligibleStaffIds: ["staff_anna"],
  },
];

const staff: CatalogStaff[] = [
  { id: "staff_julia", displayName: "Julia Krüger", color: "#000" },
  { id: "staff_anna", displayName: "Anna Vogel", color: "#111" },
];

describe("parseCustomerMessage", () => {
  it("extracts German service, tomorrow afternoon, and staff-any", () => {
    const parsed = parseCustomerMessage(
      "Kann ich morgen Nachmittag Shellac? Egal wer.",
      { services, staff },
      new Date("2026-11-16T10:00:00+01:00"),
    );
    expect(parsed.serviceId).toBe("svc_shellac");
    expect(parsed.date).toBe("2026-11-17");
    expect(parsed.preferAfternoon).toBe(true);
    expect(parsed.staffAny).toBe(true);
    expect(parsed.bookingIntent).toBe(true);
  });

  it("extracts time and staff name", () => {
    const parsed = parseCustomerMessage("16 Uhr bei Julia", { services, staff });
    expect(parsed.start).toBe("16:00");
    expect(parsed.staffId).toBe("staff_julia");
  });

  it("detects booking confirmation and rejection", () => {
    expect(parseCustomerMessage("Ja, bitte buchen", { services, staff }).confirmation).toBe(
      true,
    );
    expect(parseCustomerMessage("Nein, abbrechen", { services, staff }).rejection).toBe(true);
  });

  it("detects consult intents for advice and comparison", () => {
    expect(
      parseCustomerMessage("Was ist besser: Shellac oder Gel?", { services, staff }).consultIntent,
    ).toBe("compare");
    expect(
      parseCustomerMessage("Was empfiehlst du für den Alltag?", { services, staff }).consultIntent,
    ).toBe("recommend");
    expect(parseCustomerMessage("Was kostet Shellac?", { services, staff }).consultIntent).toBe(
      "price",
    );
  });

  it("reads any catalog service, not only the well-known methods", () => {
    const catalog = {
      services: [
        ...services,
        {
          id: "svc_spa",
          name: "Spa Pediküre",
          categoryId: "cat_pedi",
          categoryName: "Pediküre",
          durationMinutes: 75,
          priceCents: 5400,
          eligibleStaffIds: ["staff_anna"],
        },
      ],
      staff,
    };
    const parsed = parseCustomerMessage("Was kostet eine Spa Pediküre?", catalog);
    expect(parsed.serviceId).toBe("svc_spa");
    expect(parsed.consultIntent).toBe("price");
    expect(parseCustomerMessage("Welche Leistungen bietet ihr?", catalog).consultIntent).toBe(
      "catalog",
    );
  });
});
