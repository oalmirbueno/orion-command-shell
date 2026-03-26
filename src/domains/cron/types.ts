/**
 * Cron Domain — Tipos Canônicos
 *
 * Shape baseado na rota local do OpenClaw (/api/cron).
 * Este é o formato de referência do projeto-base.
 */

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

/** /api/cron — dados brutos de cada job agendado */
export interface CronJobInfo {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastRunSuccess: boolean | null;
  lastRunError: string | null;
  nextRunAt: string | null;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalRuns: number;
  createdAt: string;
}

/** /api/cron/runs — histórico de execuções */
export interface CronRunInfo {
  id: string;
  jobId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type JobStatus = "healthy" | "failed" | "warning" | "disabled";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  enabled: boolean;
  status: JobStatus;
  lastRun: string;
  lastRunAgo: string;
  lastDuration: string;
  lastResult: "success" | "failure" | "—";
  nextRun: string;
  nextRunIn: string;
  consecutiveSuccess: number;
  consecutiveFails: number;
  error?: string;
}

export interface CronSummaryData {
  active: number;
  healthy: number;
  failed: number;
  disabled: number;
}

export interface CronPageData {
  jobs: CronJob[];
  summary: CronSummaryData;
}
