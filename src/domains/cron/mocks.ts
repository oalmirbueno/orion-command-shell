import type { CronPageData } from "./types";

export const FALLBACK_CRON_JOBS: never[] = [];

export const FALLBACK_CRON_PAGE: CronPageData = {
  jobs: [],
  summary: { active: 0, healthy: 0, failed: 0, disabled: 0 },
};
