/**
 * Timeline Domain — Fetcher unificado
 *
 * Agrega sinais reais de: sessions, cron, alerts, agents, system
 * Nunca inventa dados — apenas consolida fontes existentes.
 */

import { apiUrl } from "../api";
import type { DomainFetcher, DomainResult } from "../types";
import type { TimelineItem, TimelinePageData, TimelineSummary, TimelineItemStatus } from "./types";

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(apiUrl(endpoint), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

function unwrap<T>(raw: any, key: string): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && key in raw) {
    const val = raw[key];
    return Array.isArray(val) ? val : [];
  }
  return [];
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 0) {
    const absMins = Math.abs(mins);
    if (absMins < 60) return `em ${absMins}min`;
    const hrs = Math.round(absMins / 60);
    return `em ${hrs}h`;
  }
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function safeIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  return String(val);
}

// ═══════════════════════════════════════════════════════
// Derivação por fonte
// ═══════════════════════════════════════════════════════

function deriveFromSessions(raw: any[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const s of raw) {
    const ts = safeIso(s.updatedAt);
    const ageMs = s.ageMs ?? 0;
    const isActive = !s.aborted && ageMs < 300_000 && (s.totalTokens ?? 0) > 0;
    const isFailed = !!s.aborted;

    let status: TimelineItemStatus = "completed";
    if (isActive) status = "running";
    else if (isFailed) status = "failed";

    const emoji = s.typeEmoji || "💬";
    const label = s.typeLabel || s.type || "session";
    const tokens = s.totalTokens ?? 0;

    items.push({
      id: `tl-session-${s.id}`,
      type: "session",
      status,
      title: `${emoji} Sessão ${label}`,
      detail: `${s.key || s.id} — ${tokens > 0 ? `${tokens.toLocaleString("pt-BR")} tokens` : "sem tokens"} · ${s.model || "—"}`,
      source: s.model || "—",
      timestamp: ts,
      timeLabel: fmtTime(ts),
      timeAgo: fmtAgo(ts),
      domain: "sessions",
      linkTo: "/sessions",
    });
  }
  return items;
}

function deriveFromCron(raw: any[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const job of raw) {
    // Last run
    if (job.lastRunAt) {
      const ts = safeIso(job.lastRunAt);
      const failed = job.lastRunSuccess === false;
      items.push({
        id: `tl-cron-last-${job.id}`,
        type: "cron",
        status: failed ? "failed" : "completed",
        title: `⏱ Cron "${job.name}"`,
        detail: failed
          ? `Falha: ${job.lastRunError || "erro desconhecido"} (${job.consecutiveFailures ?? 0} consecutiva(s))`
          : `Executado com sucesso · ${job.lastRunDurationMs ?? 0}ms`,
        source: `cron/${job.id}`,
        timestamp: ts,
        timeLabel: fmtTime(ts),
        timeAgo: fmtAgo(ts),
        domain: "cron",
        linkTo: "/cron",
      });
    }

    // Next run (scheduled)
    if (job.nextRunAt && job.enabled) {
      const ts = safeIso(job.nextRunAt);
      items.push({
        id: `tl-cron-next-${job.id}`,
        type: "cron",
        status: "scheduled",
        title: `📅 Cron "${job.name}" agendado`,
        detail: `Próxima execução: ${job.schedule}`,
        source: `cron/${job.id}`,
        timestamp: ts,
        timeLabel: fmtTime(ts),
        timeAgo: fmtAgo(ts),
        domain: "cron",
        linkTo: "/cron",
      });
    }
  }
  return items;
}

function deriveFromAlerts(raw: any[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const a of raw) {
    const ts = safeIso(a.createdAt || a.timestamp);
    const sev = a.severity || "info";
    let status: TimelineItemStatus = "info";
    if (sev === "critical") status = "critical";
    else if (sev === "warning") status = "warning";
    if (a.status === "resolved") status = "completed";

    items.push({
      id: `tl-alert-${a.id}`,
      type: "alert",
      status,
      title: `⚠ ${a.title || a.message || "Alerta"}`,
      detail: a.description || a.message || "—",
      source: `${a.domain || "system"}/${a.source || "—"}`,
      timestamp: ts,
      timeLabel: fmtTime(ts),
      timeAgo: fmtAgo(ts),
      domain: "alerts",
      linkTo: "/alerts",
    });
  }
  return items;
}

function deriveFromAgents(raw: any[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const a of raw) {
    const name = a.name || a.id;
    const isOnline = a.online ?? a.status === "online";
    const ts = safeIso(a.lastActivityAt || a.updatedAt);

    if (a.currentTask && isOnline) {
      items.push({
        id: `tl-agent-task-${a.id}`,
        type: "agent",
        status: "running",
        title: `🤖 ${name} executando`,
        detail: a.currentTask,
        source: `agent/${a.id}`,
        timestamp: safeIso(a.currentTaskStartedAt || a.lastActivityAt),
        timeLabel: fmtTime(safeIso(a.currentTaskStartedAt || a.lastActivityAt)),
        timeAgo: fmtAgo(safeIso(a.currentTaskStartedAt || a.lastActivityAt)),
        domain: "agents",
        linkTo: "/agents",
      });
    }

    if (!isOnline && a.enabled !== false) {
      items.push({
        id: `tl-agent-offline-${a.id}`,
        type: "agent",
        status: "warning",
        title: `🤖 ${name} offline`,
        detail: `${a.role || "agent"} · ${a.tier || "—"}`,
        source: `agent/${a.id}`,
        timestamp: ts,
        timeLabel: fmtTime(ts),
        timeAgo: fmtAgo(ts),
        domain: "agents",
        linkTo: "/agents",
      });
    }

    if ((a.alertCount ?? 0) > 0) {
      items.push({
        id: `tl-agent-alert-${a.id}`,
        type: "agent",
        status: (a.alertCount ?? 0) >= 3 ? "critical" : "warning",
        title: `🤖 ${name} com ${a.alertCount} alerta(s)`,
        detail: `Requer atenção`,
        source: `agent/${a.id}`,
        timestamp: ts,
        timeLabel: fmtTime(ts),
        timeAgo: fmtAgo(ts),
        domain: "agents",
        linkTo: "/agents",
      });
    }
  }
  return items;
}

function deriveFromSystem(raw: any): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (!raw?.system) return items;
  const sys = raw.system;
  const mem = sys.memory || { total: 0, used: 0 };
  const cpuPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const ts = new Date().toISOString();

  if (cpuPct > 90) {
    items.push({
      id: "tl-system-critical",
      type: "system",
      status: "critical",
      title: "⚙ Sistema em estado crítico",
      detail: `Memória: ${cpuPct}% · Uptime: ${Math.round((sys.uptime || 0) / 60)}min`,
      source: `system/${sys.hostname || "—"}`,
      timestamp: ts,
      timeLabel: fmtTime(ts),
      timeAgo: "agora",
      domain: "system",
      linkTo: "/system",
    });
  } else if (cpuPct > 75) {
    items.push({
      id: "tl-system-degraded",
      type: "system",
      status: "warning",
      title: "⚙ Sistema degradado",
      detail: `Memória: ${cpuPct}%`,
      source: `system/${sys.hostname || "—"}`,
      timestamp: ts,
      timeLabel: fmtTime(ts),
      timeAgo: "agora",
      domain: "system",
      linkTo: "/system",
    });
  }
  return items;
}

// ═══════════════════════════════════════════════════════
// Fetcher principal
// ═══════════════════════════════════════════════════════

function buildSummary(items: TimelineItem[]): TimelineSummary {
  return {
    total: items.length,
    running: items.filter(i => i.status === "running").length,
    completed: items.filter(i => i.status === "completed").length,
    failed: items.filter(i => i.status === "failed").length,
    scheduled: items.filter(i => i.status === "scheduled").length,
    critical: items.filter(i => i.status === "critical" || i.status === "warning").length,
  };
}

const EMPTY: TimelinePageData = {
  items: [],
  summary: { total: 0, running: 0, completed: 0, failed: 0, scheduled: 0, critical: 0 },
};

export const fetchTimelinePage: DomainFetcher<TimelinePageData> = async () => {
  const [sessionsRaw, cronRaw, alertsRaw, agentsRaw, systemRaw] = await Promise.all([
    safeFetch<any>("/sessions", []),
    safeFetch<any>("/cron", []),
    safeFetch<any>("/alerts", []),
    safeFetch<any>("/agents", []),
    safeFetch<any>("/system", null),
  ]);

  const sessions = unwrap<any>(sessionsRaw, "sessions");
  const cronJobs = unwrap<any>(cronRaw, "jobs");
  const alerts = unwrap<any>(alertsRaw, "alerts");
  const agents = unwrap<any>(agentsRaw, "agents");

  const all: TimelineItem[] = [
    ...deriveFromSessions(sessions),
    ...deriveFromCron(cronJobs),
    ...deriveFromAlerts(alerts),
    ...deriveFromAgents(agents),
    ...deriveFromSystem(systemRaw),
  ];

  // Sort: running/critical first, then by timestamp desc
  all.sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, running: 1, warning: 2, failed: 3, scheduled: 4, completed: 5, info: 6 };
    const pa = priorityOrder[a.status] ?? 5;
    const pb = priorityOrder[b.status] ?? 5;
    if (pa !== pb) return pa - pb;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  if (all.length === 0) {
    return { data: EMPTY, source: "fallback", timestamp: new Date() };
  }

  return {
    data: { items: all, summary: buildSummary(all) },
    source: "api",
    timestamp: new Date(),
  };
};
