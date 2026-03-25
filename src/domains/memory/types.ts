export type MemoryCategory = "context" | "decision" | "learning" | "profile" | "config" | "incident";

export interface MemorySnapshot {
  id: string;
  title: string;
  category: MemoryCategory;
  summary: string;
  context: string;
  capturedAt: string;
  capturedAgo: string;
  source: string;
  tags: string[];
  relevance: "high" | "medium" | "low";
}
