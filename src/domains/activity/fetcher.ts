// Activity Domain — Fetchers (real-first + fallback-safe)
//
// Shape canônico: ActivityInfo (dados brutos do OpenClaw em /api/activities)
// Shape de UI: ActivityPageData (derivado via transform)
//
// Nota de naming: a base real usa /api/activities (plural).
// O shell consome via ActivityPageData sem saber do naming interno.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  ActivityInfo, ActivityEvent, ActivityPageData,
  BriefingItem, AttentionItem,
  EventPriority, EventCategory, ActivityLevel, ActivityType,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Transforms — canônico → view
// ═══════════════════════════════════════════════════════

function levelToPriority(level: ActivityLevel, type: ActivityType): EventPriority {
  if (level === "critical") return "critical";
  if (level === "error") return "warning";
  if (level === "warn") return "warning";
  if (type.endsWith(".end") || type === "cron.run") return "success";
  if (level === "info") return "info";
  return "neutral";
}

function typeToCategory(type: ActivityType): EventCategory {
  if (type.startsWith("agent.")) return "agent";
  if (type.startsWith("system.")) return "system";
  if (type.startsWith("pipeline.")) return "pipeline";
  if (type.startsWith("security.")) return "security";
  if (type.startsWith("session.")) return "session";
  if (type === "deploy") return "deploy";
  if (type === "cron.run") return "system";
  return "system";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function toActivityEvent(info: ActivityInfo): ActivityEvent {
  return {
    id: info.id,
    time: formatTime(info.createdAt),
    timeAgo: formatTimeAgo(info.createdAt),
    priority: levelToPriority(info.level, info.type),
    category: typeToCategory(info.type),
    title: info.message,
    description: info.detail || "",
    source: info.source,
  };
}

function buildSummary(events: ActivityEvent[]) {
  return {
    total: events.length,
    critical: events.filter(e => e.priority === "critical").length,
    warning: events.filter(e => e.priority === "warning").length,
    resolved: events.filter(e => e.priority === "success").length,
  };
}

// ═══════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════

const EMPTY_PAGE: ActivityPageData = {
  events: [],
  summary: { total: 0, critical: 0, warning: 0, resolved: 0 },
};

// Rota canônica: /api/activities (plural, alinhado ao projeto-base)
export const fetchActivityPage: DomainFetcher<ActivityPageData> = async (): Promise<DomainResult<ActivityPageData>> => {
  const baseFetcher = createRealFirstFetcher<ActivityInfo[], ActivityInfo[]>({
    endpoint: "/activities",
    fallbackData: [],
  });

  const result = await baseFetcher();

  if (result.data.length === 0) {
    return { data: EMPTY_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const events = result.data.map(toActivityEvent);
  return {
    data: { events, summary: buildSummary(events) },
    source: result.source,
    timestamp: result.timestamp,
  };
};

// Widget fetchers para Home
export const fetchActivityEvents: DomainFetcher<ActivityEvent[]> = async (): Promise<DomainResult<ActivityEvent[]>> => {
  const baseFetcher = createRealFirstFetcher<ActivityInfo[], ActivityInfo[]>({
    endpoint: "/activities",
    fallbackData: [],
  });
  const result = await baseFetcher();
  return {
    data: result.data.map(toActivityEvent),
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchBriefing: DomainFetcher<BriefingItem[]> = createRealFirstFetcher({
  endpoint: "/activities/briefing",
  fallbackData: [],
});

export const fetchAttentionItems: DomainFetcher<AttentionItem[]> = createRealFirstFetcher({
  endpoint: "/activities/attention",
  fallbackData: [],
});
