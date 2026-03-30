/**
 * useSystemMetrics — Lightweight hook for the status bar.
 * Fetches /api/system + /api/system/stats on a fast interval (15s).
 * Exposes CPU, RAM, Disk, Uptime, Latency, backend status, and source.
 */

import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/domains/api";

export interface SystemMetrics {
  cpu: number | null;
  ram: number | null;
  ramUsedGB: string | null;
  ramTotalGB: string | null;
  disk: number | null;
  diskUsedGB: string | null;
  diskTotalGB: string | null;
  uptime: string | null;
  latencyMs: number | null;
  backendOnline: boolean;
  openclawOnline: boolean;
  activeServices: number | null;
  totalServices: number | null;
  hostname: string | null;
  platform: string | null;
}

interface RawSystem {
  system?: {
    uptime?: number;
    uptimeFormatted?: string;
    hostname?: string;
    platform?: string;
    memory?: { total: number; free: number; used: number };
  };
  integrations?: Array<{ status: string }>;
  timestamp?: string;
}

interface RawStats {
  cpu?: number;
  ram?: { used: number; total: number };
  disk?: { used: number; total: number };
  uptime?: string;
  activeServices?: number;
  totalServices?: number;
}

function formatUptime(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

function fmtGB(bytes: number): string {
  return (bytes / 1e9).toFixed(1) + " GB";
}

async function fetchMetrics(): Promise<{ metrics: SystemMetrics; source: "api" | "offline"; latencyMs: number }> {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const [sysRes, statsRes] = await Promise.allSettled([
      fetch(apiUrl("/system"), { signal: controller.signal, headers: { accept: "application/json" } }),
      fetch(apiUrl("/system/stats"), { signal: controller.signal, headers: { accept: "application/json" } }),
    ]);

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);

    let sys: RawSystem | null = null;
    let stats: RawStats | null = null;
    let anyOk = false;

    if (sysRes.status === "fulfilled" && sysRes.value.ok) {
      const ct = sysRes.value.headers.get("content-type") || "";
      if (ct.includes("json")) {
        sys = await sysRes.value.json();
        anyOk = true;
      }
    }
    if (statsRes.status === "fulfilled" && statsRes.value.ok) {
      const ct = statsRes.value.headers.get("content-type") || "";
      if (ct.includes("json")) {
        stats = await statsRes.value.json();
        anyOk = true;
      }
    }

    if (!anyOk) {
      return {
        metrics: emptyMetrics(),
        source: "offline",
        latencyMs,
      };
    }

    const mem = sys?.system?.memory;
    const ramRaw = stats?.ram || (mem ? { used: mem.used, total: mem.total } : null);
    const ramPct = ramRaw ? Math.round((ramRaw.used / ramRaw.total) * 100) : null;

    const diskRaw = stats?.disk || null;
    const diskPct = diskRaw ? Math.round((diskRaw.used / diskRaw.total) * 100) : null;

    const uptimeStr = stats?.uptime
      || (sys?.system?.uptimeFormatted)
      || (sys?.system?.uptime ? formatUptime(sys.system.uptime) : null);

    const integrations = sys?.integrations || [];
    const connectedCount = integrations.filter(i => i.status === "connected").length;

    return {
      metrics: {
        cpu: stats?.cpu ?? null,
        ram: ramPct,
        ramUsedGB: ramRaw ? fmtGB(ramRaw.used) : null,
        ramTotalGB: ramRaw ? fmtGB(ramRaw.total) : null,
        disk: diskPct,
        diskUsedGB: diskRaw ? fmtGB(diskRaw.used * 1e9) : null,
        diskTotalGB: diskRaw ? fmtGB(diskRaw.total * 1e9) : null,
        uptime: uptimeStr,
        latencyMs,
        backendOnline: true,
        openclawOnline: !!sys?.system,
        activeServices: stats?.activeServices ?? connectedCount,
        totalServices: stats?.totalServices ?? integrations.length,
        hostname: sys?.system?.hostname ?? null,
        platform: sys?.system?.platform ?? null,
      },
      source: "api",
      latencyMs,
    };
  } catch {
    clearTimeout(timeout);
    return {
      metrics: emptyMetrics(),
      source: "offline",
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

function emptyMetrics(): SystemMetrics {
  return {
    cpu: null, ram: null, disk: null, uptime: null, latencyMs: null,
    backendOnline: false, openclawOnline: false,
    activeServices: null, totalServices: null, hostname: null,
  };
}

export function useSystemMetrics() {
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ["orion", "status-bar-metrics"],
    queryFn: fetchMetrics,
    staleTime: 10_000,
    gcTime: 60_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: 0,
  });

  const metrics = data?.metrics ?? emptyMetrics();
  const source = data?.source ?? "offline";
  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return { metrics, source, updatedAt };
}
