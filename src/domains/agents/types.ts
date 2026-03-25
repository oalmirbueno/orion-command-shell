export type AgentStatus = "active" | "idle" | "offline";
export type AgentTier = "orchestrator" | "core" | "support";

export interface AgentNode {
  name: string;
  role: string;
  tier: AgentTier;
  status: AgentStatus;
  load: number;
}

export interface Agent {
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
}
