/**
 * System Domain — Fallback Data (Development Only)
 *
 * This data is used when no API is connected.
 * Replace fetcher in fetcher.ts to switch to real data.
 */

import type { CommandData, HealthService, SystemService } from "./types";

export const FALLBACK_COMMAND: CommandData = {
  systemState: "degraded",
  metrics: [
    { label: "Uptime", value: "99.97%", icon: "Clock" },
    { label: "Agentes", value: "7/10", icon: "Bot" },
    { label: "Sessões", value: "5 ativas", icon: "Activity" },
    { label: "Tokens/h", value: "142k", icon: "Zap" },
  ],
};

export const FALLBACK_HEALTH: HealthService[] = [
  { name: "API Gateway", status: "healthy", responseTime: "12ms", uptime: "99.99%" },
  { name: "Core Engine", status: "healthy", responseTime: "8ms", uptime: "99.98%" },
  { name: "Data Pipeline", status: "degraded", responseTime: "187ms", uptime: "99.91%" },
  { name: "Auth Service", status: "healthy", responseTime: "15ms", uptime: "100%" },
  { name: "ML Processor", status: "healthy", responseTime: "34ms", uptime: "99.95%" },
  { name: "Cache Layer", status: "healthy", responseTime: "2ms", uptime: "100%" },
  { name: "Queue Service", status: "healthy", responseTime: "5ms", uptime: "99.99%" },
  { name: "Storage", status: "healthy", responseTime: "22ms", uptime: "99.97%" },
];

export const FALLBACK_SERVICES: SystemService[] = [
  { name: "nginx", status: "running", port: "80, 443", cpu: "0.3%", mem: "48MB", uptime: "47d", pid: "1024" },
  { name: "postgres", status: "running", port: "5432", cpu: "2.1%", mem: "512MB", uptime: "47d", pid: "1102" },
  { name: "redis", status: "running", port: "6379", cpu: "0.8%", mem: "128MB", uptime: "47d", pid: "1156" },
  { name: "orion-core", status: "running", port: "8080", cpu: "12.4%", mem: "1.2GB", uptime: "12d", pid: "2341" },
  { name: "orion-worker", status: "running", port: "—", cpu: "8.7%", mem: "890MB", uptime: "12d", pid: "2342" },
  { name: "orion-scheduler", status: "running", port: "—", cpu: "1.2%", mem: "256MB", uptime: "12d", pid: "2343" },
  { name: "ml-inference", status: "degraded", port: "9090", cpu: "45.2%", mem: "3.8GB", uptime: "2d", pid: "3401" },
  { name: "log-collector", status: "running", port: "5140", cpu: "0.5%", mem: "64MB", uptime: "47d", pid: "1200" },
  { name: "metrics-exporter", status: "running", port: "9100", cpu: "0.2%", mem: "32MB", uptime: "47d", pid: "1201" },
  { name: "backup-agent", status: "stopped", port: "—", cpu: "—", mem: "—", uptime: "—", pid: "—" },
];
