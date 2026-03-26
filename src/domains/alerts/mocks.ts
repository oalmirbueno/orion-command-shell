import type { AlertsPageData } from "./types";

export const FALLBACK_ALERTS: never[] = [];

export const FALLBACK_ALERTS_PAGE: AlertsPageData = {
  alerts: [],
  summary: { critical: 0, warning: 0, info: 0, resolved: 0 },
};
