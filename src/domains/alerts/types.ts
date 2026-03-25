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

export interface AlertsSummaryData {
  critical: number;
  warning: number;
  info: number;
  resolved: number;
}

/** Unified page model for the Alerts domain */
export interface AlertsPageData {
  alerts: Alert[];
  summary: AlertsSummaryData;
}
