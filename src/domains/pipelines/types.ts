/**
 * Pipelines Domain — Tipos
 *
 * Pipeline = fluxo encadeado derivado de cron jobs + operações reais.
 * Não inventa dados — mapeia sinais reais em uma visão de pipeline.
 */

export type PipelineStatus = "running" | "healthy" | "failed" | "idle" | "disabled";
export type PipelineOrigin = "cron" | "operation" | "agent" | "mixed";
export type StepStatus = "done" | "running" | "queued" | "failed" | "skipped";

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  duration: string | null;
  detail: string | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  origin: PipelineOrigin;
  status: PipelineStatus;
  steps: PipelineStep[];
  lastRunAt: string | null;
  lastRunAgo: string;
  lastDuration: string;
  nextRunAt: string | null;
  nextRunIn: string;
  schedule: string | null;
  agent: string | null;
  operationCount: number;
  successRate: string;
  consecutiveFails: number;
}

export interface PipelinesSummary {
  total: number;
  running: number;
  healthy: number;
  failed: number;
  idle: number;
  disabled: number;
}

export interface PipelinesPageData {
  pipelines: Pipeline[];
  summary: PipelinesSummary;
}
