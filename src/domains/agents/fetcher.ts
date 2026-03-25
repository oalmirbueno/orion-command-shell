import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_AGENT_TREE, FALLBACK_AGENTS } from "./mocks";
import type { AgentNode, Agent } from "./types";
import type { DomainFetcher } from "../types";

export const fetchAgentTree: DomainFetcher<AgentNode[]> = createFallbackFetcher(FALLBACK_AGENT_TREE);
export const fetchAgents: DomainFetcher<Agent[]> = createFallbackFetcher(FALLBACK_AGENTS);
