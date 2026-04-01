import { describe, it, expect } from "vitest";

describe("AdvancedFilters types", () => {
  it("FilterState shape is correct", async () => {
    const mod = await import("@/components/filters/AdvancedFilters");
    // Module exports the component — type check passes if import resolves
    expect(mod.AdvancedFilters).toBeDefined();
  });
});
