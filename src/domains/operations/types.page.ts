import type { OperationTask, TimelineEvent, Operation, OperationsSummaryData } from "./types";

/** Categorized operation for the sectioned page layout */
export interface OperationSection {
  running: OperationTask[];
  completed: OperationTask[];
  failed: OperationTask[];
  overnight: OperationTask[];
  upcoming: OperationTask[];
}

/** Unified page model for the Operations domain */
export interface OperationsPageData {
  tasks: OperationTask[];
  timeline: TimelineEvent[];
  liveOps: Operation[];
  summary: OperationsSummaryData;
  sections: OperationSection;
}
