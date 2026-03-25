import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_CRON_JOBS, FALLBACK_CRON_PAGE } from "./mocks";
import type { CronJob, CronPageData } from "./types";
import type { DomainFetcher } from "../types";

/** Unified page fetcher — single source of truth for CronPage */
export const fetchCronPage: DomainFetcher<CronPageData> = createRealFirstFetcher({
  endpoint: "/cron",
  fallbackData: FALLBACK_CRON_PAGE,
});

/** Legacy fetcher kept for Home widgets that only need the job list */
export const fetchCronJobs: DomainFetcher<CronJob[]> = createFallbackFetcher(FALLBACK_CRON_JOBS);
