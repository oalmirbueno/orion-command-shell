/**
 * useOrionData — Domain-aware data fetching hook.
 *
 * Accepts a DomainFetcher function and manages the full lifecycle:
 * loading → ready | error | empty | stale
 *
 * The fetcher is the single point of integration. Currently backed by
 * fallback data per domain. To connect real APIs, replace the fetcher
 * in the domain's fetcher.ts — no component changes needed.
 *
 * Usage:
 *   const { state, data, refetch } = useOrionData({
 *     key: "agents",
 *     fetcher: fetchAgents,
 *   });
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { DataState, DataSource, DomainFetcher } from "@/domains/types";

// Re-export for backward compatibility
export type { DataState, DataSource };

interface UseOrionDataOptions<T> {
  /** Unique key for this data source */
  key: string;
  /** Domain fetcher function — the single integration point */
  fetcher: DomainFetcher<T>;
  /** Mark data as stale after this many ms (0 = never) */
  staleAfter?: number;
  /** Whether to start loading automatically */
  autoLoad?: boolean;
  /** Force a specific state — useful for testing UI states */
  forceState?: DataState;
}

interface UseOrionDataResult<T> {
  state: DataState;
  data: T | null;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
  source: DataSource;
  isLoading: boolean;
  isReady: boolean;
  isEmpty: boolean;
  isError: boolean;
  isStale: boolean;
}

export function useOrionData<T>({
  key,
  fetcher,
  forceState,
  staleAfter = 0,
  autoLoad = true,
}: UseOrionDataOptions<T>): UseOrionDataResult<T> {
  const [state, setState] = useState<DataState>(forceState || (autoLoad ? "loading" : "empty"));
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [source, setSource] = useState<DataSource>("fallback");
  const staleTimer = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const lastFetchRef = useRef<number>(0);

  const load = useCallback(async () => {
    // staleTime guard — skip if data was fetched recently (30s)
    const now = Date.now();
    if (data && now - lastFetchRef.current < 30_000) return;
    lastFetchRef.current = now;
    if (forceState) {
      setState(forceState);
      return;
    }

    setState("loading");
    setError(null);

    try {
      const result = await fetcher();

      if (!mountedRef.current) return;

      const isEmpty =
        result.data === undefined ||
        result.data === null ||
        (Array.isArray(result.data) && result.data.length === 0);

      if (isEmpty) {
        setState("empty");
        setData(null);
      } else {
        setState("ready");
        setData(result.data);
        setSource(result.source);
        setLastUpdated(result.timestamp);

        if (staleAfter > 0) {
          if (staleTimer.current) clearTimeout(staleTimer.current);
          staleTimer.current = setTimeout(() => {
            if (mountedRef.current) setState("stale");
          }, staleAfter);
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setState("error");
      setError(err instanceof Error ? err.message : "Falha ao carregar dados");
    }
  }, [key, fetcher, forceState, staleAfter]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoLoad) {
      load();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [key, autoLoad]);

  useEffect(() => {
    return () => {
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, []);

  const resolvedState = forceState || state;

  return {
    state: resolvedState,
    data,
    error,
    refetch: load,
    lastUpdated,
    source,
    isLoading: resolvedState === "loading",
    isReady: resolvedState === "ready",
    isEmpty: resolvedState === "empty",
    isError: resolvedState === "error",
    isStale: resolvedState === "stale",
  };
}
