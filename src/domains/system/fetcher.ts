/**
 * System Domain — Data Fetchers
 *
 * Currently backed by fallback data. To integrate with a real API:
 *
 *   export const fetchCommandStatus: DomainFetcher<CommandData> = async () => {
 *     const res = await api.get('/system/status');
 *     return { data: res.data, source: 'api', timestamp: new Date() };
 *   };
 */

import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_COMMAND, FALLBACK_HEALTH, FALLBACK_SERVICES } from "./mocks";
import type { CommandData, HealthService, SystemService } from "./types";
import type { DomainFetcher } from "../types";

export const fetchCommandStatus: DomainFetcher<CommandData> = createFallbackFetcher(FALLBACK_COMMAND);
export const fetchHealthServices: DomainFetcher<HealthService[]> = createFallbackFetcher(FALLBACK_HEALTH);
export const fetchSystemServices: DomainFetcher<SystemService[]> = createFallbackFetcher(FALLBACK_SERVICES);
