// Activity Domain — Fetchers (real-first + fallback-safe)
//
// Real API returns: { activities: [], total, limit, offset, hasMore }
// When empty, derives from other domains via client-side derivation.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { deriveActivitiesFromDomains } from "./derive";
import type {
  ActivityInfo, ActivityEvent, ActivityPageData,
  BriefingItem, AttentionItem,
  EventPriority, EventCategory, ActivityLevel, ActivityType,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shape
// ═══════════════════════════════════════════════════════

interface BackendActivity {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: string;
  duration_ms: number | null;
  tokens_used: number | null;
  agent: string;
  metadata: Record<string, unknown> | null;
}

interface ActivitiesApiResponse {
  activities: BackendActivity[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

// ═══════════════════════════════════════════════════════
// Backend → Canonical normalization
// ═══════════════════════════════════════════════════════

const statusToLevel: Record<string, ActivityLevel> = {
  success: "info",
  error: "error",
  pending: "info",
  running: "info",
};

const typeToActivityType: Record<string, ActivityType> = {
  command: "agent.task",
  file: "agent.task",
  search: "agent.task",
  cron_run: "cron.run",
  security: "security.alert",
  build: "system.start",
  message: "session.start",
  tool_call: "agent.task",
};

function normalizeBackendActivity(raw: BackendActivity): ActivityInfo {
  return {
    id: raw.id,
    type: typeToActivityType[raw.type] || "agent.task",
    level: statusToLevel[raw.status] || "info",
    message: raw.description,
    detail: null,
    source: raw.agent,
    agentId: raw.agent,
    sessionId: null,
    createdAt: raw.timestamp,
    metadata: {
      duration_ms: raw.duration_ms,
      tokens_used: raw.tokens_used,
      ...(raw.metadata || {}),
    },
  };
}

// ═══════════════════════════════════════════════════════
// Transforms — canonical → view
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
  const title = info.message || info.detail || "Evento sem título";
  const description = info.detail && info.detail !== info.message
    ? info.detail
    : info.message || "";

  return {
    id: info.id,
    time: formatTime(info.createdAt),
    timeAgo: formatTimeAgo(info.createdAt),
    priority: levelToPriority(info.level, info.type),
    category: typeToCategory(info.type),
    title,
    description,
    source: info.source,
    metadata: info.metadata,
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

export const fetchActivityPage: DomainFetcher<ActivityPageData> = async (): Promise<DomainResult<ActivityPageData>> => {
  const baseFetcher = createRealFirstFetcher<ActivitiesApiResponse | BackendActivity[], ActivityInfo[]>({
    endpoint: "/activities",
    fallbackData: [],
    transform: (raw) => {
      let items: BackendActivity[];
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "activities" in raw) {
        items = (raw as ActivitiesApiResponse).activities;
      } else if (Array.isArray(raw)) {
        items = raw as BackendActivity[];
      } else {
        return [];
      }
      return items.map(normalizeBackendActivity);
    },
  });

  const result = await baseFetcher();
  let rawData = result.data;
  let source = result.source;

  // If empty, try client-side derivation from other domains
  if (rawData.length === 0) {
    try {
      const derived = await deriveActivitiesFromDomains();
      if (derived.length > 0) {
        rawData = derived;
        source = "fallback";
        console.debug("[Orion] Activity: derivado de outros domínios", derived.length, "eventos");
      }
    } catch {
      console.debug("[Orion] Activity: derivação client-side falhou");
    }
  }

  if (rawData.length === 0) {
    return { data: EMPTY_PAGE, source, timestamp: result.timestamp };
  }

  const events = rawData.map(toActivityEvent);
  return {
    data: { events, summary: buildSummary(events) },
    source,
    timestamp: result.timestamp,
  };
};

// Widget fetchers para Home
export const fetchActivityEvents: DomainFetcher<ActivityEvent[]> = async (): Promise<DomainResult<ActivityEvent[]>> => {
  const pageResult = await fetchActivityPage();
  return {
    data: pageResult.data.events,
    source: pageResult.source,
    timestamp: pageResult.timestamp,
  };
};

// fetchBriefing and fetchAttentionItems removed — these endpoints don't exist.
// Home derives attention/briefing from activity events inline.
