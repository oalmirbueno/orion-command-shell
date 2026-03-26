/**
 * Cron Domain — Fetchers (real-first + fallback-safe)
 *
 * Shape canônico: CronJobInfo (dados brutos do OpenClaw)
 * Shape de UI: CronPageData (derivado via transform)
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { CronJobInfo, CronJob, CronPageData, CronSummaryData, JobStatus } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Transforms — canônico → view
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
  const baseFetcher = createRealFirstFetcher<CronJobInfo[], CronJobInfo[]>({
    endpoint: "/cron",
    fallbackData: [],
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
  const baseFetcher = createRealFirstFetcher<CronJobInfo[], CronJobInfo[]>({
    endpoint: "/cron/jobs",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toCronJob),
    source: result.source,
    timestamp: result.timestamp,
  };
};
