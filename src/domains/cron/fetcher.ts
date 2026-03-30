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
  agentId?: string;
  name: string;
  enabled: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  description?: string;
  sessionTarget?: string;
  payload?: Record<string, unknown>;
  totalRuns?: number;
  // New backend shape
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
  };
  lastRun?: {
    at?: string | null;
    durationMs?: number | null;
    ok?: boolean | null;
    error?: string | null;
  };
  nextRunAt?: string | number | null;
  stats?: {
    consecutiveOk?: number;
    consecutiveFail?: number;
  };
  // Legacy flat fields (old shape fallback)
  lastRunAt?: string | number | null;
  lastRunDurationMs?: number | null;
  lastRunSuccess?: boolean | null;
  lastRunError?: string | null;
  consecutiveSuccesses?: number;
  consecutiveFailures?: number;
}

function normalizeBackendCron(raw: RealCronJob): CronJobInfo {
  const toIso = (v: string | number | null | undefined): string | null => {
    if (!v) return null;
    if (typeof v === "number") return new Date(v).toISOString();
    return v;
  };

  // Handle nested lastRun object vs legacy flat fields
  const lastRunAt = raw.lastRun?.at ?? raw.lastRunAt ?? null;
  const lastRunDurationMs = raw.lastRun?.durationMs ?? raw.lastRunDurationMs ?? null;
  const lastRunOk = raw.lastRun?.ok ?? raw.lastRunSuccess ?? null;
  const lastRunError = raw.lastRun?.error ?? raw.lastRunError ?? null;

  // Handle nested stats vs legacy flat fields
  const consecutiveOk = raw.stats?.consecutiveOk ?? raw.consecutiveSuccesses ?? 0;
  const consecutiveFail = raw.stats?.consecutiveFail ?? raw.consecutiveFailures ?? 0;

  // Build schedule string
  let scheduleStr = "—";
  if (raw.schedule) {
    if (raw.schedule.expr) {
      scheduleStr = raw.schedule.expr;
    } else if (raw.schedule.everyMs) {
      scheduleStr = `every:${raw.schedule.everyMs}`;
    } else if (raw.schedule.kind) {
      scheduleStr = raw.schedule.kind;
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || raw.name,
    schedule: scheduleStr,
    enabled: raw.enabled,
    lastRunAt: toIso(lastRunAt),
    lastRunDurationMs: lastRunDurationMs,
    lastRunSuccess: lastRunOk,
    lastRunError: lastRunError,
    nextRunAt: toIso(raw.nextRunAt),
    consecutiveSuccesses: consecutiveOk,
    consecutiveFailures: consecutiveFail,
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

function humanSchedule(cron: string): string {
  return CRON_LABELS[cron] || cron;
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
      return raw.map((item) => {
        // If it has schedule.expr, it's the real shape
        if (item && typeof item === "object" && "schedule" in item && typeof (item as RealCronJob).schedule === "object") {
          return realToCronJobInfo(item as RealCronJob);
        }
        // Already canonical
        return item as CronJobInfo;
      });
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
