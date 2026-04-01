// Timeline Domain — Tipos para visão temporal unificada

export type TimelineItemType =
  | "session"
  | "cron"
  | "alert"
  | "agent"
  | "system"
  | "operation";

export type TimelineItemStatus =
  | "running"
  | "completed"
  | "failed"
  | "scheduled"
  | "warning"
  | "critical"
  | "info";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  status: TimelineItemStatus;
  title: string;
  detail: string;
  source: string;
  timestamp: string;       // ISO 8601
  timeLabel: string;       // "14:32"
  timeAgo: string;         // "5min atrás"
  domain: string;          // "sessions", "cron", etc.
  linkTo?: string;         // rota para navegar
}

export interface TimelineSummary {
  total: number;
  running: number;
  completed: number;
  failed: number;
  scheduled: number;
  critical: number;
}

export interface TimelinePageData {
  items: TimelineItem[];
  summary: TimelineSummary;
}
