/**
 * System Domain — Fetchers (real-first + fallback-safe)
 *
 * Shape canônico: SystemInfo, ProcessInfo, SystemStats, UptimeEntry
 * Shape de UI: SystemPageData (derivado via transform)
 *
 * Estratégia:
 *   1. Tenta /api/system (shape canônico OpenClaw)
 *   2. Transform para SystemPageData (view model)
 *   3. Fallback vazio honesto em caso de erro
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  SystemInfo, ProcessInfo, SystemStats, UptimeEntry,
  SystemPageData, CommandData, HealthService,
  SystemHeaderData, ResourceGauge, SystemService,
  StabilitySignal, UptimeDay, OverallStatus, ServiceStatus, SignalLevel, DayStatus,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Transforms — canônico → view
// ═══════════════════════════════════════════════════════

function formatUptime(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)}GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)}MB`;
  return `${(bytes / 1e3).toFixed(0)}KB`;
}

function stateToStatus(state: string): OverallStatus {
  if (state === "critical") return "critical";
  if (state === "degraded") return "degraded";
  return "healthy";
}

function toHeader(info: SystemInfo): SystemHeaderData {
  return {
    overallStatus: stateToStatus(info.state),
    host: info.hostname,
    uptime: formatUptime(info.uptimeSeconds),
    lastCheck: new Date(info.checkedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function toGauges(info: SystemInfo): ResourceGauge[] {
  const memPct = info.memTotalBytes > 0 ? Math.round((info.memUsedBytes / info.memTotalBytes) * 100) : 0;
  const diskPct = info.diskTotalBytes > 0 ? Math.round((info.diskUsedBytes / info.diskTotalBytes) * 100) : 0;

  return [
    {
      label: "CPU", value: Math.round(info.cpuUsagePercent), max: 100, unit: "%",
      detail: `${info.cpuCount} cores · load ${info.loadAvg[0].toFixed(1)}`,
      iconName: "Cpu",
    },
    {
      label: "Memória", value: memPct, max: 100, unit: "%",
      detail: `${formatBytes(info.memUsedBytes)} / ${formatBytes(info.memTotalBytes)}`,
      iconName: "MemoryStick",
    },
    {
      label: "Disco", value: diskPct, max: 100, unit: "%",
      detail: `${formatBytes(info.diskUsedBytes)} / ${formatBytes(info.diskTotalBytes)}`,
      iconName: "HardDrive",
    },
    {
      label: "Uptime", value: info.uptimeSeconds, max: info.uptimeSeconds, unit: formatUptime(info.uptimeSeconds),
      detail: `${info.platform} ${info.arch}`,
      iconName: "Clock",
    },
  ];
}

function processStatusToService(status: string): ServiceStatus {
  if (status === "crashed") return "stopped";
  if (status === "restarting") return "restarting";
  if (status === "stopped") return "stopped";
  return "running";
}

function toServices(processes: ProcessInfo[]): SystemService[] {
  return processes.map(p => ({
    name: p.name,
    status: processStatusToService(p.status),
    port: p.port ? String(p.port) : "—",
    cpu: `${p.cpuPercent.toFixed(1)}%`,
    mem: formatBytes(p.memBytes),
    uptime: formatUptime(p.uptimeSeconds),
    pid: String(p.pid),
  }));
}

function toSignals(stats: SystemStats): StabilitySignal[] {
  const signals: StabilitySignal[] = [];

  const errorLevel: SignalLevel = stats.errorRate > 5 ? "critical" : stats.errorRate > 1 ? "elevated" : "normal";
  signals.push({
    label: "Taxa de Erro", value: `${stats.errorRate.toFixed(1)}%`,
    level: errorLevel, iconName: "ShieldAlert",
    detail: `${stats.requestsPerMin} req/min`,
  });

  const latencyLevel: SignalLevel = stats.avgResponseMs > 500 ? "critical" : stats.avgResponseMs > 200 ? "elevated" : "normal";
  signals.push({
    label: "Latência Média", value: `${Math.round(stats.avgResponseMs)}ms`,
    level: latencyLevel, iconName: "Clock",
    detail: `${stats.activeConnections} conexões ativas`,
  });

  if (stats.temperature !== undefined) {
    const tempLevel: SignalLevel = stats.temperature > 80 ? "critical" : stats.temperature > 65 ? "elevated" : "normal";
    signals.push({
      label: "Temperatura", value: `${stats.temperature}°C`,
      level: tempLevel, iconName: "ThermometerSun",
    });
  }

  signals.push({
    label: "I/O Disco", value: `${formatBytes(stats.diskIoReadBytes + stats.diskIoWriteBytes)}/s`,
    level: "normal", iconName: "HardDrive",
    detail: `R: ${formatBytes(stats.diskIoReadBytes)} W: ${formatBytes(stats.diskIoWriteBytes)}`,
  });

  signals.push({
    label: "Rede", value: `${formatBytes(stats.networkRxBytes + stats.networkTxBytes)}/s`,
    level: "normal", iconName: "Wifi",
    detail: `↓ ${formatBytes(stats.networkRxBytes)} ↑ ${formatBytes(stats.networkTxBytes)}`,
  });

  return signals;
}

function toUptimeDays(entries: UptimeEntry[]): UptimeDay[] {
  return entries.map(e => {
    let status: DayStatus = "up";
    if (e.uptimePercent < 50) status = "down";
    else if (e.uptimePercent < 95) status = "degraded";
    else if (e.incidents > 0) status = "partial";
    return { date: e.date, status };
  });
}

function computeUptimePercent(entries: UptimeEntry[]): string {
  if (entries.length === 0) return "—";
  const avg = entries.reduce((sum, e) => sum + e.uptimePercent, 0) / entries.length;
  return `${avg.toFixed(2)}%`;
}

// ═══════════════════════════════════════════════════════
// Shapes de resposta da API (podem vir combinados ou separados)
// ═══════════════════════════════════════════════════════

interface SystemApiResponse {
  info: SystemInfo;
  processes?: ProcessInfo[];
  stats?: SystemStats;
  uptime?: UptimeEntry[];
}

// ═══════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════

const EMPTY_SYSTEM_PAGE: SystemPageData = {
  header: { overallStatus: "healthy", host: "—", uptime: "—", lastCheck: "—" },
  gauges: [],
  services: [],
  signals: [],
  uptimeDays: [],
  uptimePercent: "—",
};

const EMPTY_COMMAND: CommandData = {
  systemState: "nominal",
  metrics: [
    { label: "Disponib.", value: "—", icon: "Clock" },
    { label: "Agentes", value: "—", icon: "Bot" },
    { label: "Sessões", value: "—", icon: "Activity" },
    { label: "Tokens/h", value: "—", icon: "Zap" },
  ],
};

/** Unified page model — tenta /api/system que retorna SystemApiResponse */
export const fetchSystemPage: DomainFetcher<SystemPageData> = async (): Promise<DomainResult<SystemPageData>> => {
  const baseFetcher = createRealFirstFetcher<SystemApiResponse, SystemApiResponse>({
    endpoint: "/system",
    fallbackData: { info: {} as SystemInfo },
  });

  const result = await baseFetcher();

  // Se veio fallback vazio (sem backend), retorna empty state
  if (!result.data.info?.hostname) {
    return { data: EMPTY_SYSTEM_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const { info, processes = [], stats, uptime = [] } = result.data;

  const pageData: SystemPageData = {
    header: toHeader(info),
    gauges: toGauges(info),
    services: toServices(processes),
    signals: stats ? toSignals(stats) : [],
    uptimeDays: toUptimeDays(uptime),
    uptimePercent: computeUptimePercent(uptime),
  };

  return { data: pageData, source: result.source, timestamp: result.timestamp };
};

/** Home widget — command status */
export const fetchCommandStatus: DomainFetcher<CommandData> = createRealFirstFetcher({
  endpoint: "/system/command",
  fallbackData: EMPTY_COMMAND,
});

/** Home widget — health services */
export const fetchHealthServices: DomainFetcher<HealthService[]> = createRealFirstFetcher({
  endpoint: "/system/health",
  fallbackData: [],
});

/** Individual services fetcher */
export const fetchSystemServices: DomainFetcher<SystemPageData["services"]> = async (): Promise<DomainResult<SystemPageData["services"]>> => {
  const baseFetcher = createRealFirstFetcher<ProcessInfo[], ProcessInfo[]>({
    endpoint: "/system/services",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: toServices(result.data),
    source: result.source,
    timestamp: result.timestamp,
  };
};
