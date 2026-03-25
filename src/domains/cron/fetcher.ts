import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_CRON_JOBS } from "./mocks";
import type { CronJob } from "./types";
import type { DomainFetcher } from "../types";

export const fetchCronJobs: DomainFetcher<CronJob[]> = createFallbackFetcher(FALLBACK_CRON_JOBS);
