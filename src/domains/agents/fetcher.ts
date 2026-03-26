/**
 * Agents Domain — Real-first, fallback-safe fetchers.
 * Todos tentam /api/* primeiro; fallback vazio apenas em erro.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { Agent, AgentNode } from "./types";
import type { DomainFetcher } from "../types";

export const fetchAgents: DomainFetcher<Agent[]> = createRealFirstFetcher({
  endpoint: "/agents",
  fallbackData: [],
});

export const fetchAgentTree: DomainFetcher<AgentNode[]> = createRealFirstFetcher({
  endpoint: "/agents/tree",
  fallbackData: [],
});
