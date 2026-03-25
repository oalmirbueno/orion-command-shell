export type SessionStatus = "running" | "paused" | "completed" | "failed";
export type SessionType = "classification" | "enrichment" | "sync" | "analysis" | "export" | "routing";

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  agent: string;
  model: string;
  status: SessionStatus;
  progress: number;
  preview: string;
  startedAt: string;
  elapsed: string;
  tokens: string;
}
