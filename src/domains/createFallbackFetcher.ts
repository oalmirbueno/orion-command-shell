/**
 * createFallbackFetcher — Creates a DomainFetcher backed by local fallback data.
 *
 * This is the development-mode data provider. When real API integration is added,
 * each domain replaces its fetcher with an actual API call — no other changes needed.
 *
 * Usage:
 *   const fetchAgents = createFallbackFetcher(FALLBACK_AGENTS);
 *   // Later, replace with:
 *   const fetchAgents = () => api.get<Agent[]>('/agents').then(toResult);
 */

import type { DomainFetcher, DomainResult, DataSource } from "./types";

export function createFallbackFetcher<T>(
  fallbackData: T,
  source: DataSource = "fallback"
): DomainFetcher<T> {
  return async () => {
    const result: DomainResult<T> = {
      data: fallbackData,
      source,
      timestamp: new Date(),
    };
    return result;
  };
}
