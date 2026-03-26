/**
 * System Domain — Fetchers (real-first + fallback-safe)
 *
 * Primary: fetchSystemPage — unified page model for SystemPage.
 * Legacy: individual fetchers used by Home page components.
 *
 * === INTEGRATION GUIDE ===
 * 1. Set VITE_ORION_API_URL in .env
 * 2. GET /system → SystemPageData JSON
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_SYSTEM_PAGE } from "./mocks";
import type { SystemPageData, CommandData, HealthService } from "./types";
import type { DomainFetcher } from "../types";

/** Unified page model — used by SystemPage */
export const fetchSystemPage: DomainFetcher<SystemPageData> = createRealFirstFetcher<SystemPageData, SystemPageData>({
  endpoint: "/system",
  fallbackData: FALLBACK_SYSTEM_PAGE,
});

/** Empty command status — production fallback */
const EMPTY_COMMAND: CommandData = {
  systemState: "nominal",
  metrics: [
    { label: "Disponib.", value: "—", icon: "Clock" },
    { label: "Agentes", value: "—", icon: "Bot" },
    { label: "Sessões", value: "—", icon: "Activity" },
    { label: "Tokens/h", value: "—", icon: "Zap" },
  ],
};

export const fetchCommandStatus: DomainFetcher<CommandData> = createFallbackFetcher(EMPTY_COMMAND);
export const fetchHealthServices: DomainFetcher<HealthService[]> = createFallbackFetcher([]);
export const fetchSystemServices: DomainFetcher<SystemPageData["services"]> = createFallbackFetcher([]);
