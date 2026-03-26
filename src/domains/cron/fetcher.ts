import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { CronJob, CronPageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_CRON_PAGE: CronPageData = {
  jobs: [],
  summary: { active: 0, healthy: 0, failed: 0, disabled: 0 },
};

/** Unified page fetcher — single source of truth for CronPage */
export const fetchCronPage: DomainFetcher<CronPageData> = createRealFirstFetcher({
  endpoint: "/cron",
  fallbackData: EMPTY_CRON_PAGE,
});

/** Fetcher for Home widgets that only need the job list */
export const fetchCronJobs: DomainFetcher<CronJob[]> = createRealFirstFetcher({
  endpoint: "/cron/jobs",
  fallbackData: [],
});
