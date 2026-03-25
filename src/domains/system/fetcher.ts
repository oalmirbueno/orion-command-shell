/**
 * System Domain — Fetcher (real-first + fallback-safe)
 *
 * Unified page model: a single fetch returns all data needed by SystemPage.
 *
 * === INTEGRATION GUIDE ===
 * 1. Set VITE_ORION_API_URL in .env
 * 2. Ensure GET /system returns SystemPageData JSON
 * 3. If your API returns a different shape, add a transform.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_SYSTEM_PAGE } from "./mocks";
import type { SystemPageData } from "./types";
import type { DomainFetcher } from "../types";

export const fetchSystemPage: DomainFetcher<SystemPageData> = createRealFirstFetcher<SystemPageData, SystemPageData>({
  endpoint: "/system",
  fallbackData: FALLBACK_SYSTEM_PAGE,
});
