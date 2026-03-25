import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_SNAPSHOTS, FALLBACK_MEMORY_PAGE } from "./mocks";
import type { MemorySnapshot, MemoryPageData } from "./types";
import type { DomainFetcher } from "../types";

/** Unified page fetcher — real-first + fallback-safe */
export const fetchMemoryPage: DomainFetcher<MemoryPageData> = createRealFirstFetcher({
  endpoint: "/memory",
  fallbackData: FALLBACK_MEMORY_PAGE,
});

/** Legacy fetcher kept for Home widgets compatibility */
export const fetchMemorySnapshots: DomainFetcher<MemorySnapshot[]> = createFallbackFetcher(FALLBACK_SNAPSHOTS);
