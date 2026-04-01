/**
 * useDomainMetrics — Persiste e consulta snapshots de métricas por domínio.
 *
 * Com Supabase: persiste via RPC record_domain_metric e consulta histórico.
 * Sem Supabase: fallback honesto — sem persistência, sem dados fake.
 */

import { useCallback } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DomainAnalytics } from "@/services/domainAnalytics";

export interface DomainMetricRecord {
  id: string;
  domain: string;
  avg_latency_ms: number;
  max_latency_ms: number;
  error_count: number;
  success_count: number;
  error_rate: number;
  trend: "up" | "down" | "stable";
  recorded_at: string;
}

interface UseDomainMetricsReturn {
  /** Persiste snapshot atual de um domínio */
  recordSnapshot: (domain: string, analytics: DomainAnalytics) => Promise<void>;
  /** Persiste snapshots de todos os domínios de uma vez */
  recordAll: (snapshots: Record<string, DomainAnalytics>) => Promise<void>;
  /** Consulta histórico de um domínio */
  fetchHistory: (domain: string, opts?: { days?: number; limit?: number }) => Promise<DomainMetricRecord[]>;
  /** Consulta último snapshot de cada domínio */
  fetchLatest: () => Promise<DomainMetricRecord[]>;
  mode: "supabase" | "memory";
}

export function useDomainMetrics(): UseDomainMetricsReturn {
  const { user } = useAuth();
  const mode = supabaseConfigured && user ? "supabase" : "memory";

  const recordSnapshot = useCallback(
    async (domain: string, a: DomainAnalytics) => {
      if (mode !== "supabase" || !supabase) return;
      try {
        await supabase.rpc("record_domain_metric", {
          _domain: domain,
          _avg_latency: a.avgLatency,
          _max_latency: a.maxLatency,
          _errors: a.errorCount,
          _successes: a.successCount,
          _error_rate: Number(a.errorRate.toFixed(4)),
          _trend: a.trend,
        });
      } catch (err) {
        console.warn("[domain-metrics] falha ao persistir:", err);
      }
    },
    [mode],
  );

  const recordAll = useCallback(
    async (snapshots: Record<string, DomainAnalytics>) => {
      if (mode !== "supabase" || !supabase) return;
      const promises = Object.entries(snapshots).map(([domain, a]) =>
        recordSnapshot(domain, a)
      );
      await Promise.allSettled(promises);
    },
    [mode, recordSnapshot],
  );

  const fetchHistory = useCallback(
    async (domain: string, opts?: { days?: number; limit?: number }) => {
      if (mode !== "supabase" || !supabase) return [];
      const days = opts?.days ?? 7;
      const limit = opts?.limit ?? 100;
      const since = new Date(Date.now() - days * 86_400_000).toISOString();

      try {
        const { data, error } = await supabase
          .from("domain_metrics")
          .select("*")
          .eq("domain", domain)
          .gte("recorded_at", since)
          .order("recorded_at", { ascending: true })
          .limit(limit);

        if (error) throw error;
        return (data ?? []) as DomainMetricRecord[];
      } catch (err) {
        console.warn("[domain-metrics] falha ao buscar histórico:", err);
        return [];
      }
    },
    [mode],
  );

  const fetchLatest = useCallback(
    async () => {
      if (mode !== "supabase" || !supabase) return [];
      try {
        // Get the most recent record per domain using distinct on
        const { data, error } = await supabase
          .from("domain_metrics")
          .select("*")
          .order("recorded_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        // Deduplicate: keep only latest per domain
        const seen = new Set<string>();
        const latest: DomainMetricRecord[] = [];
        for (const row of (data ?? []) as DomainMetricRecord[]) {
          if (!seen.has(row.domain)) {
            seen.add(row.domain);
            latest.push(row);
          }
        }
        return latest;
      } catch (err) {
        console.warn("[domain-metrics] falha ao buscar últimos:", err);
        return [];
      }
    },
    [mode],
  );

  return { recordSnapshot, recordAll, fetchHistory, fetchLatest, mode };
}
