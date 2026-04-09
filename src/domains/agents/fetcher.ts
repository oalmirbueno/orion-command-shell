/**
 * Agents Domain — Fetchers (real-first + fallback-safe)
 *
 * Fully dynamic — no hardcoded agent names or IDs.
 * Backend provides structuralStatus, official, lifecycle, etc.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { AgentInfo, AgentView, AgentNode, AgentStatus, AgentTier, AgentStructuralStatus, AgentLifecycle } from "./types";
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
  // Dynamic discovery fields
  role?: string;
  exposure?: string;
  level?: string;
  parentAgent?: string | null;
  topicId?: string | null;
  topicIds?: string[];
  official?: boolean;
  lifecycle?: string;
  structuralStatus?: string;
  runtimeStatus?: string;
  lastHandoff?: string | null;
  lastNextStep?: string | null;
  bindingStatus?: string;
  tier?: string;
}

interface AgentsApiResponse {
  agents: RealAgent[];
}

// ═══════════════════════════════════════════════════════
// Transform real → canonical (fully dynamic)
// ═══════════════════════════════════════════════════════

function inferTier(raw: RealAgent): AgentTier {
  if (raw.tier) {
    const t = raw.tier.toLowerCase();
    if (t === "orchestrator") return "orchestrator";
    if (t === "support") return "support";
    return "core";
  }
  // Infer from level/role if tier not provided
  if (raw.level === "orchestrator" || raw.role?.toLowerCase().includes("supervisor")) return "orchestrator";
  if (raw.level === "support" || raw.role?.toLowerCase().includes("suporte")) return "support";
  return "core";
}

function inferStructuralStatus(raw: RealAgent): AgentStructuralStatus {
  if (raw.structuralStatus) {
    const s = raw.structuralStatus.toLowerCase();
    if (s === "active" || s === "official") return "active";
    if (s === "legacy" || s === "deprecated") return "legacy";
  }
  if (raw.official === true) return "active";
  if (raw.official === false) return "legacy";
  if (raw.lifecycle === "deprecated") return "legacy";
  // Default: active
  return "active";
}

function inferLifecycle(raw: RealAgent): AgentLifecycle {
  if (raw.lifecycle) {
    const l = raw.lifecycle.toLowerCase();
    if (l === "production") return "production";
    if (l === "staging") return "staging";
    if (l === "deprecated") return "deprecated";
  }
  return "unknown";
}

function realToAgentInfo(raw: RealAgent): AgentInfo {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role || raw.model?.split("/")[0] || "agent",
    tier: inferTier(raw),
    model: raw.model || "unknown",
    enabled: true,
    online: raw.status === "online" || raw.runtimeStatus === "online",
    activeSessions: raw.activeSessions || 0,
    totalTokensToday: 0,
    uptimePercent: (raw.status === "online" || raw.runtimeStatus === "online") ? 99.9 : 0,
    cpuPercent: 0,
    lastActivityAt: raw.lastActivity || new Date().toISOString(),
    currentTask: null,
    currentTaskStartedAt: null,
    dependsOn: [],
    feeds: [],
    alertCount: 0,
    // Dynamic discovery fields
    exposure: raw.exposure || "unknown",
    level: raw.level || "unknown",
    parentAgent: raw.parentAgent || null,
    topicId: raw.topicId || null,
    topicIds: raw.topicIds || [],
    official: raw.official ?? true,
    lifecycle: inferLifecycle(raw),
    structuralStatus: inferStructuralStatus(raw),
    runtimeStatus: raw.runtimeStatus || raw.status || "unknown",
    lastHandoff: raw.lastHandoff || null,
    lastNextStep: raw.lastNextStep || null,
    bindingStatus: raw.bindingStatus || "unknown",
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
    // Dynamic discovery fields
    official: a.official ?? true,
    structuralStatus: a.structuralStatus || "active",
    lifecycle: a.lifecycle || "unknown",
    parentAgent: a.parentAgent || null,
    exposure: a.exposure || "unknown",
    level: a.level || "unknown",
    topicId: a.topicId || null,
    bindingStatus: a.bindingStatus || "unknown",
    lastHandoff: a.lastHandoff || null,
    lastNextStep: a.lastNextStep || null,
  };
}

export const fetchAgents: DomainFetcher<AgentView[]> = async (): Promise<DomainResult<AgentView[]>> => {
  const baseFetcher = createRealFirstFetcher<AgentsApiResponse | AgentInfo[], AgentInfo[]>({
    endpoint: "/agents",
    fallbackData: [],
    transform: (raw) => {
      if (Array.isArray(raw)) return raw.map(r => realToAgentInfo(r as any));
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
    id: a.id,
    name: a.name,
    role: a.role,
    tier: a.tier,
    status: a.status,
    load: a.load,
    official: a.official,
    structuralStatus: a.structuralStatus,
    parentAgent: a.parentAgent,
    exposure: a.exposure,
    level: a.level,
    activeSessions: a.sessions,
  }));
  return { data: nodes, source: result.source, timestamp: result.timestamp };
};
