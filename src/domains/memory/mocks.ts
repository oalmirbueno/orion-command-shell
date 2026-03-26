import type { MemoryPageData } from "./types";

export const FALLBACK_SNAPSHOTS: never[] = [];

export const FALLBACK_MEMORY_PAGE: MemoryPageData = {
  snapshots: [],
  summary: {
    totalSnapshots: 0,
    totalCategories: 0,
    lastCapture: "—",
    totalSize: "—",
  },
};
