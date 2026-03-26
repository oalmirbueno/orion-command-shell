import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { OperationTask, TimelineEvent, Operation } from "./types";
import type { OperationsPageData } from "./types.page";
import type { DomainFetcher } from "../types";

/** Unified page-level fetcher */
export const fetchOperationsPage: DomainFetcher<OperationsPageData> = createRealFirstFetcher({
  endpoint: "/operations",
  fallbackData: {
    tasks: [],
    timeline: [],
    liveOps: [],
  },
});

export const fetchOperationTasks: DomainFetcher<OperationTask[]> = createRealFirstFetcher({
  endpoint: "/operations/tasks",
  fallbackData: [],
});

export const fetchTimeline: DomainFetcher<TimelineEvent[]> = createRealFirstFetcher({
  endpoint: "/operations/timeline",
  fallbackData: [],
});

export const fetchLiveOperations: DomainFetcher<Operation[]> = createRealFirstFetcher({
  endpoint: "/operations/live",
  fallbackData: [],
});
