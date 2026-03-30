/**
 * useOrionData — Domain-aware data fetching hook powered by React Query.
 * Data persists across navigations via the shared QueryClient cache.
 */

import { useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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

interface FetcherResult<T> {
  data: T;
  source: DataSource;
  timestamp: Date;
}

export function useOrionData<T>({
  key,
  fetcher,
  forceState,
  staleAfter = 0,
  autoLoad = true,
  refreshInterval = 0,
}: UseOrionDataOptions<T>): UseOrionDataResult<T> {
  const globalUpdated = useLastUpdated();
  const staleTimer = useRef<ReturnType<typeof setTimeout>>();
  const queryClient = useQueryClient();
  const healthReporter = useDomainHealthReporter();

  const queryFn = useCallback(async (): Promise<FetcherResult<T>> => {
    const result = await fetcher();
    return {
      data: result.data as T,
      source: result.source,
      timestamp: result.timestamp,
    };
  }, [fetcher]);

  const {
    data: result,
    error: queryError,
    isLoading: isInitialLoading,
    isFetching,
    refetch: rqRefetch,
    dataUpdatedAt,
  } = useQuery<FetcherResult<T>>({
    queryKey: ["orion", key],
    queryFn,
    enabled: autoLoad && !forceState,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: 1,
  });

  // Update global status bar timestamp + domain health
  useEffect(() => {
    if (result?.timestamp && result?.source) {
      try {
        globalUpdated.setLastUpdated(result.timestamp, result.source);
      } catch {}
      healthReporter.reportSuccess(key, result.source);
    }
  }, [result?.timestamp, result?.source, key]);

  // Report errors to domain health
  useEffect(() => {
    if (queryError && !result) {
      const msg = queryError instanceof Error ? queryError.message : "Fetch failed";
      healthReporter.reportError(key, msg);
    }
  }, [queryError, !result, key]);

  // Stale timer
  useEffect(() => {
    if (staleAfter > 0 && result) {
      if (staleTimer.current) clearTimeout(staleTimer.current);
      staleTimer.current = setTimeout(() => {}, staleAfter);
    }
    return () => {
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [staleAfter, dataUpdatedAt]);

  // Derive state
  let resolvedState: DataState;
  if (forceState) {
    resolvedState = forceState;
  } else if (isInitialLoading && !result) {
    resolvedState = "loading";
  } else if (queryError && !result) {
    resolvedState = "error";
  } else if (result) {
    const isEmpty =
      result.data === undefined ||
      result.data === null ||
      (Array.isArray(result.data) && result.data.length === 0);
    resolvedState = isEmpty ? "empty" : "ready";
  } else {
    resolvedState = "empty";
  }

  const data = result?.data ?? null;
  const source = result?.source ?? "fallback";
  const lastUpdated = result?.timestamp ?? null;
  const errorMsg = queryError instanceof Error ? queryError.message : queryError ? "Falha ao carregar dados" : null;

  return {
    state: resolvedState,
    data,
    error: errorMsg,
    refetch: () => rqRefetch(),
    lastUpdated,
    source,
    isLoading: resolvedState === "loading",
    isReady: resolvedState === "ready",
    isEmpty: resolvedState === "empty",
    isError: resolvedState === "error",
    isStale: resolvedState === "stale",
  };
}

/** Prefetch a domain's data into the shared cache */
export function prefetchOrionData<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  key: string,
  fetcher: DomainFetcher<T>,
) {
  queryClient.prefetchQuery({
    queryKey: ["orion", key],
    queryFn: async () => {
      const result = await fetcher();
      return { data: result.data as T, source: result.source, timestamp: result.timestamp };
    },
    staleTime: 30_000,
  });
}
