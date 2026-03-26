// Operations Domain — Tipos Canônicos
//
// Shape baseado na rota local do OpenClaw (/api/operations).
// Representa trabalho real em execução, fila ou concluído no runtime.

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type OperationKind =
  | "task"          // tarefa discreta (batch, classificação)
  | "pipeline"      // pipeline multi-step
  | "cron"          // execução originada de cron job
  | "session"       // trabalho vinculado a sessão
  | "maintenance";  // manutenção interna do sistema

export type OperationStatus = "queued" | "running" | "paused" | "done" | "failed";
export type OperationPriority = "critical" | "high" | "normal" | "low";

export type TimelineAction =
  | "started" | "completed" | "failed"
  | "paused" | "resumed" | "retried" | "queued";

/** /api/operations — item operacional canônico */
export interface OperationInfo {
  id: string;
  kind: OperationKind;
  title: string;
  description: string | null;
  status: OperationStatus;
  priority: OperationPriority;
  progress: number;              // 0-100
  source: string;                // domínio de origem: "cron", "session", "agent", etc.
  agentId: string | null;
  sessionId: string | null;
  assignee: string | null;       // agente ou owner responsável
  startedAt: string | null;      // ISO 8601
  updatedAt: string;             // ISO 8601
  completedAt: string | null;    // ISO 8601
  metadata: Record<string, unknown> | null;
}

/** /api/operations/timeline — evento de timeline canônico */
export interface TimelineEventInfo {
  id: string;
  operationId: string;
  action: TimelineAction;
  agent: string | null;
  detail: string | null;
  createdAt: string;             // ISO 8601
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export interface OperationTask {
  id: string;
  title: string;
  agent: string;
  status: OperationStatus;
  priority: OperationPriority;
  progress: number;
  elapsed: string;
  updatedAt: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  timeAgo: string;
  action: TimelineAction;
  taskTitle: string;
  agent: string;
  detail: string;
}

/** View model leve para widgets de live ops (Home, etc.) */
export interface Operation {
  id: string;
  name: string;
  agent: string;
  status: "running" | "paused";
  progress: number;
  elapsed: string;
  priority: "high" | "normal";
}

export interface OperationsSummaryData {
  total: number;
  running: number;
  queued: number;
  done: number;
  failed: number;
  criticalActive: number;
}
