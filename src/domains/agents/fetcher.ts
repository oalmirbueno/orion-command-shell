/**
 * Agents Domain — Real-first, fallback-safe fetchers.
 *
 * === HOW TO CONNECT A REAL API ===
 *
 * 1. Set VITE_ORION_API_URL in your .env:
 *      VITE_ORION_API_URL=https://api.your-backend.com
 *
 * 2. Ensure GET /agents returns JSON matching Agent[].
 *
 * 3. That's it. The fetcher will try the real endpoint first.
 *    If it fails, fallback data is used and source is marked "fallback".
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_AGENTS, FALLBACK_AGENT_TREE } from "./mocks";
import type { Agent, AgentNode } from "./types";
import type { DomainFetcher } from "../types";

export const fetchAgents: DomainFetcher<Agent[]> = createRealFirstFetcher({
  endpoint: "/agents",
  fallbackData: FALLBACK_AGENTS,
});

export const fetchAgentTree: DomainFetcher<AgentNode[]> = createRealFirstFetcher({
  endpoint: "/agents/tree",
  fallbackData: FALLBACK_AGENT_TREE,
});
