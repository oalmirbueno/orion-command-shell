/**
 * System Domain — Fetchers (real-first + fallback-safe)
 *
 * Real API shapes:
 *   /api/system → { agent, system: { uptime, memory, hostname, ... }, integrations, timestamp }
 *   /api/system/stats → { cpu, ram: { used, total }, disk: { used, total }, uptime, ... }
 *
 * These are transformed into the canonical SystemPageData for the UI.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  SystemInfo, ProcessInfo, SystemStats, UptimeEntry,
  SystemPageData, CommandData, HealthService,
  SystemHeaderData, ResourceGauge, SystemService,
  StabilitySignal, UptimeDay, OverallStatus, ServiceStatus, SignalLevel, DayStatus,
  SystemState,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shapes (as returned by runtime)
// ═══════════════════════════════════════════════════════

interface RealSystemResponse {
  agent?: { name: string; creature?: string; emoji?: string };
  system?: {
    uptime: number;
    uptimeFormatted?: string;
    nodeVersion?: string;
    model?: string;
    workspacePath?: string;
    platform?: string;
    hostname?: string;
    memory?: { total: number; free: number; used: number };
  };
  integrations?: Array<{
    id: string;
    name: string;
    status: string;
    icon?: string;
    lastActivity?: string | null;
    detail?: string | null;
  }>;
  timestamp?: string;
}

interface RealStatsResponse {
  cpu?: number;
  ram?: { used: number; total: number };
  disk?: { used: number; total: number };
  vpnActive?: boolean;
  firewallActive?: boolean;
  activeServices?: number;
  totalServices?: number;
  uptime?: string;
}

// ═══════════════════════════════════════════════════════
// Transform real shapes → canonical
// ═══════════════════════════════════════════════════════

function realToSystemInfo(sys: RealSystemResponse, stats: RealStatsResponse | null): SystemInfo {
  const s = sys.system || {} as RealSystemResponse["system"] & {};
  const mem = s?.memory || { total: 0, free: 0, used: 0 };
  const cpuPct = stats?.cpu ?? 0;
  const diskUsedGB = stats?.disk?.used ?? 0;
  const diskTotalGB = stats?.disk?.total ?? 1;

  return {
    hostname: s?.hostname || "unknown",
    platform: s?.platform || "linux",
    arch: "x64",
    nodeVersion: s?.nodeVersion || "—",
    uptimeSeconds: (s?.uptime ?? 0),
    cpuCount: 1,
    cpuUsagePercent: cpuPct,
    memTotalBytes: mem.total,
    memUsedBytes: mem.used,
    memFreeBytes: mem.free,
    diskTotalBytes: diskTotalGB * 1e9,
    diskUsedBytes: diskUsedGB * 1e9,
    diskFreeBytes: (diskTotalGB - diskUsedGB) * 1e9,
    loadAvg: [cpuPct / 100, 0, 0] as [number, number, number],
    state: cpuPct > 90 ? "critical" : cpuPct > 75 ? "degraded" : "nominal",
    checkedAt: sys.timestamp || new Date().toISOString(),
  };
}

function integrationsToProcesses(integrations: RealSystemResponse["integrations"]): ProcessInfo[] {
  if (!integrations) return [];
  return integrations.map((integ, i) => ({
    name: integ.name,
    pid: 1000 + i,
    status: integ.status === "connected" ? "running" as const :
            integ.status === "not_configured" ? "stopped" as const : "stopped" as const,
    port: null,
    cpuPercent: 0,
    memBytes: 0,
    uptimeSeconds: 0,
    restarts: 0,
  }));
}

// ═══════════════════════════════════════════════════════
// Transforms — canonical → view (unchanged)
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

/** Unified page model — fetches /api/system + /api/system/stats */
export const fetchSystemPage: DomainFetcher<SystemPageData> = async (): Promise<DomainResult<SystemPageData>> => {
  const systemFetcher = createRealFirstFetcher<RealSystemResponse, RealSystemResponse>({
    endpoint: "/system",
    fallbackData: {},
  });
  const statsFetcher = createRealFirstFetcher<RealStatsResponse, RealStatsResponse>({
    endpoint: "/system/stats",
    fallbackData: {},
  });

  const [systemResult, statsResult] = await Promise.all([systemFetcher(), statsFetcher()]);

  // If no real data at all
  if (!systemResult.data.system && !statsResult.data.cpu) {
    return { data: EMPTY_SYSTEM_PAGE, source: systemResult.source, timestamp: systemResult.timestamp };
  }

  const info = realToSystemInfo(systemResult.data, statsResult.data.cpu !== undefined ? statsResult.data : null);
  const processes = integrationsToProcesses(systemResult.data.integrations);

  const pageData: SystemPageData = {
    header: toHeader(info),
    gauges: toGauges(info),
    services: toServices(processes),
    signals: [],
    uptimeDays: [],
    uptimePercent: statsResult.data.uptime || formatUptime(info.uptimeSeconds),
  };

  return {
    data: pageData,
    source: systemResult.source === "api" || statsResult.source === "api" ? "api" : "fallback",
    timestamp: new Date(),
  };
};

/** Home widget — command status (derived from /system + /system/stats) */
export const fetchCommandStatus: DomainFetcher<CommandData> = async (): Promise<DomainResult<CommandData>> => {
  const result = await fetchSystemPage();
  const sys = result.data;

  const state: SystemState =
    sys.header.overallStatus === "critical" ? "critical" :
    sys.header.overallStatus === "degraded" ? "degraded" : "nominal";

  const cpuGauge = sys.gauges.find(g => g.label === "CPU");

  return {
    data: {
      systemState: state,
      metrics: [
        { label: "Disponib.", value: sys.uptimePercent || "—", icon: "Clock" },
        { label: "CPU", value: cpuGauge ? `${cpuGauge.value}%` : "—", icon: "Activity" },
        { label: "Serviços", value: `${sys.services.filter(s => s.status === "running").length}/${sys.services.length}`, icon: "Bot" },
        { label: "Host", value: sys.header.host, icon: "Zap" },
      ],
    },
    source: result.source,
    timestamp: result.timestamp,
  };
};

/** Home widget — health services (derived from integrations/processes) */
export const fetchHealthServices: DomainFetcher<HealthService[]> = async (): Promise<DomainResult<HealthService[]>> => {
  const result = await fetchSystemPage();
  const health: HealthService[] = result.data.services.map(svc => ({
    name: svc.name,
    status: svc.status === "running" ? "healthy" as const :
            svc.status === "stopped" ? "down" as const : "degraded" as const,
    responseTime: svc.cpu,
    uptime: svc.uptime,
  }));

  return { data: health, source: result.source, timestamp: result.timestamp };
};

/** Individual services fetcher */
export const fetchSystemServices: DomainFetcher<SystemPageData["services"]> = async (): Promise<DomainResult<SystemPageData["services"]>> => {
  const result = await fetchSystemPage();
  return { data: result.data.services, source: result.source, timestamp: result.timestamp };
};
