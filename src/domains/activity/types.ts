export type EventPriority = "critical" | "warning" | "success" | "info" | "neutral";
export type EventCategory = "agent" | "system" | "pipeline" | "security" | "session" | "deploy";

export interface ActivityEvent {
  id: string;
  time: string;
  timeAgo: string;
  priority: EventPriority;
  category: EventCategory;
  title: string;
  description: string;
  source: string;
}

export interface BriefingItem {
  time: string;
  content: string;
  source: string;
}

export type AttentionPriority = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  priority: AttentionPriority;
  title: string;
  context: string;
  timestamp: string;
}
