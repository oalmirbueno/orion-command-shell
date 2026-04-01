/**
 * Domain Analytics Store — acumula métricas de latência e eventos por domínio.
 * Alimentado pelos fetchers e SSE para gerar tendências e gargalos.
 */

import type { DomainKey } from "@/hooks/useDomainHealth";

export interface DomainMetricEntry {
  timestamp: number;
  latencyMs: number;
  success: boolean;
}

export interface DomainAnalytics {
  recentLatencies: number[];    // últimas N latências em ms
  avgLatency: number;
  maxLatency: number;
  errorCount: number;
  successCount: number;
  trend: "up" | "down" | "stable"; // latência subindo/descendo/estável
  errorRate: number;             // 0-1
}

const MAX_ENTRIES = 50;

class DomainAnalyticsStore {
  private entries: Record<string, DomainMetricEntry[]> = {};
  private _snapshot: Record<string, DomainAnalytics> = {};
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    this._snapshot = this.buildSnapshot();
    for (const fn of this.listeners) fn();
  }

  /** Record a fetch result */
  record(domain: string, latencyMs: number, success: boolean) {
    if (!this.entries[domain]) this.entries[domain] = [];
    this.entries[domain] = [
      { timestamp: Date.now(), latencyMs, success },
      ...this.entries[domain],
    ].slice(0, MAX_ENTRIES);
    this.emit();
  }

  private buildSnapshot(): Record<string, DomainAnalytics> {
    const result: Record<string, DomainAnalytics> = {};
    for (const [domain, entries] of Object.entries(this.entries)) {
      if (entries.length === 0) continue;
      const latencies = entries.map(e => e.latencyMs);
      const successCount = entries.filter(e => e.success).length;
      const errorCount = entries.length - successCount;

      // Trend: compare first half avg vs second half avg
      const mid = Math.floor(latencies.length / 2) || 1;
      const recentAvg = latencies.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const olderAvg = latencies.slice(mid).reduce((a, b) => a + b, 0) / (latencies.length - mid || 1);
      const trendDelta = recentAvg - olderAvg;
      const trend: "up" | "down" | "stable" =
        Math.abs(trendDelta) < 200 ? "stable" :
        trendDelta > 0 ? "up" : "down";

      result[domain] = {
        recentLatencies: latencies.slice(0, 10),
        avgLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        maxLatency: Math.max(...latencies),
        errorCount,
        successCount,
        trend,
        errorRate: entries.length > 0 ? errorCount / entries.length : 0,
      };
    }
    return result;
  }

  getSnapshot = () => this._snapshot;

  /** Get sorted bottlenecks (domains with highest latency or error rate) */
  getBottlenecks(): { domain: string; analytics: DomainAnalytics }[] {
    const snap = this._snapshot;
    return Object.entries(snap)
      .map(([domain, analytics]) => ({ domain, analytics }))
      .sort((a, b) => {
        // Prioritize error rate, then avg latency
        const scoreA = a.analytics.errorRate * 10000 + a.analytics.avgLatency;
        const scoreB = b.analytics.errorRate * 10000 + b.analytics.avgLatency;
        return scoreB - scoreA;
      });
  }
}

export const domainAnalyticsStore = new DomainAnalyticsStore();
