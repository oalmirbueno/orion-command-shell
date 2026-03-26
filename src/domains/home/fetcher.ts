// Home / Command — Fetcher Agregador (real-first + fallback-safe)
//
// Estratégia:
//   1. Tenta /api/home (endpoint agregado do OpenClaw) primeiro
//   2. Se indisponível, compõe a partir dos fetchers individuais dos domínios
//   3. Fallback vazio honesto apenas quando nenhuma fonte responde
//
// Home não duplica lógica — ela compõe resultados dos domínios base.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { fetchCommandStatus, fetchHealthServices } from "../system/fetcher";
import { fetchAttentionItems, fetchBriefing } from "../activity/fetcher";
import { fetchAgentTree } from "../agents/fetcher";
import type { HomePageData } from "./types";
import type { DomainFetcher, DomainResult, DataSource } from "../types";
import type { Operation } from "../operations/types";

const EMPTY_HOME: HomePageData = {
  command: {
    systemState: "nominal",
    metrics: [
      { label: "Disponib.", value: "—", icon: "Clock" },
      { label: "Agentes", value: "—", icon: "Bot" },
      { label: "Sessões", value: "—", icon: "Activity" },
      { label: "Tokens/h", value: "—", icon: "Zap" },
    ],
  },
  attention: [],
  liveOps: [],
  agents: [],
  health: [],
  briefing: [],
};

// Fetcher do endpoint agregado (se o OpenClaw expor /api/home)
const fetchHomeAggregated = createRealFirstFetcher<HomePageData, HomePageData>({
  endpoint: "/home",
  fallbackData: EMPTY_HOME,
});

// Fetcher de live operations (domínio operations)
const fetchLiveOps = createRealFirstFetcher<Operation[], Operation[]>({
  endpoint: "/operations/live",
  fallbackData: [],
});

/**
 * Fetcher principal da Home.
 *
 * Tenta o endpoint agregado /api/home primeiro.
 * Se vier vazio (fallback), compõe a partir dos domínios individuais.
 * Isso garante que a Home funciona tanto com endpoint agregado
 * quanto com composição granular.
 */
export const fetchHomePage: DomainFetcher<HomePageData> = async (): Promise<DomainResult<HomePageData>> => {
  // Tentativa 1: endpoint agregado
  const aggregated = await fetchHomeAggregated();

  if (aggregated.source === "api") {
    return aggregated;
  }

  // Tentativa 2: composição a partir dos domínios individuais
  const [command, attention, liveOps, agents, health, briefing] = await Promise.all([
    fetchCommandStatus(),
    fetchAttentionItems(),
    fetchLiveOps(),
    fetchAgentTree(),
    fetchHealthServices(),
    fetchBriefing(),
  ]);

  // Determina source: se qualquer domínio respondeu da API, marca como "api"
  const sources = [command, attention, liveOps, agents, health, briefing];
  const anyFromApi = sources.some(r => r.source === "api");
  const resolvedSource: DataSource = anyFromApi ? "api" : "fallback";

  const data: HomePageData = {
    command: command.data,
    attention: attention.data,
    liveOps: liveOps.data,
    agents: agents.data,
    health: health.data,
    briefing: briefing.data,
  };

  return {
    data,
    source: resolvedSource,
    timestamp: new Date(),
  };
};
