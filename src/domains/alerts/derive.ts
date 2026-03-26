/**
 * Alerts — Derivação client-side de sinais reais
 *
 * Quando /api/alerts não está disponível (modo standalone),
 * esta camada agrega sinais dos domínios já existentes para
 * produzir AlertInfo[] derivados.
 *
 * Fontes: System, Cron, Activity, Sessions, Agents
 */

import { apiUrl } from "../api";
import type { AlertInfo, AlertSeverity, AlertStatus, AlertDomain } from "./types";
import type { SystemInfo, ProcessInfo, SystemStats } from "../system/types";
import type { CronJobInfo } from "../cron/types";
import type { ActivityInfo } from "../activity/types";
import type { Session } from "../sessions/types";
import type { AgentInfo } from "../agents/types";

// ═══════════════════════════════════════════════════════
// Fetch helpers (silencioso — retorna [] em erro)
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

let alertCounter = 0;
function nextId(prefix: string): string {
  alertCounter += 1;
  return `derived-${prefix}-${alertCounter}`;
}

function makeAlert(
  domain: AlertDomain,
  severity: AlertSeverity,
  title: string,
  message: string,
  source: string,
  opts?: { action?: string; status?: AlertStatus; metadata?: Record<string, unknown> },
): AlertInfo {
  const now = new Date().toISOString();
  return {
    id: nextId(domain),
    severity,
    status: opts?.status ?? "open",
    title,
    message,
    action: opts?.action ?? null,
    source,
    domain,
    createdAt: now,
    updatedAt: now,
    acknowledgedAt: null,
    resolvedAt: null,
    occurrences: 1,
    metadata: opts?.metadata ?? null,
  };
}

// ═══════════════════════════════════════════════════════
// Derivação por domínio
// ═══════════════════════════════════════════════════════

function deriveFromSystem(
  info: SystemInfo | null,
  processes: ProcessInfo[],
  stats: SystemStats | null,
): AlertInfo[] {
  const alerts: AlertInfo[] = [];
  if (!info) return alerts;

  // Estado geral crítico ou degradado
  if (info.state === "critical") {
    alerts.push(makeAlert("system", "critical", "Sistema em estado crítico",
      `Host ${info.hostname} reportando estado crítico`, "system/state",
      { action: "Verificar recursos do sistema imediatamente" }));
  } else if (info.state === "degraded") {
    alerts.push(makeAlert("system", "warning", "Sistema degradado",
      `Host ${info.hostname} operando em modo degradado`, "system/state",
      { action: "Monitorar carga e verificar serviços" }));
  }

  // CPU acima de 90%
  if (info.cpuUsagePercent > 90) {
    alerts.push(makeAlert("system", "critical", `CPU acima de ${Math.round(info.cpuUsagePercent)}%`,
      `Carga elevada no host ${info.hostname} há ${Math.round(info.uptimeSeconds / 60)} min de uptime`,
      "system/cpu", { action: "Verificar processos em execução" }));
  } else if (info.cpuUsagePercent > 75) {
    alerts.push(makeAlert("system", "warning", `CPU em ${Math.round(info.cpuUsagePercent)}%`,
      `Carga moderadamente alta no host ${info.hostname}`, "system/cpu",
      { action: "Monitorar tendência de uso" }));
  }

  // Memória acima de 90%
  const memPct = info.memTotalBytes > 0 ? (info.memUsedBytes / info.memTotalBytes) * 100 : 0;
  if (memPct > 90) {
    alerts.push(makeAlert("system", "critical", `Memória acima de ${Math.round(memPct)}%`,
      `Uso de memória elevado no host ${info.hostname}`, "system/memory",
      { action: "Verificar processos consumindo memória" }));
  } else if (memPct > 80) {
    alerts.push(makeAlert("system", "warning", `Memória em ${Math.round(memPct)}%`,
      `Uso de memória moderado no host ${info.hostname}`, "system/memory",
      { action: "Monitorar consumo de memória" }));
  }

  // Disco acima de 90%
  const diskPct = info.diskTotalBytes > 0 ? (info.diskUsedBytes / info.diskTotalBytes) * 100 : 0;
  if (diskPct > 90) {
    alerts.push(makeAlert("system", "critical", `Disco acima de ${Math.round(diskPct)}%`,
      `Espaço em disco quase esgotado`, "system/disk",
      { action: "Liberar espaço ou expandir volume" }));
  } else if (diskPct > 80) {
    alerts.push(makeAlert("system", "warning", `Disco em ${Math.round(diskPct)}%`,
      `Espaço em disco moderado`, "system/disk",
      { action: "Monitorar crescimento de uso" }));
  }

  // Processos crashed ou stopped
  for (const proc of processes) {
    if (proc.status === "crashed") {
      alerts.push(makeAlert("system", "critical", `Serviço ${proc.name} crashed`,
        `PID ${proc.pid} — ${proc.restarts} restarts registrados`, `system/${proc.name}`,
        { action: `Verificar logs do serviço ${proc.name}` }));
    } else if (proc.status === "stopped") {
      alerts.push(makeAlert("system", "warning", `Serviço ${proc.name} parado`,
        `PID ${proc.pid} — serviço não está em execução`, `system/${proc.name}`,
        { action: `Reiniciar serviço ${proc.name}` }));
    }
  }

  // Error rate elevada
  if (stats && stats.errorRate > 5) {
    alerts.push(makeAlert("system", "critical", `Taxa de erro em ${stats.errorRate.toFixed(1)}%`,
      `${stats.requestsPerMin} req/min com taxa de erro elevada`, "system/stats",
      { action: "Investigar endpoints com falha" }));
  } else if (stats && stats.errorRate > 1) {
    alerts.push(makeAlert("system", "warning", `Taxa de erro em ${stats.errorRate.toFixed(1)}%`,
      `${stats.requestsPerMin} req/min com erros acima do normal`, "system/stats",
      { action: "Monitorar taxa de erro" }));
  }

  return alerts;
}

function deriveFromCron(jobs: CronJobInfo[]): AlertInfo[] {
  const alerts: AlertInfo[] = [];

  for (const job of jobs) {
    if (!job.enabled) continue;

    if (job.consecutiveFailures >= 3) {
      alerts.push(makeAlert("cron", "critical",
        `Cron "${job.name}" com ${job.consecutiveFailures} falhas consecutivas`,
        job.lastRunError || `Job falhando consistentemente`,
        `cron/${job.id}`,
        { action: `Verificar logs do job ${job.name}`, metadata: { jobId: job.id } }));
    } else if (job.consecutiveFailures > 0) {
      alerts.push(makeAlert("cron", "warning",
        `Cron "${job.name}" com falha recente`,
        job.lastRunError || `${job.consecutiveFailures} falha(s) consecutiva(s)`,
        `cron/${job.id}`,
        { action: `Monitorar próxima execução de ${job.name}`, metadata: { jobId: job.id } }));
    }
  }

  return alerts;
}

function deriveFromActivity(events: ActivityInfo[]): AlertInfo[] {
  const alerts: AlertInfo[] = [];

  // Apenas os 50 mais recentes para não sobrecarregar
  const recent = events.slice(0, 50);

  for (const evt of recent) {
    if (evt.level === "critical") {
      alerts.push(makeAlert("activity", "critical", evt.message,
        evt.detail || `Evento crítico de ${evt.source}`, `activity/${evt.source}`,
        { metadata: { activityId: evt.id, type: evt.type } }));
    }
  }

  // Security alerts
  const securityEvents = recent.filter(e => e.type === "security.alert");
  for (const evt of securityEvents) {
    if (evt.level !== "critical") {
      alerts.push(makeAlert("security", "warning", evt.message,
        evt.detail || "Alerta de segurança detectado", `security/${evt.source}`,
        { action: "Revisar evento de segurança" }));
    }
  }

  // Pipeline failures
  const pipelineFailures = recent.filter(e => e.type === "pipeline.fail");
  for (const evt of pipelineFailures) {
    if (evt.level !== "critical") {
      alerts.push(makeAlert("pipeline", "warning", evt.message,
        evt.detail || "Pipeline com falha", `pipeline/${evt.source}`,
        { action: "Verificar execução do pipeline" }));
    }
  }

  return alerts;
}

function deriveFromSessions(sessions: Session[]): AlertInfo[] {
  const alerts: AlertInfo[] = [];

  const aborted = sessions.filter(s => s.aborted);
  if (aborted.length >= 3) {
    alerts.push(makeAlert("session", "warning",
      `${aborted.length} sessões abortadas recentemente`,
      `Múltiplas sessões abortadas detectadas`,
      "session/aborted",
      { action: "Verificar logs das sessões recentes", metadata: { count: aborted.length } }));
  } else if (aborted.length > 0) {
    for (const s of aborted) {
      alerts.push(makeAlert("session", "info",
        `Sessão ${s.key} abortada`,
        `Tipo ${s.typeLabel} (${s.model})`,
        `session/${s.id}`,
        { metadata: { sessionId: s.id } }));
    }
  }

  return alerts;
}

function deriveFromAgents(agents: AgentInfo[]): AlertInfo[] {
  const alerts: AlertInfo[] = [];

  for (const agent of agents) {
    if (!agent.enabled) continue;

    if (!agent.online) {
      alerts.push(makeAlert("agent", "warning",
        `Agent "${agent.name}" offline`,
        `${agent.role} (${agent.tier}) — não está respondendo`,
        `agent/${agent.id}`,
        { action: `Verificar status do agent ${agent.name}` }));
    }

    if (agent.alertCount > 0) {
      alerts.push(makeAlert("agent", agent.alertCount >= 3 ? "critical" : "warning",
        `Agent "${agent.name}" com ${agent.alertCount} alerta(s)`,
        `${agent.role} — ${agent.currentTask || "sem tarefa ativa"}`,
        `agent/${agent.id}`,
        { metadata: { agentId: agent.id, alertCount: agent.alertCount } }));
    }
  }

  return alerts;
}

// ═══════════════════════════════════════════════════════
// Derivação principal — agrega todos os domínios
// ═══════════════════════════════════════════════════════

interface SystemApiResponse {
  info: SystemInfo;
  processes?: ProcessInfo[];
  stats?: SystemStats;
}

export async function deriveAlertsFromDomains(): Promise<AlertInfo[]> {
  // Reset counter para evitar IDs crescentes entre chamadas
  alertCounter = 0;

  // Fetch paralelo de todos os domínios
  const [systemData, cronJobs, activities, sessions, agents] = await Promise.all([
    safeFetch<SystemApiResponse | null>("/system", null),
    safeFetch<CronJobInfo[]>("/cron", []),
    safeFetch<ActivityInfo[]>("/activities", []),
    safeFetch<Session[]>("/sessions", []),
    safeFetch<AgentInfo[]>("/agents", []),
  ]);

  const allAlerts: AlertInfo[] = [];

  // Derivar de cada domínio
  if (systemData?.info) {
    allAlerts.push(...deriveFromSystem(
      systemData.info,
      systemData.processes || [],
      systemData.stats || null,
    ));
  }

  allAlerts.push(...deriveFromCron(cronJobs));
  allAlerts.push(...deriveFromActivity(activities));
  allAlerts.push(...deriveFromSessions(sessions));
  allAlerts.push(...deriveFromAgents(agents));

  // Ordenar por severidade (critical > warning > info)
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return allAlerts;
}
