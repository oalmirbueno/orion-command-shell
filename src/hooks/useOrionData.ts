/**
 * useOrionData — Domain-aware data fetching hook with auto-refresh.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { DataState, DataSource, DomainFetcher } from "@/domains/types";
import { useLastUpdated } from "./useLastUpdated";

export type { DataState, DataSource };

interface UseOrionDataOptions<T> {
  key: string;
  fetcher: DomainFetcher<T>;
  staleAfter?: number;
  autoLoad?: boolean;
  forceState?: DataState;
  /** Auto-refresh interval in ms (0 = disabled). Pauses when tab is hidden. */
  refreshInterval?: number;
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
  refreshInterval = 0,
}: UseOrionDataOptions<T>): UseOrionDataResult<T> {
  const [state, setState] = useState<DataState>(forceState || (autoLoad ? "loading" : "empty"));
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [source, setSource] = useState<DataSource>("fallback");
  const staleTimer = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const globalUpdated = useLastUpdated();

  const load = useCallback(async (silent = false) => {
    const now = Date.now();
    if (data && now - lastFetchRef.current < 10_000) return;
    lastFetchRef.current = now;

    if (forceState) {
      setState(forceState);
      return;
    }

    // Silent refresh: don't show loading state, keep current data visible
    if (!silent) {
      setState("loading");
    }
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

        // Update global status bar
        try {
          globalUpdated.setLastUpdated(result.timestamp, result.source);
        } catch {}

        if (staleAfter > 0) {
          if (staleTimer.current) clearTimeout(staleTimer.current);
          staleTimer.current = setTimeout(() => {
            if (mountedRef.current) setState("stale");
          }, staleAfter);
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      // On silent refresh failure, keep current data
      if (!silent || !data) {
        setState("error");
        setError(err instanceof Error ? err.message : "Falha ao carregar dados");
      }
    }
  }, [key, fetcher, forceState, staleAfter]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    if (autoLoad) {
      load(false);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [key, autoLoad]);

  // Auto-refresh with visibility API
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          load(true); // silent refresh
        }
      }, refreshInterval);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      } else {
        // Refresh immediately on return, then restart interval
        load(true);
        startInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshInterval, load]);

  // Cleanup stale timer
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
    refetch: () => { lastFetchRef.current = 0; load(false); },
    lastUpdated,
    source,
    isLoading: resolvedState === "loading",
    isReady: resolvedState === "ready",
    isEmpty: resolvedState === "empty",
    isError: resolvedState === "error",
    isStale: resolvedState === "stale",
  };
}
