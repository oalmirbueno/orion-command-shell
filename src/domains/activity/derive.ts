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
// Fetch helper (standalone — used when called independently)
// ═══════════════════════════════════════════════════════

async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
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

/** Unwrap common API wrappers */
function unwrapArray<T>(raw: any, key: string): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && key in raw) {
    const val = raw[key];
    return Array.isArray(val) ? val : [];
  }
  return [];
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `derived-activity-${prefix}-${counter}`;
}

function safeTimestamp(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  return String(val);
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

export function deriveFromSessions(sessions: Session[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const s of sessions) {
    const ageMs = s.ageMs ?? 0;
    const isRecent = ageMs < 300_000;
    const totalTokens = s.totalTokens ?? 0;
    const isRunning = !s.aborted && isRecent && totalTokens > 0;
    const emoji = s.typeEmoji || "💬";
    const label = s.typeLabel || s.type || "session";
    const model = s.model || "—";

    if (isRunning) {
      events.push(makeActivity("session.start", "info",
        `Sessão ${emoji} ${label} em andamento`,
        model,
        { detail: `${s.key} — ${totalTokens} tokens processados`, sessionId: s.id, createdAt: safeTimestamp(s.updatedAt) }));
    }

    if (s.aborted) {
      events.push(makeActivity("session.end", "error",
        `Sessão ${s.key} abortada`,
        model,
        { detail: `Tipo ${label} (${s.type})`, sessionId: s.id, createdAt: safeTimestamp(s.updatedAt) }));
    }

    if (!s.aborted && !isRecent && totalTokens > 0) {
      events.push(makeActivity("session.end", "info",
        `Sessão ${emoji} ${label} concluída`,
        model,
        { detail: `${s.key} — ${totalTokens} tokens`, sessionId: s.id, createdAt: safeTimestamp(s.updatedAt) }));
    }
  }

  return events;
}

export function deriveFromCron(jobs: CronJobInfo[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const job of jobs) {
    if (!job.enabled || !job.lastRunAt) continue;

    if (job.lastRunSuccess === false) {
      events.push(makeActivity("cron.run", (job.consecutiveFailures ?? 0) >= 3 ? "critical" : "warn",
        `Cron "${job.name}" falhou`,
        `cron/${job.id}`,
        { detail: job.lastRunError || `${job.consecutiveFailures ?? 0} falha(s) consecutiva(s)`, createdAt: job.lastRunAt }));
    } else {
      events.push(makeActivity("cron.run", "info",
        `Cron "${job.name}" executado com sucesso`,
        `cron/${job.id}`,
        { detail: `Duração: ${job.lastRunDurationMs ?? 0}ms`, createdAt: job.lastRunAt }));
    }
  }

  return events;
}

export function deriveFromAgents(agents: AgentInfo[]): ActivityInfo[] {
  const events: ActivityInfo[] = [];

  for (const agent of agents) {
    if (!agent.enabled && agent.enabled !== undefined) continue;

    const isOnline = agent.online ?? (agent as any).status === "online";
    const name = agent.name || agent.id;

    if (!isOnline) {
      events.push(makeActivity("agent.error", "warn",
        `Agent "${name}" offline`,
        `agent/${agent.id}`,
        { detail: `${agent.role || "agent"} (${agent.tier || "—"})`, agentId: agent.id, createdAt: agent.lastActivityAt }));
    }

    if (agent.currentTask && isOnline) {
      events.push(makeActivity("agent.task", "info",
        `Agent "${name}" executando: ${agent.currentTask}`,
        `agent/${agent.id}`,
        { agentId: agent.id, createdAt: agent.currentTaskStartedAt || agent.lastActivityAt }));
    }

    if ((agent.alertCount ?? 0) > 0) {
      events.push(makeActivity("agent.error", (agent.alertCount ?? 0) >= 3 ? "critical" : "warn",
        `Agent "${name}" com ${agent.alertCount} alerta(s)`,
        `agent/${agent.id}`,
        { agentId: agent.id, createdAt: agent.lastActivityAt }));
    }
  }

  return events;
}

export function deriveFromSystem(info: SystemInfo | null, processes: ProcessInfo[]): ActivityInfo[] {
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
// Derivação principal — com dados pré-carregados
// ═══════════════════════════════════════════════════════

export interface PreloadedDomainData {
  sessions?: Session[];
  cronJobs?: CronJobInfo[];
  agents?: AgentInfo[];
  systemInfo?: SystemInfo | null;
  processes?: ProcessInfo[];
}

/**
 * Derive activities from pre-loaded domain data (used by Home to avoid duplicate fetches).
 */
export function deriveActivitiesFromPreloaded(data: PreloadedDomainData): ActivityInfo[] {
  counter = 0;

  const all: ActivityInfo[] = [
    ...deriveFromSystem(data.systemInfo ?? null, data.processes ?? []),
    ...deriveFromAgents(data.agents ?? []),
    ...deriveFromSessions(data.sessions ?? []),
    ...deriveFromCron(data.cronJobs ?? []),
  ];

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all;
}

// ═══════════════════════════════════════════════════════
// Derivação standalone (fetches own data — used by Activity page)
// ═══════════════════════════════════════════════════════

interface SystemApiResponse {
  system: { uptime: number; hostname?: string; memory?: { total: number; used: number; free: number } };
  agent?: { name: string };
}

export async function deriveActivitiesFromDomains(): Promise<ActivityInfo[]> {
  counter = 0;

  const [sessionsRaw, cronRaw, agentsRaw, systemRaw] = await Promise.all([
    safeFetch<any>("/sessions", []),
    safeFetch<any>("/cron", []),
    safeFetch<any>("/agents", []),
    safeFetch<any>("/system", null),
  ]);

  const sessions = unwrapArray<Session>(sessionsRaw, "sessions");
  const cronJobs = unwrapArray<CronJobInfo>(cronRaw, "jobs");
  const agents = unwrapArray<AgentInfo>(agentsRaw, "agents");

  // Build minimal SystemInfo from real API response
  let systemInfo: SystemInfo | null = null;
  if (systemRaw?.system) {
    const sys = systemRaw.system;
    const mem = sys.memory || { total: 0, used: 0, free: 0 };
    const cpuPercent = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
    systemInfo = {
      hostname: sys.hostname || "unknown",
      platform: sys.platform || "linux",
      cpuUsagePercent: cpuPercent,
      memoryTotalBytes: mem.total,
      memoryUsedBytes: mem.used,
      uptimeSeconds: sys.uptime || 0,
      state: cpuPercent > 90 ? "critical" : cpuPercent > 75 ? "degraded" : "nominal",
    };
  }

  const all: ActivityInfo[] = [
    ...deriveFromSystem(systemInfo, []),
    ...deriveFromAgents(agents),
    ...deriveFromSessions(sessions),
    ...deriveFromCron(cronJobs),
  ];

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all;
}
