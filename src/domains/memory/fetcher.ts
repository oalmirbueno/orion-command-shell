import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { MemorySnapshot, MemoryPageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_MEMORY_PAGE: MemoryPageData = {
  snapshots: [],
  summary: {
    totalSnapshots: 0,
    totalCategories: 0,
    lastCapture: "—",
    totalSize: "—",
  },
};

/** Unified page fetcher — real-first + fallback-safe */
export const fetchMemoryPage: DomainFetcher<MemoryPageData> = createRealFirstFetcher({
  endpoint: "/memory",
  fallbackData: EMPTY_MEMORY_PAGE,
});

/** Fetcher for Home widgets */
export const fetchMemorySnapshots: DomainFetcher<MemorySnapshot[]> = createRealFirstFetcher({
  endpoint: "/memory/snapshots",
  fallbackData: [],
});
