import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_TASKS, FALLBACK_TIMELINE, FALLBACK_LIVE_OPS } from "./mocks";
import type { OperationTask, TimelineEvent, Operation } from "./types";
import type { OperationsPageData } from "./types.page";
import type { DomainFetcher } from "../types";

/** Unified page-level fetcher — single source of truth for OperationsPage */
export const fetchOperationsPage: DomainFetcher<OperationsPageData> = createRealFirstFetcher({
  endpoint: "/operations",
  fallbackData: {
    tasks: FALLBACK_TASKS,
    timeline: FALLBACK_TIMELINE,
    liveOps: FALLBACK_LIVE_OPS,
  },
});

// Individual fetchers kept for other consumers (e.g. Home widgets)
export const fetchOperationTasks: DomainFetcher<OperationTask[]> = createRealFirstFetcher({
  endpoint: "/operations/tasks",
  fallbackData: FALLBACK_TASKS,
});

export const fetchTimeline: DomainFetcher<TimelineEvent[]> = createRealFirstFetcher({
  endpoint: "/operations/timeline",
  fallbackData: FALLBACK_TIMELINE,
});

export const fetchLiveOperations: DomainFetcher<Operation[]> = createRealFirstFetcher({
  endpoint: "/operations/live",
  fallbackData: FALLBACK_LIVE_OPS,
});
