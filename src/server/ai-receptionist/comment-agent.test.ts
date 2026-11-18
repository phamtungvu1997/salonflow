import { describe, expect, it } from "vitest";

import { buildCommentPrivateReply } from "./comment-agent";
import type { CatalogService } from "./types";

const shellac: CatalogService = {
  id: "svc_shellac",
  name: "Shellac",
  categoryId: null,
  categoryName: "Nägel",
  durationMinutes: 45,
  priceCents: 4200,
  eligibleStaffIds: [],
};

describe("buildCommentPrivateReply", () => {
  it("answers a price comment with the catalog price and the booking link", () => {
    const reply = buildCommentPrivateReply(
      "Was kostet Shellac?",
      { services: [shellac], staff: [] },
      "http://localhost:3000/b/sfb_test",
    );
    expect(reply).toContain("Danke für Ihren Kommentar");
    expect(reply).toContain("42,00");
    expect(reply).toContain("http://localhost:3000/b/sfb_test");
    expect(reply).not.toContain("->");
  });

  it("answers a booking comment with the online booking link", () => {
    const reply = buildCommentPrivateReply(
      "Wie kann ich einen Termin machen?",
      { services: [shellac], staff: [] },
      "http://localhost:3000/b/sfb_test",
    );
    expect(reply).toContain("online einen Termin buchen");
    expect(reply).toContain("http://localhost:3000/b/sfb_test");
  });
});
