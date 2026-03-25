/**
 * useOrionData — Simulates data fetching states for Orion components.
 *
 * Provides a clean state machine (loading → ready | error | empty)
 * that components can use to render appropriate UI states.
 * When real APIs are connected, replace the simulation with actual fetch logic.
 *
 * Usage:
 *   const { state, data, error, refetch, lastUpdated, source } = useOrionData({
 *     key: "agents",
 *     mockData: AGENTS_DATA,
 *     simulateDelay: 800,
 *   });
 */

import { useState, useEffect, useCallback, useRef } from "react";

export type DataState = "loading" | "ready" | "error" | "empty" | "stale";
export type DataSource = "mock" | "simulated" | "api" | "cache";

interface UseOrionDataOptions<T> {
  /** Unique key for this data source */
  key: string;
  /** Mock/placeholder data to return after simulated loading */
  mockData?: T;
  /** Simulated loading delay in ms (0 = instant) */
  simulateDelay?: number;
  /** Force a specific state — useful for testing UI states */
  forceState?: DataState;
  /** Mark data as stale after this many ms (0 = never) */
  staleAfter?: number;
  /** Whether to start loading automatically */
  autoLoad?: boolean;
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
  mockData,
  simulateDelay = 600,
  forceState,
  staleAfter = 0,
  autoLoad = true,
}: UseOrionDataOptions<T>): UseOrionDataResult<T> {
  const [state, setState] = useState<DataState>(forceState || (autoLoad ? "loading" : "empty"));
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const staleTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(() => {
    if (forceState) {
      setState(forceState);
      if (forceState === "ready" && mockData) setData(mockData);
      return;
    }

    setState("loading");
    setError(null);

    const timer = setTimeout(() => {
      if (mockData === undefined || mockData === null || (Array.isArray(mockData) && mockData.length === 0)) {
        setState("empty");
        setData(null);
      } else {
        setState("ready");
        setData(mockData);
        setLastUpdated(new Date());

        // Schedule stale transition
        if (staleAfter > 0) {
          if (staleTimer.current) clearTimeout(staleTimer.current);
          staleTimer.current = setTimeout(() => setState("stale"), staleAfter);
        }
      }
    }, simulateDelay);

    return () => clearTimeout(timer);
  }, [key, mockData, simulateDelay, forceState, staleAfter]);

  useEffect(() => {
    if (autoLoad) {
      const cleanup = load();
      return cleanup;
    }
  }, [key, autoLoad]);

  useEffect(() => {
    return () => {
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, []);

  const source: DataSource = "mock";

  return {
    state: forceState || state,
    data,
    error,
    refetch: load,
    lastUpdated,
    source,
    isLoading: (forceState || state) === "loading",
    isReady: (forceState || state) === "ready",
    isEmpty: (forceState || state) === "empty",
    isError: (forceState || state) === "error",
    isStale: (forceState || state) === "stale",
  };
}
