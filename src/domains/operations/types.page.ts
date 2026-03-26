import type { OperationTask, TimelineEvent, Operation, OperationsSummaryData } from "./types";

/** Unified page model for the Operations domain */
export interface OperationsPageData {
  tasks: OperationTask[];
  timeline: TimelineEvent[];
  liveOps: Operation[];
  summary: OperationsSummaryData;
}
