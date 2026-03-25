/**
 * Orion Domain Layer — Shared Types
 *
 * Core types for the data fetching architecture.
 * Every domain fetcher returns a DomainResult<T>.
 */

export type DataState = "loading" | "ready" | "error" | "empty" | "stale";
export type DataSource = "fallback" | "api" | "cache";

/** Standard result shape returned by every domain fetcher */
export interface DomainResult<T> {
  data: T;
  source: DataSource;
  timestamp: Date;
}

/** A fetcher is an async function that returns domain data or throws */
export type DomainFetcher<T> = () => Promise<DomainResult<T>>;

/** Configuration for useOrionData */
export interface DomainDataConfig<T> {
  /** Unique cache/identity key for this data source */
  key: string;
  /** The fetcher function — currently backed by fallback data, replaceable with API calls */
  fetcher: DomainFetcher<T>;
  /** Simulated delay in dev mode only (ms). 0 in production. */
  devDelay?: number;
  /** Mark data as stale after this many ms (0 = never) */
  staleAfter?: number;
  /** Whether to fetch automatically on mount */
  autoLoad?: boolean;
  /** Force a specific state — useful for testing UI states */
  forceState?: DataState;
}
