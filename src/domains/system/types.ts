/**
 * System Domain — Tipos Canônicos
 *
 * Shape baseado nas rotas locais do OpenClaw (/api/system, /api/system/services, etc.).
 * Este é o formato de referência do projeto-base.
 */

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type SystemState = "nominal" | "degraded" | "critical";

/** /api/system — dados brutos do runtime */
export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  cpuCount: number;
  cpuUsagePercent: number;
  memTotalBytes: number;
  memUsedBytes: number;
  memFreeBytes: number;
  diskTotalBytes: number;
  diskUsedBytes: number;
  diskFreeBytes: number;
  loadAvg: [number, number, number];
  state: SystemState;
  checkedAt: string;
}

/** /api/system/services — processos/serviços gerenciados */
export interface ProcessInfo {
  name: string;
  pid: number;
  status: "running" | "stopped" | "restarting" | "crashed";
  port: number | null;
  cpuPercent: number;
  memBytes: number;
  uptimeSeconds: number;
  restarts: number;
}

/** /api/system/stats — métricas complementares de estabilidade */
export interface SystemStats {
  requestsPerMin: number;
  avgResponseMs: number;
  errorRate: number;
  activeConnections: number;
  diskIoReadBytes: number;
  diskIoWriteBytes: number;
  networkRxBytes: number;
  networkTxBytes: number;
  temperature?: number;
}

/** /api/system/monitor — uptime histórico */
export interface UptimeEntry {
  date: string;
  uptimePercent: number;
  incidents: number;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type OverallStatus = "healthy" | "degraded" | "critical";
export type ServiceStatus = "running" | "degraded" | "stopped" | "restarting";
export type SignalLevel = "normal" | "elevated" | "critical";
export type DayStatus = "up" | "degraded" | "down" | "partial";

/** Dados do header — derivado de SystemInfo */
export interface SystemHeaderData {
  overallStatus: OverallStatus;
  host: string;
  uptime: string;
  lastCheck: string;
}

/** Gauge circular — derivado de SystemInfo */
export interface ResourceGauge {
  label: string;
  value: number;
  max: number;
  unit: string;
  detail: string;
  iconName: string;
}

/** Serviço na tabela — derivado de ProcessInfo */
export interface SystemService {
  name: string;
  status: ServiceStatus;
  port: string;
  cpu: string;
  mem: string;
  uptime: string;
  pid: string;
}

/** Sinal de estabilidade — derivado de SystemStats */
export interface StabilitySignal {
  label: string;
  value: string;
  level: SignalLevel;
  iconName: string;
  detail?: string;
}

/** Dia no timeline — derivado de UptimeEntry */
export interface UptimeDay {
  date: string;
  status: DayStatus;
}

/** Page model unificado para a UI */
export interface SystemPageData {
  header: SystemHeaderData;
  gauges: ResourceGauge[];
  services: SystemService[];
  signals: StabilitySignal[];
  uptimeDays: UptimeDay[];
  uptimePercent: string;
}

// ═══════════════════════════════════════════════════════
// Tipos legados mantidos para compatibilidade com Home
// ═══════════════════════════════════════════════════════

export interface CommandData {
  systemState: SystemState;
  metrics: { label: string; value: string; icon: string }[];
}

export type HealthStatus = "healthy" | "degraded" | "down";

export interface HealthService {
  name: string;
  status: HealthStatus;
  responseTime: string;
  uptime: string;
}
