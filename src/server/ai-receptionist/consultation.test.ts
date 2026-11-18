import { describe, expect, it } from "vitest";

import { buildCatalogOverview, buildRecommendationReply, compareMethods, recommendServices } from "./consultation";
import type { CatalogService } from "./types";

const services: CatalogService[] = [
  {
    id: "svc_shellac",
    name: "Shellac",
    categoryId: "cat_shellac",
    categoryName: "Shellac",
    durationMinutes: 60,
    priceCents: 4200,
    eligibleStaffIds: ["a"],
  },
  {
    id: "svc_biab",
    name: "BIAB Naturnagelverstärkung",
    categoryId: "cat_gel",
    categoryName: "Gel & BIAB",
    durationMinutes: 60,
    priceCents: 5200,
    eligibleStaffIds: ["a"],
  },
  {
    id: "svc_acryl",
    name: "Acryl Neumodellage mit Verlängerung",
    categoryId: "cat_acryl",
    categoryName: "Acryl",
    durationMinutes: 90,
    priceCents: 6800,
    eligibleStaffIds: ["a"],
  },
];

describe("consultation helpers", () => {
  it("recommends everyday-friendly services", () => {
    const picks = recommendServices(services, "everyday");
    expect(picks.some((s) => s.id === "svc_shellac")).toBe(true);
  });

  it("compares methods using catalog prices", () => {
    const text = compareMethods(services);
    expect(text).toContain("Shellac");
    expect(text).toContain("42,00");
    expect(text).toContain("BIAB");
    expect(text).not.toContain("->");
    expect(text).not.toMatch(/Shellac \(/);
  });

  it("lists every salon service in the catalog answer", () => {
    const text = buildCatalogOverview(services);
    expect(text).toContain("Shellac");
    expect(text).toContain("BIAB Naturnagelverstärkung");
    expect(text).toContain("Acryl Neumodellage mit Verlängerung");
    expect(text).toContain("42,00");
    expect(text).toContain("68,00");
  });

  it("builds a recommendation reply with suggestions", () => {
    const reply = buildRecommendationReply(services, "natural");
    expect(reply.suggestions.length).toBeGreaterThan(0);
    expect(reply.text.toLowerCase()).toMatch(/biab|shellac|verst/);
  });
});
