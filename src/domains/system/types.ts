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
