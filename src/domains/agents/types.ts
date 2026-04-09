/**
 * Agents Domain — Tipos Canônicos
 *
 * Shape baseado na rota local do OpenClaw (/api/agents).
 * Totalmente dinâmico — sem hardcode de agentes específicos.
 */

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type AgentTier = "orchestrator" | "core" | "support";
export type AgentStructuralStatus = "active" | "legacy" | "unknown";
export type AgentLifecycle = "production" | "staging" | "deprecated" | "unknown";

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
  // Dynamic discovery fields from backend
  exposure?: string;
  level?: string;
  parentAgent?: string | null;
  topicId?: string | null;
  topicIds?: string[];
  official?: boolean;
  lifecycle?: AgentLifecycle;
  structuralStatus?: AgentStructuralStatus;
  runtimeStatus?: string;
  lastHandoff?: string | null;
  lastNextStep?: string | null;
  bindingStatus?: string;
}

/** /api/agents/tree — shape simplificado para mapa */
export interface AgentNode {
  id: string;
  name: string;
  role: string;
  tier: AgentTier;
  status: AgentStatus;
  load: number;
  // Dynamic fields
  official: boolean;
  structuralStatus: AgentStructuralStatus;
  parentAgent: string | null;
  exposure?: string;
  level?: string;
  activeSessions: number;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type AgentStatus = "active" | "idle" | "offline";

export type AgentOperationalStatus = "active" | "paused" | "readonly";
export type AgentScopeType = "global" | "dm" | "topic" | "mixed";

/**
 * GET /api/agents/:id — perfil/configuração completa do agente.
 */
export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description?: string;
  soul?: string;
  objective?: string;
  personality?: string;
  scope?: string;
  behavior?: string;
  instructions?: string;
  operationalStatus?: AgentOperationalStatus;
  scopeType?: AgentScopeType;
  topicIds?: string[];
  dmEnabled?: boolean;
  groupEnabled?: boolean;
}

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
  // Dynamic discovery fields
  official: boolean;
  structuralStatus: AgentStructuralStatus;
  lifecycle: AgentLifecycle;
  parentAgent: string | null;
  exposure: string;
  level: string;
  topicId: string | null;
  bindingStatus: string;
  lastHandoff: string | null;
  lastNextStep: string | null;
}
