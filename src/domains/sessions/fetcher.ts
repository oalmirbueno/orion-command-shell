/**
 * Sessions Domain — Fetcher (PILOT: real-first + fallback-safe)
 *
 * This is the first Orion domain using createRealFirstFetcher.
 * It serves as the reference implementation for all other domains.
 *
 * === INTEGRATION GUIDE ===
 *
 * To connect real sessions data:
 *
 * 1. Set VITE_ORION_API_URL in .env (e.g. https://api.example.com)
 * 2. Ensure GET /sessions returns Session[] JSON
 * 3. If your API returns a different shape, add a transform:
 *
 *    export const fetchSessions = createRealFirstFetcher<ApiResponse, Session[]>({
 *      endpoint: "/sessions",
 *      fallbackData: FALLBACK_SESSIONS,
 *      transform: (raw) => raw.data.sessions,
 *    });
 *
 * When VITE_ORION_API_URL is not set, fallback data is used automatically.
 * No UI changes needed — useOrionData handles all states.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_SESSIONS } from "./mocks";
import type { Session } from "./types";
import type { DomainFetcher } from "../types";

export const fetchSessions: DomainFetcher<Session[]> = createRealFirstFetcher<Session[], Session[]>({
  endpoint: "/sessions",
  fallbackData: FALLBACK_SESSIONS,
});
