// Activity Domain — Tipos Canônicos
//
// Shape baseado na rota local do OpenClaw (/api/activities).

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type ActivityType = "agent.task" | "agent.error" | "system.start" | "system.stop" | "system.health"
  | "pipeline.run" | "pipeline.fail" | "session.start" | "session.end" | "deploy" | "security.alert" | "cron.run";

export type ActivityLevel = "critical" | "error" | "warn" | "info" | "debug";

// /api/activities — eventos de atividade do runtime
export interface ActivityInfo {
  id: string;
  type: ActivityType;
  level: ActivityLevel;
  message: string;
  detail: string | null;
  source: string;
  agentId: string | null;
  sessionId: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type EventPriority = "critical" | "warning" | "success" | "info" | "neutral";
export type EventCategory = "agent" | "system" | "pipeline" | "security" | "session" | "deploy";

export interface ActivityEvent {
  id: string;
  time: string;
  timeAgo: string;
  priority: EventPriority;
  category: EventCategory;
  title: string;
  description: string;
  source: string;
}

export interface ActivityPageData {
  events: ActivityEvent[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    resolved: number;
  };
}

// Tipos para widgets da Home (mantidos por compatibilidade)
export interface BriefingItem {
  time: string;
  content: string;
  source: string;
}

export type AttentionPriority = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  priority: AttentionPriority;
  title: string;
  context: string;
  timestamp: string;
}
