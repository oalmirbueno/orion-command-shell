/**
 * System Domain — Fetchers (real-first + fallback-safe)
 *
 * Primary: fetchSystemPage — unified page model for SystemPage.
 * Secondary: individual fetchers for Home page widgets.
 *
 * Todos tentam /api/* primeiro; fallback vazio apenas em erro.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { SystemPageData, CommandData, HealthService } from "./types";
import type { DomainFetcher } from "../types";

/** Empty command status — fallback honesto */
const EMPTY_COMMAND: CommandData = {
  systemState: "nominal",
  metrics: [
    { label: "Disponib.", value: "—", icon: "Clock" },
    { label: "Agentes", value: "—", icon: "Bot" },
    { label: "Sessões", value: "—", icon: "Activity" },
    { label: "Tokens/h", value: "—", icon: "Zap" },
  ],
};

const EMPTY_SYSTEM_PAGE: SystemPageData = {
  header: {
    overallStatus: "healthy",
    host: "—",
    uptime: "—",
    lastCheck: "—",
  },
  gauges: [],
  services: [],
  signals: [],
  uptimeDays: [],
  uptimePercent: "—",
};

/** Unified page model — used by SystemPage */
export const fetchSystemPage: DomainFetcher<SystemPageData> = createRealFirstFetcher({
  endpoint: "/system",
  fallbackData: EMPTY_SYSTEM_PAGE,
});

/** Home widget fetchers */
export const fetchCommandStatus: DomainFetcher<CommandData> = createRealFirstFetcher({
  endpoint: "/system/command",
  fallbackData: EMPTY_COMMAND,
});

export const fetchHealthServices: DomainFetcher<HealthService[]> = createRealFirstFetcher({
  endpoint: "/system/health",
  fallbackData: [],
});

export const fetchSystemServices: DomainFetcher<SystemPageData["services"]> = createRealFirstFetcher({
  endpoint: "/system/services",
  fallbackData: [],
});
