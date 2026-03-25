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
  /** Current task description */
  currentTask: string;
  /** How long ago the current task started */
  currentTaskAge: string;
  /** Agent names this agent depends on */
  dependsOn: string[];
  /** Agent names this agent feeds data to */
  feeds: string[];
  /** Number of active alerts */
  alertCount: number;
}
