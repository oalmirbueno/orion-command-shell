/**
 * Activity — Derivação client-side de sinais reais
 *
 * Quando /api/activities retorna vazio ou indisponível (modo standalone),
 * esta camada agrega sinais dos domínios já existentes para
 * produzir ActivityInfo[] derivados.
 *
 * Fontes: Sessions, Cron, Agents, System
 */

import { apiUrl } from "../api";
import type { ActivityInfo, ActivityType, ActivityLevel } from "./types";
import type { Session } from "../sessions/types";
import type { CronJobInfo } from "../cron/types";
import type { AgentInfo } from "../agents/types";
import type { SystemInfo, ProcessInfo } from "../system/types";

// ═══════════════════════════════════════════════════════
// Fetch helper
// ═══════════════════════════════════════════════════════

async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
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

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `derived-activity-${prefix}-${counter}`;
}

function makeActivity(
  type: ActivityType,
  level: ActivityLevel,
  message: string,
  source: string,
  opts?: { detail?: string; agentId?: string; sessionId?: string; createdAt?: string },
): ActivityInfo {
  return {
    id: nextId(type),
    type,
    level,
    message,
    detail: opts?.detail ?? null,
    source,
    agentId: opts?.agentId ?? null,
    sessionId: opts?.sessionId ?? null,
    createdAt: opts?.createdAt ?? new Date().toISOString(),
    metadata: null,
  };
}

// ═══════════════════════════════════════════════════════
// Derivação por domínio
// ═══════════════════════════════════════════════════════

function deriveFromSessions(sessions: Session[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const s of sessions) {
    const isRecent = s.ageMs < 300_000; // 5 min
    const isRunning = !s.aborted && isRecent && s.totalTokens > 0;

    if (isRunning) {
      events.push(makeActivity("session.start", "info",
        `Sessão ${s.typeEmoji} ${s.typeLabel} em andamento`,
        s.model,
        { detail: `${s.key} — ${s.totalTokens} tokens processados`, sessionId: s.id, createdAt: s.updatedAt }));
    }

    if (s.aborted) {
      events.push(makeActivity("session.end", "error",
        `Sessão ${s.key} abortada`,
        s.model,
        { detail: `Tipo ${s.typeLabel} (${s.type})`, sessionId: s.id, createdAt: s.updatedAt }));
    }

    if (!s.aborted && !isRecent && s.totalTokens > 0) {
      events.push(makeActivity("session.end", "info",
        `Sessão ${s.typeEmoji} ${s.typeLabel} concluída`,
        s.model,
        { detail: `${s.key} — ${s.totalTokens} tokens`, sessionId: s.id, createdAt: s.updatedAt }));
    }
  }

  return events;
}

function deriveFromCron(jobs: CronJobInfo[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const job of jobs) {
    if (!job.enabled || !job.lastRunAt) continue;

    if (job.lastRunSuccess === false) {
      events.push(makeActivity("cron.run", job.consecutiveFailures >= 3 ? "critical" : "warn",
        `Cron "${job.name}" falhou`,
        `cron/${job.id}`,
        { detail: job.lastRunError || `${job.consecutiveFailures} falha(s) consecutiva(s)`, createdAt: job.lastRunAt }));
    } else {
      events.push(makeActivity("cron.run", "info",
        `Cron "${job.name}" executado com sucesso`,
        `cron/${job.id}`,
        { detail: `Duração: ${job.lastRunDurationMs ?? 0}ms`, createdAt: job.lastRunAt }));
    }
  }

  return events;
}

function deriveFromAgents(agents: AgentInfo[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const agent of agents) {
    if (!agent.enabled) continue;

    if (!agent.online) {
      events.push(makeActivity("agent.error", "warn",
        `Agent "${agent.name}" offline`,
        `agent/${agent.id}`,
        { detail: `${agent.role} (${agent.tier})`, agentId: agent.id, createdAt: agent.lastActivityAt }));
    }

    if (agent.currentTask && agent.online) {
      events.push(makeActivity("agent.task", "info",
        `Agent "${agent.name}" executando: ${agent.currentTask}`,
        `agent/${agent.id}`,
        { agentId: agent.id, createdAt: agent.currentTaskStartedAt || agent.lastActivityAt }));
    }

    if (agent.alertCount > 0) {
      events.push(makeActivity("agent.error", agent.alertCount >= 3 ? "critical" : "warn",
        `Agent "${agent.name}" com ${agent.alertCount} alerta(s)`,
        `agent/${agent.id}`,
        { agentId: agent.id, createdAt: agent.lastActivityAt }));
    }
  }

  return events;
}

function deriveFromSystem(info: SystemInfo | null, processes: ProcessInfo[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];
  if (!info) return events;

  if (info.state === "critical") {
    events.push(makeActivity("system.health", "critical",
      `Sistema em estado crítico`,
      `system/${info.hostname}`,
      { detail: `CPU: ${Math.round(info.cpuUsagePercent)}% | Uptime: ${Math.round(info.uptimeSeconds / 60)}min` }));
  } else if (info.state === "degraded") {
    events.push(makeActivity("system.health", "warn",
      `Sistema degradado`,
      `system/${info.hostname}`,
      { detail: `CPU: ${Math.round(info.cpuUsagePercent)}%` }));
  }

  for (const proc of processes) {
    if (proc.status === "crashed") {
      events.push(makeActivity("system.stop", "critical",
        `Serviço ${proc.name} crashed`,
        `system/${proc.name}`,
        { detail: `PID ${proc.pid} — ${proc.restarts} restarts` }));
    } else if (proc.status === "stopped") {
      events.push(makeActivity("system.stop", "warn",
        `Serviço ${proc.name} parado`,
        `system/${proc.name}`,
        { detail: `PID ${proc.pid}` }));
    }
  }

  return events;
}

// ═══════════════════════════════════════════════════════
// Derivação principal
// ═══════════════════════════════════════════════════════

interface SystemApiResponse {
  info: SystemInfo;
  processes?: ProcessInfo[];
}

export async function deriveActivitiesFromDomains(): Promise<ActivityInfo[]> {
  counter = 0;

  const [sessions, cronJobs, agents, systemData] = await Promise.all([
    safeFetch<Session[]>("/sessions", []),
    safeFetch<CronJobInfo[]>("/cron", []),
    safeFetch<AgentInfo[]>("/agents", []),
    safeFetch<SystemApiResponse | null>("/system", null),
  ]);

  const all: ActivityInfo[] = [
    ...deriveFromSystem(systemData?.info ?? null, systemData?.processes ?? []),
    ...deriveFromAgents(agents),
    ...deriveFromSessions(sessions),
    ...deriveFromCron(cronJobs),
  ];

  // Ordenar por data (mais recente primeiro)
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return all;
}
