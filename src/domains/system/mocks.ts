/**
 * System Domain — Fallback Data (Development Only)
 */

import type {
  SystemPageData,
  SystemService,
  ResourceGauge,
  StabilitySignal,
  UptimeDay,
  SystemHeaderData,
} from "./types";

const FALLBACK_HEADER: SystemHeaderData = {
  overallStatus: "healthy",
  host: "orion-prod-01",
  uptime: "47d 12h 38m",
  lastCheck: "12s atrás",
};

const FALLBACK_GAUGES: ResourceGauge[] = [
  { label: "CPU", value: 34, max: 100, unit: "%", detail: "8 cores · 3.2GHz", iconName: "Cpu" },
  { label: "RAM", value: 12.4, max: 32, unit: "GB", detail: "32 GB total · 19.6 GB livre", iconName: "MemoryStick" },
  { label: "Disco", value: 187, max: 500, unit: "GB", detail: "500 GB NVMe · 313 GB livre", iconName: "HardDrive" },
  { label: "Uptime", value: 99.97, max: 100, unit: "%", detail: "47d 12h 38m · 30d contínuos", iconName: "Clock" },
];

const FALLBACK_SERVICES: SystemService[] = [
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

const FALLBACK_SIGNALS: StabilitySignal[] = [
  { label: "Load Average", value: "1.24", level: "normal", iconName: "ThermometerSun", detail: "1m: 1.24 · 5m: 1.18 · 15m: 1.02" },
  { label: "Disk I/O", value: "42 MB/s", level: "normal", iconName: "HardDrive", detail: "Read: 28 MB/s · Write: 14 MB/s" },
  { label: "Network", value: "156 Mbps", level: "normal", iconName: "Wifi", detail: "In: 98 Mbps · Out: 58 Mbps" },
  { label: "Eventos OOM", value: "0", level: "normal", iconName: "ShieldAlert", detail: "Últimas 24h · Sem kills" },
  { label: "Swap Usage", value: "0.2 GB", level: "normal", iconName: "HardDrive", detail: "8 GB total · 7.8 GB free" },
  { label: "Process Count", value: "247", level: "elevated", iconName: "Clock", detail: "Acima da média de 210" },
];

function generateUptimeDays(): UptimeDay[] {
  const days: UptimeDay[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(5, 10);
    let status: UptimeDay["status"] = "up";
    if (i === 45) status = "degraded";
    if (i === 67) status = "partial";
    if (i === 72) status = "degraded";
    days.push({ date: dateStr, status });
  }
  return days;
}

export const FALLBACK_SYSTEM_PAGE: SystemPageData = {
  header: FALLBACK_HEADER,
  gauges: FALLBACK_GAUGES,
  services: FALLBACK_SERVICES,
  signals: FALLBACK_SIGNALS,
  uptimeDays: generateUptimeDays(),
  uptimePercent: "99.97%",
};
