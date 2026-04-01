/**
 * Pipelines Domain — Fetcher
 *
 * Deriva pipelines a partir de dados reais de cron + operations.
 * Cada cron job vira um pipeline com steps derivados das operações vinculadas.
 */

import { apiUrl } from "../api";
import type { DomainFetcher, DomainResult, DataSource } from "../types";
import type {
  Pipeline, PipelineStep, PipelineStatus, PipelineOrigin, StepStatus,
  PipelinesSummary, PipelinesPageData,
} from "./types";

/* ── Helpers ── */

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function formatTimeUntil(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "atrasado";
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "em breve";
  if (mins < 60) return `em ${mins}min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `em ${hrs}h`;
  return `em ${Math.round(hrs / 24)}d`;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}min`;
}

/* ── Fetch helpers ── */

async function safeFetch<T>(endpoint: string, fallback: T, timeout = 12000): Promise<{ data: T; live: boolean }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(apiUrl(endpoint), { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`${res.status}`);
    const raw = await res.json();
    return { data: raw as T, live: true };
  } catch {
    return { data: fallback, live: false };
  }
}

/* ── Derive pipelines ── */

interface RawCronJob {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  schedule?: { kind?: string; expr?: string; everyMs?: number };
  scheduleDisplay?: string;
  lastRun?: string | null;
  nextRun?: string | null;
  state?: {
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    lastRunStatus?: string | null;
    lastDurationMs?: number | null;
    consecutiveErrors?: number;
  };
  totalRuns?: number;
}

interface RawOperation {
  id: string;
  kind?: string;
  title?: string;
  name?: string;
  status?: string;
  source?: string;
  agentId?: string;
  agent?: string;
  assignee?: string;
  progress?: number;
  startedAt?: string | null;
  updatedAt?: string;
  completedAt?: string | null;
}

function deriveScheduleStr(cron: RawCronJob): string | null {
  if (cron.schedule?.expr) return cron.schedule.expr;
  if (cron.schedule?.everyMs) {
    const ms = cron.schedule.everyMs;
    if (ms < 60_000) return `cada ${Math.round(ms / 1000)}s`;
    if (ms < 3_600_000) return `cada ${Math.round(ms / 60_000)}min`;
    return `cada ${Math.round(ms / 3_600_000)}h`;
  }
  if (cron.scheduleDisplay) return cron.scheduleDisplay;
  return null;
}

function derivePipelineStatus(cron: RawCronJob): PipelineStatus {
  if (!cron.enabled) return "disabled";
  const errors = cron.state?.consecutiveErrors ?? 0;
  const lastStatus = cron.state?.lastRunStatus;
  if (errors > 0) return "failed";
  if (lastStatus === "ok") return "healthy";
  if (!cron.lastRun && !cron.state?.lastRunAtMs) return "idle";
  return "healthy";
}

function deriveStepsFromOps(ops: RawOperation[]): PipelineStep[] {
  return ops.slice(0, 6).map((op) => {
    let stepStatus: StepStatus = "queued";
    if (op.status === "done") stepStatus = "done";
    else if (op.status === "running") stepStatus = "running";
    else if (op.status === "failed") stepStatus = "failed";
    else if (op.status === "paused") stepStatus = "skipped";

    return {
      id: op.id,
      label: op.title || op.name || "—",
      status: stepStatus,
      duration: null,
      detail: op.assignee || op.agent || op.agentId || null,
    };
  });
}

function cronToPipeline(cron: RawCronJob, relatedOps: RawOperation[]): Pipeline {
  const lastRunAt = cron.lastRun ?? (cron.state?.lastRunAtMs ? new Date(cron.state.lastRunAtMs).toISOString() : null);
  const nextRunAt = cron.nextRun ?? (cron.state?.nextRunAtMs ? new Date(cron.state.nextRunAtMs).toISOString() : null);
  const status = derivePipelineStatus(cron);
  const steps = deriveStepsFromOps(relatedOps);

  // If no operation steps, create synthetic steps from cron state
  if (steps.length === 0 && lastRunAt) {
    const lastOk = cron.state?.lastRunStatus === "ok";
    steps.push({
      id: `${cron.id}-trigger`,
      label: "Gatilho",
      status: "done",
      duration: null,
      detail: deriveScheduleStr(cron),
    });
    steps.push({
      id: `${cron.id}-exec`,
      label: "Execução",
      status: lastOk ? "done" : status === "failed" ? "failed" : "done",
      duration: formatDuration(cron.state?.lastDurationMs ?? null),
      detail: null,
    });
    steps.push({
      id: `${cron.id}-result`,
      label: "Resultado",
      status: lastOk ? "done" : status === "failed" ? "failed" : "done",
      duration: null,
      detail: lastOk ? "Sucesso" : "Falha",
    });
  }

  const totalRuns = cron.totalRuns ?? 0;
  const errors = cron.state?.consecutiveErrors ?? 0;

  return {
    id: cron.id,
    name: cron.name,
    description: cron.description || cron.name,
    origin: relatedOps.length > 0 ? "mixed" : "cron",
    status,
    steps,
    lastRunAt,
    lastRunAgo: formatTimeAgo(lastRunAt),
    lastDuration: formatDuration(cron.state?.lastDurationMs ?? null),
    nextRunAt,
    nextRunIn: formatTimeUntil(nextRunAt),
    schedule: deriveScheduleStr(cron),
    agent: null,
    operationCount: relatedOps.length,
    successRate: totalRuns > 0 ? `${Math.round(((totalRuns - errors) / totalRuns) * 100)}%` : "—",
    consecutiveFails: errors,
  };
}

function opToPipeline(op: RawOperation): Pipeline {
  const status: PipelineStatus =
    op.status === "running" ? "running" :
    op.status === "done" ? "healthy" :
    op.status === "failed" ? "failed" : "idle";

  const steps: PipelineStep[] = [
    { id: `${op.id}-start`, label: "Início", status: op.startedAt ? "done" : "queued", duration: null, detail: null },
    { id: `${op.id}-exec`, label: op.title || op.name || "Execução", status: op.status === "done" ? "done" : op.status === "running" ? "running" : op.status === "failed" ? "failed" : "queued", duration: null, detail: op.assignee || op.agent || op.agentId || null },
    { id: `${op.id}-end`, label: "Conclusão", status: op.completedAt ? "done" : op.status === "failed" ? "failed" : "queued", duration: null, detail: null },
  ];

  return {
    id: op.id,
    name: op.title || op.name || "Operação",
    description: "",
    origin: (op.kind as PipelineOrigin) || "operation",
    status,
    steps,
    lastRunAt: op.startedAt || op.updatedAt || null,
    lastRunAgo: formatTimeAgo(op.startedAt || op.updatedAt || null),
    lastDuration: "—",
    nextRunAt: null,
    nextRunIn: "—",
    schedule: null,
    agent: op.assignee || op.agent || op.agentId || null,
    operationCount: 1,
    successRate: "—",
    consecutiveFails: op.status === "failed" ? 1 : 0,
  };
}

function buildSummary(pipelines: Pipeline[]): PipelinesSummary {
  return {
    total: pipelines.length,
    running: pipelines.filter(p => p.status === "running").length,
    healthy: pipelines.filter(p => p.status === "healthy").length,
    failed: pipelines.filter(p => p.status === "failed").length,
    idle: pipelines.filter(p => p.status === "idle").length,
    disabled: pipelines.filter(p => p.status === "disabled").length,
  };
}

/* ── Main fetcher ── */

const EMPTY_PAGE: PipelinesPageData = {
  pipelines: [],
  summary: { total: 0, running: 0, healthy: 0, failed: 0, idle: 0, disabled: 0 },
};

export const fetchPipelinesPage: DomainFetcher<PipelinesPageData> = async (): Promise<DomainResult<PipelinesPageData>> => {
  const [cronResult, opsResult] = await Promise.all([
    safeFetch<any[]>("/cron", []),
    safeFetch<any>("/operations", { operations: [] }),
  ]);

  const source: DataSource = cronResult.live || opsResult.live ? "api" : "fallback";

  const cronJobs: RawCronJob[] = Array.isArray(cronResult.data) ? cronResult.data : [];
  const rawOps: RawOperation[] = Array.isArray(opsResult.data)
    ? opsResult.data
    : Array.isArray(opsResult.data?.operations)
      ? opsResult.data.operations
      : [];

  if (cronJobs.length === 0 && rawOps.length === 0) {
    return { data: EMPTY_PAGE, source, timestamp: new Date() };
  }

  // Map cron jobs to pipelines, attach related ops by source
  const usedOpIds = new Set<string>();
  const pipelines: Pipeline[] = [];

  for (const cron of cronJobs) {
    const related = rawOps.filter(op => op.source === "cron" || op.kind === "cron");
    related.forEach(op => usedOpIds.add(op.id));
    pipelines.push(cronToPipeline(cron, related));
  }

  // Standalone operation pipelines (not cron-linked)
  const standaloneOps = rawOps.filter(op =>
    !usedOpIds.has(op.id) &&
    (op.kind === "pipeline" || op.status === "running" || op.status === "failed")
  );
  for (const op of standaloneOps) {
    pipelines.push(opToPipeline(op));
  }

  // Sort: running first, then failed, then healthy
  const statusOrder: Record<PipelineStatus, number> = { running: 0, failed: 1, idle: 2, healthy: 3, disabled: 4 };
  pipelines.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return {
    data: { pipelines, summary: buildSummary(pipelines) },
    source,
    timestamp: new Date(),
  };
};
