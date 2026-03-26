/**
 * Agents Domain — Fetchers (real-first + fallback-safe)
 *
 * Shape canônico: AgentInfo (dados brutos do OpenClaw)
 * Shape de UI: AgentView (derivado via transform)
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { AgentInfo, AgentView, AgentNode, AgentStatus } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

function deriveStatus(agent: AgentInfo): AgentStatus {
  if (!agent.online || !agent.enabled) return "offline";
  if (agent.activeSessions > 0) return "active";
  return "idle";
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatTimeAgo(iso: string): { label: string; relative: string } {
  if (!iso) return { label: "—", relative: "—" };
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return { label: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), relative: "agora" };
  if (mins < 60) return { label: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), relative: `${mins}min atrás` };
  const hrs = Math.round(mins / 60);
  return { label: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), relative: `${hrs}h atrás` };
}

function toAgentView(a: AgentInfo): AgentView {
  const status = deriveStatus(a);
  const lastAct = formatTimeAgo(a.lastActivityAt);
  const taskAge = a.currentTaskStartedAt ? formatTimeAgo(a.currentTaskStartedAt).relative : "—";

  return {
    id: a.id,
    name: a.name,
    role: a.role,
    tier: a.tier,
    model: a.model,
    status,
    sessions: a.activeSessions,
    lastActivity: lastAct.label,
    lastActivityLabel: lastAct.relative,
    load: Math.round(a.cpuPercent),
    tokensToday: formatTokens(a.totalTokensToday),
    availability: `${a.uptimePercent.toFixed(1)}%`,
    currentTask: a.currentTask || "Sem tarefa ativa",
    currentTaskAge: taskAge,
    dependsOn: a.dependsOn,
    feeds: a.feeds,
    alertCount: a.alertCount,
  };
}

export const fetchAgents: DomainFetcher<AgentView[]> = async (): Promise<DomainResult<AgentView[]>> => {
  const baseFetcher = createRealFirstFetcher<AgentInfo[], AgentInfo[]>({
    endpoint: "/agents",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toAgentView),
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchAgentTree: DomainFetcher<AgentNode[]> = createRealFirstFetcher({
  endpoint: "/agents/tree",
  fallbackData: [],
});
