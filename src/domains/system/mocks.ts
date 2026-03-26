import type { SystemPageData } from "./types";

function generateEmptyUptimeDays() {
  return [];
}

export const FALLBACK_SYSTEM_PAGE: SystemPageData = {
  header: {
    overallStatus: "healthy",
    host: "—",
    uptime: "—",
    lastCheck: "—",
  },
  gauges: [],
  services: [],
  signals: [],
  uptimeDays: generateEmptyUptimeDays(),
  uptimePercent: "—",
};
