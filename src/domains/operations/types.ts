export type TaskStatus = "queued" | "running" | "paused" | "done" | "failed";
export type TaskPriority = "critical" | "high" | "normal" | "low";

export interface OperationTask {
  id: string;
  title: string;
  agent: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  elapsed: string;
  updatedAt: string;
  description: string;
}

export type ActionType = "started" | "completed" | "failed" | "paused" | "resumed" | "retried" | "queued";

export interface TimelineEvent {
  id: string;
  time: string;
  timeAgo: string;
  action: ActionType;
  taskTitle: string;
  agent: string;
  detail: string;
}

export interface Operation {
  id: string;
  name: string;
  agent: string;
  status: "running" | "paused";
  progress: number;
  elapsed: string;
  priority: "high" | "normal";
}
