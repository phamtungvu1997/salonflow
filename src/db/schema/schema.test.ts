import { describe, expect, it } from "vitest";

import * as schema from "./index";

describe("M04 schema exports", () => {
  it("exposes core booking and catalog tables", () => {
    expect(schema.salons).toBeDefined();
    expect(schema.staff).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.services).toBeDefined();
    expect(schema.customers).toBeDefined();
    expect(schema.appointments).toBeDefined();
    expect(schema.resourceAllocations).toBeDefined();
  });
});
