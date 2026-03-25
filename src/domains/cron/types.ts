export type JobStatus = "healthy" | "failed" | "warning" | "disabled";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  enabled: boolean;
  status: JobStatus;
  lastRun: string;
  lastRunAgo: string;
  lastDuration: string;
  lastResult: "success" | "failure" | "—";
  nextRun: string;
  nextRunIn: string;
  consecutiveSuccess: number;
  consecutiveFails: number;
  error?: string;
}
