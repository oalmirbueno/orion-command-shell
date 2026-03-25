export type Severity = "critical" | "warning" | "info" | "resolved";

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  action: string;
  source: string;
  triggeredAt: string;
  triggeredAgo: string;
  resolvedAt?: string;
  acknowledged: boolean;
  occurrences: number;
}
