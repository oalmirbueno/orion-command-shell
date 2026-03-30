/**
 * Domain Health Store — per-domain freshness tracking.
 *
 * Tracks last update time, source, and derived health status for every domain.
 * Used by the status bar and home page to show accurate live/stale/loading/offline states.
 *
 * Health rules:
 *   - live:    received valid data within FRESH_THRESHOLD_MS
 *   - stale:   last valid data is older than FRESH_THRESHOLD_MS but exists
 *   - loading: no data received yet, no error
 *   - offline: explicit error / timeout confirmed
 */

import { createContext, useContext, useCallback, useRef, useSyncExternalStore } from "react";
import React from "react";
import type { DataSource } from "@/domains/types";

/* ── Constants ── */
const FRESH_THRESHOLD_MS = 90_000; // 90s — generous for polling at 15–30s

/* ── Types ── */
export type DomainHealthStatus = "live" | "stale" | "loading" | "offline";

export interface DomainHealthEntry {
  status: DomainHealthStatus;
  lastUpdated: Date | null;
  source: DataSource | null;
  error: string | null;
}

export type DomainKey =
  | "system" | "sessions" | "agents" | "cron"
  | "alerts" | "operations" | "activity" | "memory"
  | "files" | "home";

export type GlobalHealthStatus = "live" | "partial" | "offline" | "loading";

export interface DomainHealthSnapshot {
  domains: Record<DomainKey, DomainHealthEntry>;
  global: GlobalHealthStatus;
  liveCount: number;
  totalTracked: number;
}

/* ── Default entry ── */
const defaultEntry: DomainHealthEntry = {
  status: "loading",
  lastUpdated: null,
  source: null,
  error: null,
};

const ALL_DOMAINS: DomainKey[] = [
  "system", "sessions", "agents", "cron",
  "alerts", "operations", "activity", "memory",
  "files", "home",
];

/* ── Map useOrionData keys to domain keys ── */
const KEY_TO_DOMAIN: Record<string, DomainKey> = {
  "system-page": "system",
  "status-bar-metrics": "system",
  "sessions-page": "sessions",
  "agents": "agents",
  "agents-page": "agents",
  "cron-page": "cron",
  "alerts-page": "alerts",
  "operations-page": "operations",
  "activity-page": "activity",
  "memory-page": "memory",
  "files-page": "files",
  "home-page": "home",
};

/* ── Store class (external to React) ── */
class DomainHealthStore {
  private entries: Record<DomainKey, DomainHealthEntry>;
  private listeners = new Set<() => void>();
  private version = 0;

  constructor() {
    this.entries = {} as Record<DomainKey, DomainHealthEntry>;
    for (const d of ALL_DOMAINS) {
      this.entries[d] = { ...defaultEntry };
    }
  }

  getSnapshot = (): DomainHealthSnapshot => {
    const now = Date.now();
    const domains = {} as Record<DomainKey, DomainHealthEntry>;
    let liveCount = 0;
    let offlineCount = 0;
    let loadingCount = 0;

    for (const d of ALL_DOMAINS) {
      const entry = this.entries[d];
      // Re-derive status based on freshness
      let status = entry.status;
      if (entry.lastUpdated && status === "live") {
        const age = now - entry.lastUpdated.getTime();
        if (age > FRESH_THRESHOLD_MS) status = "stale";
      }
      domains[d] = { ...entry, status };

      if (status === "live") liveCount++;
      else if (status === "offline") offlineCount++;
      else if (status === "loading") loadingCount++;
    }

    const totalTracked = ALL_DOMAINS.length;
    let global: GlobalHealthStatus;
    if (loadingCount === totalTracked) global = "loading";
    else if (liveCount > 0 && offlineCount === 0) global = "live";
    else if (liveCount > 0) global = "partial";
    else if (offlineCount > 0) global = "offline";
    else global = "loading";

    return { domains, global, liveCount, totalTracked };
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  /** Report a successful data fetch for a domain */
  reportSuccess(queryKey: string, source: DataSource) {
    const domain = KEY_TO_DOMAIN[queryKey];
    if (!domain) return;
    this.entries[domain] = {
      status: "live",
      lastUpdated: new Date(),
      source,
      error: null,
    };
    this.emit();
  }

  /** Report an error for a domain */
  reportError(queryKey: string, error: string) {
    const domain = KEY_TO_DOMAIN[queryKey];
    if (!domain) return;
    const prev = this.entries[domain];
    // If we had valid data before, mark stale instead of offline
    this.entries[domain] = {
      status: prev.lastUpdated ? "stale" : "offline",
      lastUpdated: prev.lastUpdated,
      source: prev.source,
      error,
    };
    this.emit();
  }

  /** Report SSE event received for a domain */
  reportStreamEvent(domain: DomainKey) {
    this.entries[domain] = {
      status: "live",
      lastUpdated: new Date(),
      source: "api",
      error: null,
    };
    this.emit();
  }
}

/* ── Singleton ── */
const store = new DomainHealthStore();

/* ── Context for testability ── */
const DomainHealthContext = createContext(store);

export function DomainHealthProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef(store);
  return React.createElement(DomainHealthContext.Provider, { value: storeRef.current }, children);
}

/* ── Hook: read domain health ── */
export function useDomainHealth(): DomainHealthSnapshot {
  const s = useContext(DomainHealthContext);
  return useSyncExternalStore(s.subscribe, s.getSnapshot, s.getSnapshot);
}

/* ── Hook: report domain health (used by useOrionData) ── */
export function useDomainHealthReporter() {
  const s = useContext(DomainHealthContext);
  const reportSuccess = useCallback((key: string, source: DataSource) => s.reportSuccess(key, source), [s]);
  const reportError = useCallback((key: string, error: string) => s.reportError(key, error), [s]);
  const reportStreamEvent = useCallback((domain: DomainKey) => s.reportStreamEvent(domain), [s]);
  return { reportSuccess, reportError, reportStreamEvent };
}

/* ── Direct access for non-React code (SSE handler) ── */
export function getDomainHealthStore() {
  return store;
}
