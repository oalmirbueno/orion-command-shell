/**
 * Alerts Domain — Fetchers (real-first + derivação client-side)
 *
 * Estratégia:
 *   1. Tenta /api/alerts (endpoint real do OpenClaw)
 *   2. Se indisponível, deriva alertas client-side a partir de
 *      sinais reais dos domínios System, Cron, Activity, Sessions, Agents
 *   3. Nunca retorna dados fake — apenas sinais reais ou vazio honesto
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { deriveAlertsFromDomains } from "./derive";
import type { AlertInfo, Alert, AlertsPageData, AlertsSummaryData, Severity } from "./types";
import type { DomainFetcher, DomainResult, DataSource } from "../types";

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
// Fetcher com fallback para derivação client-side
// ═══════════════════════════════════════════════════════

async function fetchAlertsRaw(): Promise<DomainResult<AlertInfo[]>> {
  // 1. Tenta endpoint real /api/alerts
  const realFetcher = createRealFirstFetcher<any, AlertInfo[]>({
    endpoint: "/alerts",
    fallbackData: [],
    transform: (raw: any) => {
      // Handle { alerts: [...], total } wrapper from backend
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "alerts" in raw) {
        return (raw.alerts as any[]).map(normalizeAlert);
      }
      if (Array.isArray(raw)) return raw.map(normalizeAlert);
      return [];
    },
  });

  const result = await realFetcher();

  // Se veio da API real com dados, usa direto
  if (result.source === "api" && result.data.length > 0) {
    return result;
  }

  // Se veio da API real mas vazio, respeita (não há alertas reais)
  if (result.source === "api") {
    return result;
  }

  // 2. Fallback: deriva alertas client-side a partir dos outros domínios
  try {
    const derived = await deriveAlertsFromDomains();
    return {
      data: derived,
      source: "api" as DataSource, // veio de dados reais dos outros endpoints
      timestamp: new Date(),
    };
  } catch {
    console.debug("[Orion] alerts: derivação client-side falhou, retornando vazio");
    return {
      data: [],
      source: "fallback" as DataSource,
      timestamp: new Date(),
    };
  }
}

// ═══════════════════════════════════════════════════════
// Fetchers públicos
// ═══════════════════════════════════════════════════════

const EMPTY_ALERTS_PAGE: AlertsPageData = {
  alerts: [],
  summary: { critical: 0, warning: 0, info: 0, resolved: 0 },
};

export const fetchAlertsPage: DomainFetcher<AlertsPageData> = async (): Promise<DomainResult<AlertsPageData>> => {
  const result = await fetchAlertsRaw();

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
  const result = await fetchAlertsRaw();
  return {
    data: result.data.map(toAlert),
    source: result.source,
    timestamp: result.timestamp,
  };
};
