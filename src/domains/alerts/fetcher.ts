// Alerts Domain — Fetchers (real-first + fallback-safe)
//
// Shape canônico: AlertInfo (sinais consolidados do OpenClaw)
// Shape de UI: AlertsPageData (derivado via transform)
//
// Alerts é uma camada de leitura executiva. O OpenClaw consolida
// sinais de System, Cron, Activity, Sessions e Agents em /api/alerts.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { AlertInfo, Alert, AlertsPageData, AlertsSummaryData, Severity } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Transforms — canônico → view
// ═══════════════════════════════════════════════════════

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function deriveSeverity(info: AlertInfo): Severity {
  if (info.status === "resolved") return "resolved";
  return info.severity;
}

function toAlert(info: AlertInfo): Alert {
  return {
    id: info.id,
    severity: deriveSeverity(info),
    title: info.title,
    description: info.message,
    action: info.action || "",
    source: `${info.domain}/${info.source}`,
    triggeredAt: formatTime(info.createdAt),
    triggeredAgo: formatTimeAgo(info.createdAt),
    resolvedAt: info.resolvedAt ? formatTime(info.resolvedAt) : undefined,
    acknowledged: info.status === "acknowledged" || info.status === "resolved",
    occurrences: info.occurrences,
  };
}

function buildSummary(alerts: Alert[]): AlertsSummaryData {
  return {
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
    resolved: alerts.filter(a => a.severity === "resolved").length,
  };
}

// ═══════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════

const EMPTY_ALERTS_PAGE: AlertsPageData = {
  alerts: [],
  summary: { critical: 0, warning: 0, info: 0, resolved: 0 },
};

export const fetchAlertsPage: DomainFetcher<AlertsPageData> = async (): Promise<DomainResult<AlertsPageData>> => {
  const baseFetcher = createRealFirstFetcher<AlertInfo[], AlertInfo[]>({
    endpoint: "/alerts",
    fallbackData: [],
  });

  const result = await baseFetcher();

  if (result.data.length === 0) {
    return { data: EMPTY_ALERTS_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const alerts = result.data.map(toAlert);
  return {
    data: { alerts, summary: buildSummary(alerts) },
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchAlerts: DomainFetcher<Alert[]> = async (): Promise<DomainResult<Alert[]>> => {
  const baseFetcher = createRealFirstFetcher<AlertInfo[], AlertInfo[]>({
    endpoint: "/alerts",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toAlert),
    source: result.source,
    timestamp: result.timestamp,
  };
};
