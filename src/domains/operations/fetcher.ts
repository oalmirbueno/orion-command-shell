import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_TASKS, FALLBACK_TIMELINE, FALLBACK_LIVE_OPS } from "./mocks";
import type { OperationTask, TimelineEvent, Operation } from "./types";
import type { DomainFetcher } from "../types";

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
