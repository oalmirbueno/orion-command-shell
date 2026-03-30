/**
 * useSystemMetrics — Lightweight hook for the status bar.
 * Fetches /api/system + /api/system/stats on a fast interval (15s).
 * Exposes per-subsystem health and a derived global panel status.
 */

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/domains/api";

/** Per-subsystem health */
export type SubsystemStatus = "online" | "offline" | "unknown";
/** Global panel status derived from subsystems */
export type PanelStatus = "live" | "partial" | "offline" | "stale";

export interface SubsystemHealth {
  backend: SubsystemStatus;
  openclaw: SubsystemStatus;
  stats: SubsystemStatus;
}

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
  activeServices: number | null;
  totalServices: number | null;
  hostname: string | null;
  platform: string | null;
  health: SubsystemHealth;
  panelStatus: PanelStatus;
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

function derivePanelStatus(h: SubsystemHealth): PanelStatus {
  const statuses = [h.backend, h.openclaw, h.stats];
  const onlineCount = statuses.filter(s => s === "online").length;
  const offlineCount = statuses.filter(s => s === "offline").length;
  const unknownCount = statuses.filter(s => s === "unknown").length;
  if (unknownCount === statuses.length) return "stale";
  if (onlineCount === statuses.length) return "live";
  if (offlineCount === statuses.length) return "offline";
  if (onlineCount > 0) return "partial";
  return "offline";
}

async function fetchMetrics(): Promise<{ metrics: SystemMetrics; latencyMs: number }> {
  const start = performance.now();
  // Separate controllers so a slow /system doesn't abort /system/stats
  const sysController = new AbortController();
  const statsController = new AbortController();
  const sysTimeout = setTimeout(() => sysController.abort(), 18000);
  const statsTimeout = setTimeout(() => statsController.abort(), 10000);

  try {
    const [sysRes, statsRes] = await Promise.allSettled([
      fetch(apiUrl("/system"), { signal: sysController.signal, headers: { accept: "application/json" } }),
      fetch(apiUrl("/system/stats"), { signal: statsController.signal, headers: { accept: "application/json" } }),
    ]);

    clearTimeout(sysTimeout);
    clearTimeout(statsTimeout);
    const latencyMs = Math.round(performance.now() - start);

    let sys: RawSystem | null = null;
    let stats: RawStats | null = null;
    let sysOk = false;
    let statsOk = false;

    if (sysRes.status === "fulfilled" && sysRes.value.ok) {
      const ct = sysRes.value.headers.get("content-type") || "";
      if (ct.includes("json")) {
        sys = await sysRes.value.json();
        sysOk = true;
      }
    }
    if (statsRes.status === "fulfilled" && statsRes.value.ok) {
      const ct = statsRes.value.headers.get("content-type") || "";
      if (ct.includes("json")) {
        stats = await statsRes.value.json();
        statsOk = true;
      }
    }

    // Derive per-subsystem health
    const health: SubsystemHealth = {
      backend: (sysOk || statsOk) ? "online" : "offline",
      openclaw: sysOk && sys?.system ? "online" : sysOk ? "offline" : "unknown",
      stats: statsOk ? "online" : sysOk ? "offline" : "unknown",
    };

    if (!sysOk && !statsOk) {
      return {
        metrics: { ...emptyMetrics(), latencyMs, health, panelStatus: "offline" },
        latencyMs,
      };
    }

    // RAM: stats.ram is in GB, sys.system.memory is in bytes
    const mem = sys?.system?.memory;
    const statsRam = stats?.ram;
    let ramPct: number | null = null;
    let ramUsedGB: string | null = null;
    let ramTotalGB: string | null = null;
    if (statsRam) {
      ramPct = Math.round((statsRam.used / statsRam.total) * 100);
      ramUsedGB = statsRam.used.toFixed(1) + " GB";
      ramTotalGB = statsRam.total.toFixed(1) + " GB";
    } else if (mem) {
      ramPct = Math.round(((mem.total - mem.free) / mem.total) * 100);
      ramUsedGB = fmtGB(mem.used);
      ramTotalGB = fmtGB(mem.total);
    }

    // Disk: stats.disk is in GB
    const diskRaw = stats?.disk || null;
    const diskPct = diskRaw ? Math.round((diskRaw.used / diskRaw.total) * 100) : null;
    const diskUsedGB = diskRaw ? diskRaw.used.toFixed(0) + " GB" : null;
    const diskTotalGB = diskRaw ? diskRaw.total.toFixed(0) + " GB" : null;

    const uptimeStr = stats?.uptime
      || sys?.system?.uptimeFormatted
      || (sys?.system?.uptime ? formatUptime(sys.system.uptime) : null);

    const integrations = sys?.integrations || [];
    const connectedCount = integrations.filter(i => i.status === "connected").length;

    return {
      metrics: {
        cpu: stats?.cpu ?? null,
        ram: ramPct,
        ramUsedGB,
        ramTotalGB,
        disk: diskPct,
        diskUsedGB,
        diskTotalGB,
        uptime: uptimeStr,
        latencyMs,
        activeServices: stats?.activeServices ?? connectedCount,
        totalServices: stats?.totalServices ?? integrations.length,
        hostname: sys?.system?.hostname ?? null,
        platform: sys?.system?.platform ?? null,
        health,
        panelStatus: derivePanelStatus(health),
      },
      latencyMs,
    };
  } catch {
    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);
    return {
      metrics: emptyMetrics(),
      latencyMs,
    };
  }
}

function emptyMetrics(): SystemMetrics {
  return {
    cpu: null, ram: null, ramUsedGB: null, ramTotalGB: null,
    disk: null, diskUsedGB: null, diskTotalGB: null,
    uptime: null, latencyMs: null,
    activeServices: null, totalServices: null, hostname: null, platform: null,
    health: { backend: "unknown", openclaw: "unknown", stats: "unknown" },
    panelStatus: "stale",
  };
}

/** Merge new metrics over previous, keeping last valid (non-null) values */
function mergeMetrics(prev: SystemMetrics, next: SystemMetrics): SystemMetrics {
  return {
    cpu: next.cpu ?? prev.cpu,
    ram: next.ram ?? prev.ram,
    ramUsedGB: next.ramUsedGB ?? prev.ramUsedGB,
    ramTotalGB: next.ramTotalGB ?? prev.ramTotalGB,
    disk: next.disk ?? prev.disk,
    diskUsedGB: next.diskUsedGB ?? prev.diskUsedGB,
    diskTotalGB: next.diskTotalGB ?? prev.diskTotalGB,
    uptime: next.uptime ?? prev.uptime,
    latencyMs: next.latencyMs ?? prev.latencyMs,
    activeServices: next.activeServices ?? prev.activeServices,
    totalServices: next.totalServices ?? prev.totalServices,
    hostname: next.hostname ?? prev.hostname,
    platform: next.platform ?? prev.platform,
    // Health & status always use latest (never stale)
    health: next.health,
    panelStatus: next.panelStatus,
  };
}

export function useSystemMetrics() {
  const lastValid = useRef<SystemMetrics>(emptyMetrics());

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

  const raw = data?.metrics ?? emptyMetrics();
  const merged = mergeMetrics(lastValid.current, raw);
  lastValid.current = merged;

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return { metrics: merged, updatedAt };
}
