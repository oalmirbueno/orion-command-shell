/**
 * Cron Domain — Fetchers (real-first + fallback-safe)
 *
 * Real API returns array with: { id, agentId, name, enabled, schedule: { kind, expr, tz }, payload, ... }
 * Transform maps to CronJobInfo canonical shape.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { CronJobInfo, CronJob, CronPageData, CronSummaryData, JobStatus } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shape
// ═══════════════════════════════════════════════════════

interface RealCronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
  };
  scheduleDisplay?: string;
  timezone?: string;
  nextRun?: string | null;
  lastRun?: string | null;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string | null;
    lastDurationMs?: number | null;
    consecutiveErrors?: number;
    lastDelivered?: boolean;
    lastDeliveryStatus?: string;
  };
  // Legacy flat fields
  description?: string;
  totalRuns?: number;
  createdAtMs?: number;
}

function normalizeBackendCron(raw: RealCronJob): CronJobInfo {
  // lastRun and nextRun are ISO strings at root level
  const lastRunAt = raw.lastRun ?? (raw.state?.lastRunAtMs ? new Date(raw.state.lastRunAtMs).toISOString() : null);
  const nextRunAt = raw.nextRun ?? (raw.state?.nextRunAtMs ? new Date(raw.state.nextRunAtMs).toISOString() : null);
  const lastDurationMs = raw.state?.lastDurationMs ?? null;
  const lastRunStatus = raw.state?.lastRunStatus ?? null;
  const consecutiveErrors = raw.state?.consecutiveErrors ?? 0;
  const lastRunSuccess = lastRunStatus === "ok" ? true : lastRunStatus ? false : null;
  const lastRunError = lastRunStatus && lastRunStatus !== "ok" ? "Última execução falhou" : null;

  // Schedule string
  let scheduleStr = "—";
  if (raw.schedule?.expr) {
    scheduleStr = raw.schedule.expr;
  } else if (raw.schedule?.everyMs) {
    scheduleStr = `every:${raw.schedule.everyMs}`;
  } else if (raw.scheduleDisplay) {
    scheduleStr = raw.scheduleDisplay;
  }

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || raw.name,
    schedule: scheduleStr,
    enabled: raw.enabled,
    lastRunAt: lastRunAt,
    lastRunDurationMs: lastDurationMs,
    lastRunSuccess: lastRunSuccess,
    lastRunError: lastRunError,
    nextRunAt: nextRunAt,
    consecutiveSuccesses: consecutiveErrors === 0 ? 1 : 0,
    consecutiveFailures: consecutiveErrors,
    totalRuns: raw.totalRuns ?? 0,
    createdAt: raw.createdAtMs ? new Date(raw.createdAtMs).toISOString() : new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════
// Transforms — canonical → view
// ═══════════════════════════════════════════════════════

const CRON_LABELS: Record<string, string> = {
  "* * * * *": "A cada minuto",
  "*/5 * * * *": "A cada 5 minutos",
  "*/10 * * * *": "A cada 10 minutos",
  "*/15 * * * *": "A cada 15 minutos",
  "*/30 * * * *": "A cada 30 minutos",
  "0 * * * *": "A cada hora",
  "0 */2 * * *": "A cada 2 horas",
  "0 */4 * * *": "A cada 4 horas",
  "0 */6 * * *": "A cada 6 horas",
  "0 */12 * * *": "A cada 12 horas",
  "0 0 * * *": "Diariamente à meia-noite",
  "0 2 * * *": "Diariamente às 02:00",
  "0 6 * * *": "Diariamente às 06:00",
  "0 0 * * 0": "Semanalmente",
  "0 0 1 * *": "Mensalmente",
};

function humanEveryMs(ms: number): string {
  if (ms < 60_000) return `A cada ${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `A cada ${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) return `A cada ${Math.round(ms / 3_600_000)}h`;
  return `A cada ${Math.round(ms / 86_400_000)}d`;
}

function humanSchedule(schedule: string): string {
  if (schedule.startsWith("every:")) {
    const ms = parseInt(schedule.replace("every:", ""), 10);
    if (!isNaN(ms)) return humanEveryMs(ms);
  }
  return CRON_LABELS[schedule] || schedule;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}min`;
}

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

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function deriveStatus(job: CronJobInfo): JobStatus {
  if (!job.enabled) return "disabled";
  if (job.consecutiveFailures > 0) return "failed";
  if (job.lastRunSuccess === false && job.consecutiveFailures === 0) return "warning";
  return "healthy";
}

function toCronJob(info: CronJobInfo): CronJob {
  return {
    id: info.id,
    name: info.name,
    schedule: info.schedule,
    scheduleHuman: humanSchedule(info.schedule),
    enabled: info.enabled,
    status: deriveStatus(info),
    lastRun: formatTime(info.lastRunAt),
    lastRunAgo: formatTimeAgo(info.lastRunAt),
    lastDuration: info.lastRunDurationMs != null ? formatDuration(info.lastRunDurationMs) : "—",
    lastResult: info.lastRunSuccess === true ? "success" : info.lastRunSuccess === false ? "failure" : "—",
    nextRun: formatTime(info.nextRunAt),
    nextRunIn: formatTimeUntil(info.nextRunAt),
    consecutiveSuccess: info.consecutiveSuccesses,
    consecutiveFails: info.consecutiveFailures,
    error: info.lastRunError ?? undefined,
  };
}

function buildSummary(jobs: CronJob[]): CronSummaryData {
  return {
    active: jobs.filter(j => j.enabled).length,
    healthy: jobs.filter(j => j.status === "healthy").length,
    failed: jobs.filter(j => j.status === "failed").length,
    disabled: jobs.filter(j => !j.enabled).length,
  };
}

// ═══════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════

const EMPTY_CRON_PAGE: CronPageData = {
  jobs: [],
  summary: { active: 0, healthy: 0, failed: 0, disabled: 0 },
};

export const fetchCronPage: DomainFetcher<CronPageData> = async (): Promise<DomainResult<CronPageData>> => {
  const baseFetcher = createRealFirstFetcher<RealCronJob[] | CronJobInfo[], CronJobInfo[]>({
    endpoint: "/cron",
    fallbackData: [],
    transform: (raw) => {
      if (!Array.isArray(raw)) return [];
      return raw.map((item: any) => {
        if (!item || typeof item !== "object") return null;
        // Detect backend shape: has nested lastRun, stats, or schedule object
        if ("lastRun" in item || "stats" in item || (item.schedule && typeof item.schedule === "object")) {
          return normalizeBackendCron(item as RealCronJob);
        }
        // Already canonical
        return item as CronJobInfo;
      }).filter(Boolean) as CronJobInfo[];
    },
  });

  const result = await baseFetcher();

  if (result.data.length === 0) {
    return { data: EMPTY_CRON_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const jobs = result.data.map(toCronJob);
  return {
    data: { jobs, summary: buildSummary(jobs) },
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchCronJobs: DomainFetcher<CronJob[]> = async (): Promise<DomainResult<CronJob[]>> => {
  const result = await fetchCronPage();
  return { data: result.data.jobs, source: result.source, timestamp: result.timestamp };
};
