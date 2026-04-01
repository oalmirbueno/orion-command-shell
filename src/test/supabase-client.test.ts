import { describe, it, expect } from "vitest";
import { supabaseConfigured } from "@/integrations/supabase/client";

describe("Supabase client", () => {
  it("reports unconfigured when env vars are missing", () => {
    // In test env, VITE_SUPABASE_URL is not set
    expect(supabaseConfigured).toBe(false);
  });
});
