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

/** Legacy individual fetchers — used by Home page components */
const FALLBACK_COMMAND: CommandData = {
  systemState: "degraded",
  metrics: [
    { label: "Uptime", value: "99.97%", icon: "Clock" },
    { label: "Agentes", value: "7/10", icon: "Bot" },
    { label: "Sessões", value: "5 ativas", icon: "Activity" },
    { label: "Tokens/h", value: "142k", icon: "Zap" },
  ],
};

const FALLBACK_HEALTH: HealthService[] = [
  { name: "API Gateway", status: "healthy", responseTime: "12ms", uptime: "99.99%" },
  { name: "Core Engine", status: "healthy", responseTime: "8ms", uptime: "99.98%" },
  { name: "Data Pipeline", status: "degraded", responseTime: "187ms", uptime: "99.91%" },
  { name: "Auth Service", status: "healthy", responseTime: "15ms", uptime: "100%" },
  { name: "ML Processor", status: "healthy", responseTime: "34ms", uptime: "99.95%" },
  { name: "Cache Layer", status: "healthy", responseTime: "2ms", uptime: "100%" },
  { name: "Queue Service", status: "healthy", responseTime: "5ms", uptime: "99.99%" },
  { name: "Storage", status: "healthy", responseTime: "22ms", uptime: "99.97%" },
];

export const fetchCommandStatus: DomainFetcher<CommandData> = createFallbackFetcher(FALLBACK_COMMAND);
export const fetchHealthServices: DomainFetcher<HealthService[]> = createFallbackFetcher(FALLBACK_HEALTH);
export const fetchSystemServices: DomainFetcher<SystemPageData["services"]> = createFallbackFetcher(FALLBACK_SYSTEM_PAGE.services);
