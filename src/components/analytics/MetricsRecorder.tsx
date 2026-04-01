/**
 * MetricsRecorder — Componente invisível que persiste snapshots
 * de métricas por domínio a cada 5 minutos quando Supabase configurado.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { domainAnalyticsStore } from "@/services/domainAnalytics";
import { useDomainMetrics } from "@/hooks/useDomainMetrics";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export function MetricsRecorder() {
  const { recordAll, mode } = useDomainMetrics();
  const analytics = useSyncExternalStore(
    domainAnalyticsStore.subscribe,
    domainAnalyticsStore.getSnapshot
  );
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;

  useEffect(() => {
    if (mode !== "supabase") return;

    const persist = () => {
      const snap = analyticsRef.current;
      if (Object.keys(snap).length > 0) {
        recordAll(snap);
      }
    };

    const id = setInterval(persist, INTERVAL_MS);
    // First persist after 60s to allow metrics to accumulate
    const first = setTimeout(persist, 60_000);

    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [mode, recordAll]);

  return null;
}
