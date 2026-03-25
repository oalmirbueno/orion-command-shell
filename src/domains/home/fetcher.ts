/**
 * Home / Command — Unified Fetcher (real-first + fallback-safe)
 *
 * === INTEGRATION GUIDE ===
 * 1. Set VITE_ORION_API_URL in .env
 * 2. GET /home → HomePageData JSON
 * 3. All Home components will receive real data automatically.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_HOME_PAGE } from "./mocks";
import type { HomePageData } from "./types";
import type { DomainFetcher } from "../types";

export const fetchHomePage: DomainFetcher<HomePageData> = createRealFirstFetcher({
  endpoint: "/home",
  fallbackData: FALLBACK_HOME_PAGE,
});
