// Reminders & News — Fetcher derivado dos domínios existentes
// Compõe lembretes de alertas/cron/operações e notícias de atividade/memória.

import { fetchAlertsPage } from "../alerts/fetcher";
import { fetchCronPage } from "../cron/fetcher";
import { fetchActivityPage } from "../activity/fetcher";
import { fetchOperationsPage } from "../operations/fetcher";
import { fetchSessions } from "../sessions/fetcher";
import type { AlertsPageData } from "../alerts/types";
import type { DomainFetcher, DomainResult, DataSource } from "../types";
import type { RemindersPageData, Reminder, NewsItem, RemindersSummary } from "./types";

const EMPTY: RemindersPageData = {
  reminders: [],
  news: [],
  summary: { totalReminders: 0, pending: 0, overdue: 0, upcoming: 0, totalNews: 0 },
};

function settled<T>(r: PromiseSettledResult<T>, fb: T): T {
  return r.status === "fulfilled" ? r.value : fb;
}

function formatTimeAgo(ts: string | number): string {
  const t = typeof ts === "number" ? ts : new Date(ts).getTime();
  if (isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function formatTime(ts: string | number): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export const fetchRemindersPage: DomainFetcher<RemindersPageData> = async (): Promise<DomainResult<RemindersPageData>> => {
  const results = await Promise.allSettled([
    fetchAlerts(),
    fetchCronPage(),
    fetchActivityPage(),
    fetchOperationsPage(),
    fetchSessions(),
  ]);

  const emptyAlerts = { data: { alerts: [], summary: { critical: 0, warning: 0, info: 0, resolved: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptyCron = { data: { jobs: [], summary: { active: 0, healthy: 0, failed: 0, disabled: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptyActivity = { data: { events: [], summary: { total: 0, critical: 0, warning: 0, resolved: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptyOps = { data: { tasks: [], timeline: [], liveOps: [], summary: { total: 0, running: 0, queued: 0, done: 0, failed: 0, criticalActive: 0 } }, source: "fallback" as DataSource, timestamp: new Date() };
  const emptySessions = { data: [], source: "fallback" as DataSource, timestamp: new Date() };

  const alertsR = settled(results[0], emptyAlerts);
  const cronR = settled(results[1], emptyCron);
  const activityR = settled(results[2], emptyActivity);
  const opsR = settled(results[3], emptyOps);
  const sessionsR = settled(results[4], emptySessions);

  const reminders: Reminder[] = [];
  const news: NewsItem[] = [];
  let rid = 0;
  let nid = 0;

  // ── Lembretes de Alertas (abertos = pendentes) ──
  const alerts = alertsR.data?.alerts || [];
  for (const a of alerts) {
    if (a.severity === "resolved") continue;
    reminders.push({
      id: `rem-alert-${++rid}`,
      title: a.title || "Alerta sem título",
      detail: a.description || a.action || "—",
      source: "alert",
      status: a.severity === "critical" ? "overdue" : "pending",
      timestamp: a.triggeredAt || "—",
      timeAgo: a.triggeredAgo || formatTimeAgo(a.triggeredAt || ""),
      route: "/alerts",
    });
  }

  // ── Lembretes de Cron (falhas = pendente, próximas = upcoming) ──
  const cronJobs = cronR.data?.jobs || [];
  for (const j of cronJobs) {
    if (j.status === "failed") {
      reminders.push({
        id: `rem-cron-${++rid}`,
        title: `Cron "${j.name}" requer atenção`,
        detail: j.error || `${j.consecutiveFails} falha(s) consecutiva(s)`,
        source: "cron",
        status: "overdue",
        timestamp: j.lastRun || "—",
        timeAgo: j.lastRunAgo || "—",
        route: "/cron",
      });
    } else if (j.enabled && j.nextRun && j.nextRun !== "—") {
      reminders.push({
        id: `rem-cron-${++rid}`,
        title: `Cron "${j.name}" agendado`,
        detail: `Próxima execução: ${j.nextRunIn || j.nextRun}`,
        source: "cron",
        status: "upcoming",
        timestamp: j.nextRun,
        timeAgo: j.nextRunIn || "—",
        route: "/cron",
      });
    }
  }

  // ── Lembretes de Operações (falhas/bloqueios) ──
  const ops = opsR.data?.tasks || [];
  for (const op of ops) {
    if (op.status === "failed" || op.status === "blocked") {
      reminders.push({
        id: `rem-op-${++rid}`,
        title: `Operação "${op.title}" ${op.status === "failed" ? "falhou" : "bloqueada"}`,
        detail: op.detail || op.source || "—",
        source: "operation",
        status: "overdue",
        timestamp: op.time || "—",
        timeAgo: op.timeAgo || "—",
        route: "/operations",
      });
    }
  }

  // ── Lembretes de Sessões (abortadas/falhando) ──
  const sessionsList = Array.isArray(sessionsR.data) ? sessionsR.data : (sessionsR.data as any)?.sessions || [];
  for (const s of sessionsList.slice(0, 10)) {
    if (s.status === "failed" || s.aborted) {
      reminders.push({
        id: `rem-sess-${++rid}`,
        title: `Sessão ${s.typeLabel || s.type || ""} abortada`,
        detail: `${s.key || s.id || "—"} — ${s.tokens || 0} tokens`,
        source: "session",
        status: "pending",
        timestamp: s.startedAt || "—",
        timeAgo: s.elapsed || formatTimeAgo(s.startedAt || s.updatedAt || ""),
        route: "/sessions",
      });
    }
  }

  // ── Notícias/Briefings de Atividade ──
  const events = activityR.data?.events || [];
  for (const e of events.slice(0, 15)) {
    const priority = e.priority === "critical" ? "critical" as const :
      e.priority === "warning" ? "warning" as const :
      e.priority === "success" ? "success" as const : "info" as const;
    const route =
      e.category === "session" ? "/sessions" :
      e.category === "agent" ? "/agents" :
      e.category === "system" ? "/system" :
      e.category === "security" ? "/alerts" : "/activity";
    news.push({
      id: `news-${++nid}`,
      title: e.title,
      detail: e.description || "—",
      source: e.source || "—",
      priority,
      category: e.category || "geral",
      timestamp: e.time || "—",
      timeAgo: e.timeAgo || "—",
      route,
    });
  }

  // ── Notícias de Cron (execuções recentes bem-sucedidas) ──
  for (const j of cronJobs) {
    if (j.status === "healthy" && j.lastResult === "success" && j.lastRun !== "—") {
      news.push({
        id: `news-${++nid}`,
        title: `Cron "${j.name}" executado com sucesso`,
        detail: `Duração: ${j.lastDuration} | ${j.consecutiveSuccess} sucesso(s) consecutivo(s)`,
        source: "cron",
        priority: "success",
        category: "cron",
        timestamp: j.lastRun,
        timeAgo: j.lastRunAgo || "—",
        route: "/cron",
      });
    }
  }

  // ── Notícias de Operações concluídas ──
  for (const op of ops) {
    if (op.status === "done" || op.status === "completed") {
      news.push({
        id: `news-${++nid}`,
        title: `Operação "${op.title}" concluída`,
        detail: op.detail || "—",
        source: op.source || "operations",
        priority: "success",
        category: "operação",
        timestamp: op.time || "—",
        timeAgo: op.timeAgo || "—",
        route: "/operations",
      });
    }
  }

  // Sort reminders: overdue first, then pending, then upcoming
  const statusOrder: Record<string, number> = { overdue: 0, pending: 1, upcoming: 2, done: 3 };
  reminders.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  // Sort news: critical first
  const prioOrder: Record<string, number> = { critical: 0, warning: 1, success: 2, info: 3 };
  news.sort((a, b) => (prioOrder[a.priority] ?? 9) - (prioOrder[b.priority] ?? 9));

  const summary: RemindersSummary = {
    totalReminders: reminders.length,
    pending: reminders.filter(r => r.status === "pending").length,
    overdue: reminders.filter(r => r.status === "overdue").length,
    upcoming: reminders.filter(r => r.status === "upcoming").length,
    totalNews: news.length,
  };

  const anyApi = [alertsR, cronR, activityR, opsR, sessionsR].some(r => r.source === "api");

  return {
    data: { reminders, news, summary },
    source: anyApi ? "api" : "fallback",
    timestamp: new Date(),
  };
};
