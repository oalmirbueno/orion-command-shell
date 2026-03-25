import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_TASKS, FALLBACK_TIMELINE, FALLBACK_LIVE_OPS } from "./mocks";
import type { OperationTask, TimelineEvent, Operation } from "./types";
import type { DomainFetcher } from "../types";

export const fetchOperationTasks: DomainFetcher<OperationTask[]> = createFallbackFetcher(FALLBACK_TASKS);
export const fetchTimeline: DomainFetcher<TimelineEvent[]> = createFallbackFetcher(FALLBACK_TIMELINE);
export const fetchLiveOperations: DomainFetcher<Operation[]> = createFallbackFetcher(FALLBACK_LIVE_OPS);
