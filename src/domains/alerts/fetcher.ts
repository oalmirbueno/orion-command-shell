import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { Alert, AlertsPageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_ALERTS_PAGE: AlertsPageData = {
  alerts: [],
  summary: { critical: 0, warning: 0, info: 0, resolved: 0 },
};

/** Unified page fetcher — single source of truth for AlertsPage */
export const fetchAlertsPage: DomainFetcher<AlertsPageData> = createRealFirstFetcher({
  endpoint: "/alerts",
  fallbackData: EMPTY_ALERTS_PAGE,
});

/** Fetcher for Home widgets that only need the alert list */
export const fetchAlerts: DomainFetcher<Alert[]> = createRealFirstFetcher({
  endpoint: "/alerts/list",
  fallbackData: [],
});
