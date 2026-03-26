// Home / Command — Fetcher Agregador (real-first + derivação client-side)
//
// Estratégia:
//   1. Tenta /api/home (endpoint agregado do OpenClaw) primeiro
//   2. Se indisponível, compõe a partir dos domínios que já têm derivação
//   3. Fallback vazio honesto apenas quando nenhuma fonte responde
//
// Home não duplica lógica — ela compõe resultados dos domínios base.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { fetchSystemPage } from "../system/fetcher";
import { fetchActivityPage } from "../activity/fetcher";
import { fetchAgents } from "../agents/fetcher";
import { fetchSessions } from "../sessions/fetcher";
import { fetchOperationsPage } from "../operations/fetcher";
import type { HomePageData } from "./types";
import type { CommandData, HealthService, SystemState } from "../system/types";
import type { AttentionItem, BriefingItem, AttentionPriority } from "../activity/types";
import type { Operation } from "../operations/types";
import type { AgentNode } from "../agents/types";
import type { DomainFetcher, DomainResult, DataSource } from "../types";

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

// Helper to safely extract result from Promise.allSettled
function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Fetcher principal da Home.
 *
 * Tenta o endpoint agregado /api/home primeiro.
 * Se vier vazio (fallback), compõe a partir dos domínios individuais.
 * Usa Promise.allSettled para resiliência — falhas parciais não travam a Home.
 */
export const fetchHomePage: DomainFetcher<HomePageData> = async (): Promise<DomainResult<HomePageData>> => {
  // Tentativa 1: endpoint agregado
  const aggregated = await fetchHomeAggregated();

  if (aggregated.source === "api") {
    return aggregated;
  }

  // Tentativa 2: composição resiliente a partir dos domínios individuais
  const results = await Promise.allSettled([
    fetchSystemPage(),
    fetchActivityPage(),
    fetchAgents(),
    fetchSessions(),
    fetchOperationsPage(),
  ]);

  const emptySystem = { data: { header: { overallStatus: "healthy" as const, host: "—", uptime: "—", lastCheck: "—" }, gauges: [], services: [], signals: [], uptimeDays: [], uptimePercent: "—" }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptyActivity = { data: { events: [], summary: { total: 0, critical: 0, warning: 0, resolved: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptyAgents = { data: [] as any[], source: "fallback" as DataSource, timestamp: new Date() };
  const emptySessions = { data: [] as any[], source: "fallback" as DataSource, timestamp: new Date() };
  const emptyOps = { data: { tasks: [], timeline: [], liveOps: [], summary: { total: 0, running: 0, queued: 0, done: 0, failed: 0, criticalActive: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };

  const systemResult = settled(results[0], emptySystem);
  const activityResult = settled(results[1], emptyActivity);
  const agentsResult = settled(results[2], emptyAgents);
  const sessionsResult = settled(results[3], emptySessions);
  const operationsResult = settled(results[4], emptyOps);

  // ── Command Status (de System) ──
  const sys = systemResult.data;
  const systemState: SystemState =
    sys.header.overallStatus === "critical" ? "critical" :
    sys.header.overallStatus === "degraded" ? "degraded" : "nominal";

  const sessionsData = sessionsResult.data;
  const runningSessionsCount = Array.isArray(sessionsData) ? sessionsData.filter((s: any) => s.status === "running").length : 0;
  const totalSessionsCount = Array.isArray(sessionsData) ? sessionsData.length : 0;

  const command: CommandData = {
    systemState,
    metrics: [
      { label: "Disponib.", value: sys.uptimePercent || "—", icon: "Clock" },
      { label: "Agentes", value: agentsResult.data.length > 0 ? `${agentsResult.data.filter((a: any) => a.status !== "offline").length}/${agentsResult.data.length}` : "—", icon: "Bot" },
      { label: "Sessões", value: totalSessionsCount > 0 ? `${runningSessionsCount}/${totalSessionsCount}` : "—", icon: "Activity" },
      { label: "Tokens/h", value: "—", icon: "Zap" },
    ],
  };

  // ── Attention Items (de Activity — eventos críticos/warning) ──
  const attention: AttentionItem[] = (activityResult.data.events || [])
    .filter((e: any) => e.priority === "critical" || e.priority === "warning")
    .slice(0, 5)
    .map((e: any) => ({
      id: e.id,
      priority: (e.priority === "critical" ? "critical" : "warning") as AttentionPriority,
      title: e.title,
      context: e.description || e.source,
      timestamp: e.timeAgo,
    }));

  // ── Live Operations (de Operations) ──
  const liveOps: Operation[] = operationsResult.data.liveOps || [];

  // ── Agents Hierarchy (de Agents — transformar AgentView → AgentNode) ──
  const agents: AgentNode[] = (agentsResult.data || []).map((a: any) => ({
    name: a.name,
    role: a.role,
    tier: a.tier,
    status: a.status,
    load: a.load,
  }));

  // ── Health Services (de System — processos como health proxy) ──
  const health: HealthService[] = (sys.services || []).slice(0, 6).map((svc: any) => ({
    name: svc.name,
    status: svc.status === "running" ? "healthy" as const :
            svc.status === "stopped" ? "down" as const : "degraded" as const,
    responseTime: svc.cpu,
    uptime: svc.uptime,
  }));

  // ── Briefing (de Activity — últimos eventos como log operacional) ──
  const briefing: BriefingItem[] = (activityResult.data.events || [])
    .slice(0, 8)
    .map((e: any) => ({
      time: e.time,
      content: e.title,
      source: e.source,
    }));

  // Determina source
  const allResults = [systemResult, activityResult, agentsResult, sessionsResult, operationsResult];
  const anyFromApi = allResults.some(r => r.source === "api");
  const resolvedSource: DataSource = anyFromApi ? "api" : "fallback";

  const data: HomePageData = { command, attention, liveOps, agents, health, briefing };

  return {
    data,
    source: resolvedSource,
    timestamp: new Date(),
  };
};
