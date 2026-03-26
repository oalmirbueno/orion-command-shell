/**
 * Agents Domain — Tipos Canônicos
 *
 * Shape baseado na rota local do OpenClaw (/api/agents).
 * Este é o formato de referência do projeto-base.
 */

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type AgentTier = "orchestrator" | "core" | "support";

/** /api/agents — dados brutos de cada agente */
export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  tier: AgentTier;
  model: string;
  enabled: boolean;
  online: boolean;
  activeSessions: number;
  totalTokensToday: number;
  uptimePercent: number;
  cpuPercent: number;
  lastActivityAt: string;
  currentTask: string | null;
  currentTaskStartedAt: string | null;
  dependsOn: string[];
  feeds: string[];
  alertCount: number;
}

/** /api/agents/tree — shape simplificado para mapa */
export interface AgentNode {
  name: string;
  role: string;
  tier: AgentTier;
  status: AgentStatus;
  load: number;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type AgentStatus = "active" | "idle" | "offline";

export interface AgentView {
  id: string;
  name: string;
  role: string;
  tier: AgentTier;
  model: string;
  status: AgentStatus;
  sessions: number;
  lastActivity: string;
  lastActivityLabel: string;
  load: number;
  tokensToday: string;
  availability: string;
  currentTask: string;
  currentTaskAge: string;
  dependsOn: string[];
  feeds: string[];
  alertCount: number;
}
