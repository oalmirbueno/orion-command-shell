/**
 * Operations Domain — Fetchers (real-first + derivação client-side)
 *
 * Estratégia:
 *   1. Tenta /api/operations (endpoint real do OpenClaw)
 *   2. Se indisponível, deriva operations client-side a partir de
 *      sinais reais de Sessions, Cron, Activities, Agents
 *   3. Nunca retorna dados fake — apenas sinais reais ou vazio honesto
 */

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OperationSection } from "./types.page";
import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { deriveOperationsFromDomains } from "./derive";
import type {
  OperationInfo, TimelineEventInfo,
  OperationTask, TimelineEvent, Operation, OperationsSummaryData,
} from "./types";
import type { OperationsPageData } from "./types.page";
import type { DomainFetcher, DomainResult, DataSource } from "../types";

/* ── Transforms: canônico → view ── */

function elapsed(iso: string | null, ref: string): string {
  if (!iso) return "—";
  const ms = new Date(ref).getTime() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function toOperationTask(op: OperationInfo): OperationTask {
  return {
    id: op.id,
    title: op.title,
    agent: op.assignee || op.agentId || op.source,
    status: op.status,
    priority: op.priority,
    progress: op.progress,
    elapsed: elapsed(op.startedAt, op.updatedAt),
    updatedAt: op.updatedAt,
    description: op.description || "",
  };
}

function toTimelineEvent(ev: TimelineEventInfo, ops: OperationInfo[]): TimelineEvent {
  const op = ops.find(o => o.id === ev.operationId);
  const d = new Date(ev.createdAt);
  return {
    id: ev.id,
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    timeAgo: formatDistanceToNow(d, { addSuffix: true, locale: ptBR }),
    action: ev.action,
    taskTitle: op?.title || "—",
    agent: ev.agent || op?.assignee || "—",
    detail: ev.detail || "",
  };
}

function toLiveOp(op: OperationInfo): Operation | null {
  if (op.status !== "running" && op.status !== "paused") return null;
  return {
    id: op.id,
    name: op.title,
    agent: op.assignee || op.agentId || op.source,
    status: op.status,
    progress: op.progress,
    elapsed: elapsed(op.startedAt, op.updatedAt),
    priority: op.priority === "critical" || op.priority === "high" ? "high" : "normal",
  };
}

function buildSummary(tasks: OperationTask[]): OperationsSummaryData {
  return {
    total: tasks.length,
    running: tasks.filter(t => t.status === "running").length,
    queued: tasks.filter(t => t.status === "queued").length,
    done: tasks.filter(t => t.status === "done").length,
    failed: tasks.filter(t => t.status === "failed").length,
    criticalActive: tasks.filter(t => t.status === "running" && t.priority === "critical").length,
  };
}

function categorize(tasks: OperationTask[]): OperationSection {
  const now = new Date();
  const nowMs = now.getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
  const overnightStart = new Date(todayStart.getTime() - 6 * 3600_000);

  const running: OperationTask[] = [];
  const completed: OperationTask[] = [];
  const failed: OperationTask[] = [];
  const overnight: OperationTask[] = [];
  const upcoming: OperationTask[] = [];

  for (const t of tasks) {
    const updatedMs = new Date(t.updatedAt).getTime();
    const isOvernight = updatedMs >= overnightStart.getTime() && updatedMs < todayStart.getTime();
    const isFuture = updatedMs > nowMs;

    if (t.status === "queued" && isFuture) {
      upcoming.push(t);
    } else if (t.status === "running" || t.status === "queued" || t.status === "paused") {
      running.push(t);
    } else if (t.status === "failed") {
      failed.push(t);
      if (isOvernight) overnight.push(t);
    } else if (t.status === "done") {
      if (isOvernight) overnight.push(t);
      completed.push(t);
    }
  }

  // Sort upcoming by time
  upcoming.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  return { running, completed, failed, overnight, upcoming };
}

function buildPageData(operations: OperationInfo[], timeline: TimelineEventInfo[]): OperationsPageData {
  const tasks = operations.map(toOperationTask);
  const timelineEvents = timeline.map(ev => toTimelineEvent(ev, operations));
  const liveOps = operations.map(toLiveOp).filter((o): o is Operation => o !== null);
  const sections = categorize(tasks);
  return { tasks, timeline: timelineEvents, liveOps, summary: buildSummary(tasks), sections };
}

/* ── Raw API shape ── */
interface RawOperationsPage {
  operations: OperationInfo[];
  timeline: TimelineEventInfo[];
}

const EMPTY_SECTIONS: OperationSection = { running: [], completed: [], failed: [], overnight: [], upcoming: [] };

const EMPTY_PAGE: OperationsPageData = {
  tasks: [], timeline: [], liveOps: [],
  summary: { total: 0, running: 0, queued: 0, done: 0, failed: 0, criticalActive: 0 },
  sections: EMPTY_SECTIONS,
};

/* ── Fetcher com fallback para derivação client-side ── */

async function fetchOperationsRaw(): Promise<DomainResult<RawOperationsPage>> {
  const realFetcher = createRealFirstFetcher<any, RawOperationsPage>({
    endpoint: "/operations",
    fallbackData: { operations: [], timeline: [] },
    transform: (raw: any) => {
      // Handle { operations: [...], total, hasMore } wrapper
      const ops = raw?.operations || (Array.isArray(raw) ? raw : []);
      const timeline = raw?.timeline || [];
      // Normalize operation fields from backend
      const normalizedOps = ops.map((op: any) => ({
        id: op.id || `op-${Math.random().toString(36).slice(2)}`,
        kind: op.kind || op.type || "task",
        title: op.title || op.name || "—",
        description: op.description || null,
        status: op.status || "queued",
        priority: op.priority || "normal",
        progress: op.progress ?? 0,
        source: op.source || "—",
        agentId: op.agentId || op.agent || null,
        sessionId: op.sessionId || null,
        assignee: op.assignee || op.agent || null,
        startedAt: op.startedAt || null,
        updatedAt: op.updatedAt || new Date().toISOString(),
        completedAt: op.completedAt || null,
        metadata: op.metadata || null,
      }));
      return { operations: normalizedOps, timeline };
    },
  });

  const result = await realFetcher();

  // Se veio da API real, usa direto
  if (result.source === "api") {
    return result;
  }

  // Fallback: derivar client-side
  try {
    const derived = await deriveOperationsFromDomains();
    return {
      data: derived,
      source: "api" as DataSource,
      timestamp: new Date(),
    };
  } catch {
    console.debug("[Orion] operations: derivação client-side falhou, retornando vazio");
    return {
      data: { operations: [], timeline: [] },
      source: "fallback" as DataSource,
      timestamp: new Date(),
    };
  }
}

/* ── Page-level fetcher ── */
export const fetchOperationsPage: DomainFetcher<OperationsPageData> = async (): Promise<DomainResult<OperationsPageData>> => {
  const result = await fetchOperationsRaw();

  if (result.data.operations.length === 0 && result.data.timeline.length === 0) {
    return { data: EMPTY_PAGE, source: result.source, timestamp: result.timestamp };
  }

  return {
    data: buildPageData(result.data.operations, result.data.timeline),
    source: result.source,
    timestamp: result.timestamp,
  };
};

/* ── Granular fetchers ── */
export const fetchOperationTasks: DomainFetcher<OperationTask[]> = createRealFirstFetcher<OperationInfo[], OperationTask[]>({
  endpoint: "/operations/tasks",
  fallbackData: [],
  transform: (raw) => raw.map(toOperationTask),
});

export const fetchTimeline: DomainFetcher<TimelineEvent[]> = createRealFirstFetcher({
  endpoint: "/operations/timeline",
  fallbackData: [],
});

export const fetchLiveOperations: DomainFetcher<Operation[]> = createRealFirstFetcher<OperationInfo[], Operation[]>({
  endpoint: "/operations/live",
  fallbackData: [],
  transform: (raw) => raw.map(toLiveOp).filter((o): o is Operation => o !== null),
});

export { buildSummary as buildOperationsSummary };
