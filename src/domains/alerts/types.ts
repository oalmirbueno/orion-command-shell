// Alerts Domain — Tipos Canônicos
//
// Shape baseado na rota local do OpenClaw (/api/alerts).
// Alerts é uma camada de leitura executiva derivada de sinais
// dos domínios System, Cron, Activity, Sessions e Agents.

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type AlertDomain = "system" | "cron" | "activity" | "session" | "agent" | "security" | "pipeline";

// /api/alerts — sinais de risco/atenção consolidados pelo runtime
export interface AlertInfo {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  action: string | null;
  source: string;
  domain: AlertDomain;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  occurrences: number;
  metadata: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type Severity = "critical" | "warning" | "info" | "resolved";

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  action: string;
  source: string;
  triggeredAt: string;
  triggeredAgo: string;
  resolvedAt?: string;
  acknowledged: boolean;
  occurrences: number;
}

export interface AlertsSummaryData {
  critical: number;
  warning: number;
  info: number;
  resolved: number;
}

export interface AlertsPageData {
  alerts: Alert[];
  summary: AlertsSummaryData;
}
