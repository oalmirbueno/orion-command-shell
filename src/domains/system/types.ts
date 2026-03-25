export type SystemState = "nominal" | "degraded" | "critical";

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

export type ServiceStatus = "running" | "degraded" | "stopped" | "restarting";

export interface SystemService {
  name: string;
  status: ServiceStatus;
  port: string;
  cpu: string;
  mem: string;
  uptime: string;
  pid: string;
}

/** Overall system status for the header */
export type OverallStatus = "healthy" | "degraded" | "critical";

/** Resource gauge data */
export interface ResourceGauge {
  label: string;
  value: number;
  max: number;
  unit: string;
  detail: string;
  iconName: string;
}

/** Stability signal */
export type SignalLevel = "normal" | "elevated" | "critical";

export interface StabilitySignal {
  label: string;
  value: string;
  level: SignalLevel;
  iconName: string;
  detail?: string;
}

/** Uptime day entry */
export type DayStatus = "up" | "degraded" | "down" | "partial";

export interface UptimeDay {
  date: string;
  status: DayStatus;
}

/** System header info */
export interface SystemHeaderData {
  overallStatus: OverallStatus;
  host: string;
  uptime: string;
  lastCheck: string;
}

/** Unified page model */
export interface SystemPageData {
  header: SystemHeaderData;
  gauges: ResourceGauge[];
  services: SystemService[];
  signals: StabilitySignal[];
  uptimeDays: UptimeDay[];
  uptimePercent: string;
}
