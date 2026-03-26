import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  OperationInfo, TimelineEventInfo,
  OperationTask, TimelineEvent, Operation, OperationsSummaryData,
} from "./types";
import type { OperationsPageData } from "./types.page";
import type { DomainFetcher } from "../types";

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

/* ── Raw API shape ── */
interface RawOperationsPage {
  operations: OperationInfo[];
  timeline: TimelineEventInfo[];
}

/* ── Page-level fetcher ── */
export const fetchOperationsPage: DomainFetcher<OperationsPageData> = createRealFirstFetcher<RawOperationsPage, OperationsPageData>({
  endpoint: "/operations",
  fallbackData: { tasks: [], timeline: [], liveOps: [], summary: { total: 0, running: 0, queued: 0, done: 0, failed: 0, criticalActive: 0 } },
  transform: (raw) => {
    const tasks = raw.operations.map(toOperationTask);
    const timeline = raw.timeline.map(ev => toTimelineEvent(ev, raw.operations));
    const liveOps = raw.operations.map(toLiveOp).filter((o): o is Operation => o !== null);
    return { tasks, timeline, liveOps, summary: buildSummary(tasks) };
  },
});

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
