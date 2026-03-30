/**
 * Operations — Derivação client-side de sinais reais
 *
 * Quando /api/operations não está disponível (modo standalone),
 * esta camada agrega sinais dos domínios já existentes para
 * produzir OperationInfo[] e TimelineEventInfo[] derivados.
 *
 * Fontes: Sessions, Activities, Cron, Agents
 */

import { apiUrl } from "../api";
import type { OperationInfo, OperationKind, OperationStatus, OperationPriority, TimelineEventInfo, TimelineAction } from "./types";
import type { Session } from "../sessions/types";
import type { ActivityInfo } from "../activity/types";
import type { CronJobInfo } from "../cron/types";
import type { AgentInfo } from "../agents/types";

// ═══════════════════════════════════════════════════════
// Fetch helper
// ═══════════════════════════════════════════════════════

async function safeFetch<T>(endpoint: string, fallback: T, unwrapKeys?: string[]): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(apiUrl(endpoint), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const json = await res.json();
    // Unwrap { sessions: [], items: [], agents: [] } wrappers
    if (unwrapKeys && json && typeof json === "object" && !Array.isArray(json)) {
      for (const key of unwrapKeys) {
        if (Array.isArray(json[key])) return json[key] as T;
      }
    }
    return json as T;
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════
// Derivação por domínio
// ═══════════════════════════════════════════════════════

function deriveFromSessions(sessions: Session[]): { ops: OperationInfo[]; events: TimelineEventInfo[] } {
  const ops: OperationInfo[] = [];
  const events: TimelineEventInfo[] = [];

  for (const s of sessions) {
    const isRunning = !s.aborted && s.ageMs < 120_000 && s.totalTokens > 0;
    const isFailed = s.aborted;
    const isDone = !s.aborted && (s.ageMs >= 120_000 || s.totalTokens === 0);

    let status: OperationStatus = "done";
    if (isRunning) status = "running";
    else if (isFailed) status = "failed";

    const progress = isRunning ? Math.min(95, Math.round((s.ageMs / 120_000) * 100)) : isFailed ? 0 : 100;

    ops.push({
      id: `session-${s.id}`,
      kind: "session",
      title: `${s.typeEmoji} ${s.typeLabel} — ${s.key}`,
      description: s.preview || null,
      status,
      priority: isFailed ? "high" : "normal",
      progress,
      source: "session",
      agentId: null,
      sessionId: s.id,
      assignee: s.model,
      startedAt: String(s.updatedAt),
      updatedAt: String(s.updatedAt),
      completedAt: isDone ? String(s.updatedAt) : null,
      metadata: { totalTokens: s.totalTokens, type: s.type },
    });

    // Timeline event
    let action: TimelineAction = "started";
    if (isDone) action = "completed";
    else if (isFailed) action = "failed";

    events.push({
      id: `session-ev-${s.id}`,
      operationId: `session-${s.id}`,
      action,
      agent: s.model,
      detail: s.preview ? s.preview.slice(0, 120) : null,
      createdAt: String(s.updatedAt),
    });
  }

  return { ops, events };
}

function deriveFromCron(jobs: CronJobInfo[]): { ops: OperationInfo[]; events: TimelineEventInfo[] } {
  const ops: OperationInfo[] = [];
  const events: TimelineEventInfo[] = [];

  for (const job of jobs) {
    if (!job.enabled || !job.lastRunAt) continue;

    const isFailed = job.lastRunSuccess === false;
    const status: OperationStatus = isFailed ? "failed" : "done";

    ops.push({
      id: `cron-${job.id}`,
      kind: "cron",
      title: `Cron: ${job.name}`,
      description: job.lastRunError || job.description || null,
      status,
      priority: job.consecutiveFailures >= 3 ? "high" : "normal",
      progress: 100,
      source: "cron",
      agentId: null,
      sessionId: null,
      assignee: null,
      startedAt: job.lastRunAt,
      updatedAt: job.lastRunAt,
      completedAt: job.lastRunAt,
      metadata: {
        schedule: job.schedule,
        consecutiveFailures: job.consecutiveFailures,
        durationMs: job.lastRunDurationMs,
      },
    });

    events.push({
      id: `cron-ev-${job.id}`,
      operationId: `cron-${job.id}`,
      action: isFailed ? "failed" : "completed",
      agent: null,
      detail: isFailed ? (job.lastRunError || "Falha na execução") : `Concluído em ${job.lastRunDurationMs ?? 0}ms`,
      createdAt: job.lastRunAt,
    });
  }

  return { ops, events };
}

function deriveFromActivity(activities: ActivityInfo[]): { ops: OperationInfo[]; events: TimelineEventInfo[] } {
  const ops: OperationInfo[] = [];
  const events: TimelineEventInfo[] = [];

  // Apenas pipeline e deploy viram operations
  const relevant = activities
    .filter(a => a.type.startsWith("pipeline.") || a.type === "deploy")
    .slice(0, 20);

  for (const act of relevant) {
    const isFail = act.type === "pipeline.fail" || act.level === "error" || act.level === "critical";
    const status: OperationStatus = isFail ? "failed" : "done";

    ops.push({
      id: `activity-${act.id}`,
      kind: "pipeline",
      title: act.message,
      description: act.detail || null,
      status,
      priority: act.level === "critical" ? "critical" : isFail ? "high" : "normal",
      progress: 100,
      source: "activity",
      agentId: act.agentId,
      sessionId: act.sessionId,
      assignee: act.source,
      startedAt: act.createdAt,
      updatedAt: act.createdAt,
      completedAt: act.createdAt,
      metadata: { type: act.type, level: act.level },
    });

    events.push({
      id: `activity-ev-${act.id}`,
      operationId: `activity-${act.id}`,
      action: isFail ? "failed" : "completed",
      agent: act.source,
      detail: act.detail || act.message,
      createdAt: act.createdAt,
    });
  }

  return { ops, events };
}

function deriveFromAgents(agents: AgentInfo[]): { ops: OperationInfo[]; events: TimelineEventInfo[] } {
  const ops: OperationInfo[] = [];
  const events: TimelineEventInfo[] = [];

  for (const agent of agents) {
    if (!agent.enabled || !agent.currentTask) continue;

    const isActive = agent.online && agent.activeSessions > 0;

    ops.push({
      id: `agent-task-${agent.id}`,
      kind: "task",
      title: agent.currentTask,
      description: `Agent ${agent.name} (${agent.role})`,
      status: isActive ? "running" : "paused",
      priority: agent.alertCount > 0 ? "high" : "normal",
      progress: isActive ? 50 : 0, // Heurístico — sem info real de progresso
      source: "agent",
      agentId: agent.id,
      sessionId: null,
      assignee: agent.name,
      startedAt: agent.currentTaskStartedAt,
      updatedAt: agent.lastActivityAt,
      completedAt: null,
      metadata: { tier: agent.tier, model: agent.model, sessions: agent.activeSessions },
    });

    events.push({
      id: `agent-ev-${agent.id}`,
      operationId: `agent-task-${agent.id}`,
      action: isActive ? "started" : "paused",
      agent: agent.name,
      detail: agent.currentTask,
      createdAt: agent.currentTaskStartedAt || agent.lastActivityAt,
    });
  }

  return { ops, events };
}

// ═══════════════════════════════════════════════════════
// Derivação principal
// ═══════════════════════════════════════════════════════

export interface DerivedOperations {
  operations: OperationInfo[];
  timeline: TimelineEventInfo[];
}

export async function deriveOperationsFromDomains(): Promise<DerivedOperations> {
  const [sessions, cronJobs, activities, agents] = await Promise.all([
    safeFetch<Session[]>("/sessions", [], ["sessions", "items"]),
    safeFetch<CronJobInfo[]>("/cron", [], ["jobs", "items", "cron"]),
    safeFetch<ActivityInfo[]>("/activities", [], ["activities", "events", "items"]),
    safeFetch<AgentInfo[]>("/agents", [], ["agents", "items"]),
  ]);

  const fromSessions = deriveFromSessions(sessions);
  const fromCron = deriveFromCron(cronJobs);
  const fromActivity = deriveFromActivity(activities);
  const fromAgents = deriveFromAgents(agents);

  const operations = [
    ...fromAgents.ops,      // Tarefas ativas primeiro
    ...fromSessions.ops,
    ...fromCron.ops,
    ...fromActivity.ops,
  ];

  const timeline = [
    ...fromAgents.events,
    ...fromSessions.events,
    ...fromCron.events,
    ...fromActivity.events,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { operations, timeline };
}
