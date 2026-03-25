/**
 * createRealFirstFetcher — Real-first, fallback-safe data fetching.
 *
 * Strategy:
 *   1. If a real API URL is configured, attempt the real fetch first.
 *   2. If the real fetch fails (network error, non-2xx, timeout), fall back to local data.
 *   3. If no API URL is configured, use fallback directly (no network request).
 *
 * This is the standard pattern for all Orion domains.
 * Sessions is the pilot — replicate this for agents, system, etc.
 *
 * === HOW TO CONNECT A REAL API ===
 *
 * 1. Set VITE_ORION_API_URL in your .env:
 *      VITE_ORION_API_URL=https://api.your-backend.com
 *
 * 2. Ensure your endpoint returns JSON matching the domain's type (e.g. Session[]).
 *
 * 3. That's it. The fetcher will automatically try the real endpoint first.
 *    If it fails, fallback data is used and source is marked "fallback".
 *
 * === CUSTOMIZING THE RESPONSE TRANSFORM ===
 *
 * If your API returns a different shape, pass a `transform` function:
 *
 *   createRealFirstFetcher({
 *     endpoint: "/sessions",
 *     fallbackData: FALLBACK_SESSIONS,
 *     transform: (raw) => raw.data.items,  // extract from wrapper
 *   });
 */

import { isApiConfigured, apiUrl } from "./api";
import type { DomainFetcher, DomainResult, DataSource } from "./types";

interface RealFirstFetcherOptions<TRaw, TDomain> {
  /** API path appended to VITE_ORION_API_URL (e.g. "/sessions") */
  endpoint: string;
  /** Local fallback data used when API is unavailable */
  fallbackData: TDomain;
  /** Optional transform from raw API response to domain type */
  transform?: (raw: TRaw) => TDomain;
  /** Request timeout in ms (default: 8000) */
  timeout?: number;
}

export function createRealFirstFetcher<TRaw = unknown, TDomain = TRaw>({
  endpoint,
  fallbackData,
  transform,
  timeout = 8000,
}: RealFirstFetcherOptions<TRaw, TDomain>): DomainFetcher<TDomain> {
  return async (): Promise<DomainResult<TDomain>> => {
    // If no API is configured, go straight to fallback — no network attempt
    if (!isApiConfigured()) {
      return {
        data: fallbackData,
        source: "fallback" as DataSource,
        timestamp: new Date(),
      };
    }

    // Attempt real fetch with timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(apiUrl(endpoint), {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }

      const raw = (await response.json()) as TRaw;
      const data = transform ? transform(raw) : (raw as unknown as TDomain);

      return {
        data,
        source: "api" as DataSource,
        timestamp: new Date(),
      };
    } catch {
      // Real fetch failed — use fallback silently
      console.debug(`[Orion] ${endpoint}: API unavailable, using fallback`);
      return {
        data: fallbackData,
        source: "fallback" as DataSource,
        timestamp: new Date(),
      };
    }
  };
}
