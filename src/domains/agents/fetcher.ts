/**
 * Agents Domain — Fetchers (real-first + fallback-safe)
 *
 * Real API shape: { agents: [{ id, name, emoji, color, model, status, lastActivity, activeSessions }] }
 * Missing fields from canonical are filled with sensible defaults.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { AgentInfo, AgentView, AgentNode, AgentStatus, AgentTier } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shape
// ═══════════════════════════════════════════════════════

interface RealAgent {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  model?: string;
  workspace?: string;
  dmPolicy?: string;
  status?: string;
  lastActivity?: string;
  activeSessions?: number;
  allowAgents?: string[];
}

interface AgentsApiResponse {
  agents: RealAgent[];
}

// ═══════════════════════════════════════════════════════
// Transform real → canonical
// ═══════════════════════════════════════════════════════

function realToAgentInfo(raw: RealAgent): AgentInfo {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.model?.split("/")[0] || "agent",
    tier: "core" as AgentTier,
    model: raw.model || "unknown",
    enabled: true,
    online: raw.status === "online",
    activeSessions: raw.activeSessions || 0,
    totalTokensToday: 0,
    uptimePercent: raw.status === "online" ? 99.9 : 0,
    cpuPercent: 0,
    lastActivityAt: raw.lastActivity || new Date().toISOString(),
    currentTask: null,
    currentTaskStartedAt: null,
    dependsOn: [],
    feeds: [],
    alertCount: 0,
  };
}

// ═══════════════════════════════════════════════════════
// Canonical → View transforms
// ═══════════════════════════════════════════════════════

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
  const baseFetcher = createRealFirstFetcher<AgentsApiResponse | AgentInfo[], AgentInfo[]>({
    endpoint: "/agents",
    fallbackData: [],
    transform: (raw) => {
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object" && "agents" in raw) {
        return (raw as AgentsApiResponse).agents.map(realToAgentInfo);
      }
      return [];
    },
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toAgentView),
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchAgentTree: DomainFetcher<AgentNode[]> = async (): Promise<DomainResult<AgentNode[]>> => {
  const result = await fetchAgents();
  const nodes: AgentNode[] = result.data.map(a => ({
    name: a.name,
    role: a.role,
    tier: a.tier,
    status: a.status,
    load: a.load,
  }));
  return { data: nodes, source: result.source, timestamp: result.timestamp };
};
