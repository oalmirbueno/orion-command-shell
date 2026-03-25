import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_ALERTS, FALLBACK_ALERTS_PAGE } from "./mocks";
import type { Alert, AlertsPageData } from "./types";
import type { DomainFetcher } from "../types";

/** Unified page fetcher — single source of truth for AlertsPage */
export const fetchAlertsPage: DomainFetcher<AlertsPageData> = createRealFirstFetcher({
  endpoint: "/alerts",
  fallbackData: FALLBACK_ALERTS_PAGE,
});

/** Legacy fetcher kept for Home widgets that only need the alert list */
export const fetchAlerts: DomainFetcher<Alert[]> = createFallbackFetcher(FALLBACK_ALERTS);
