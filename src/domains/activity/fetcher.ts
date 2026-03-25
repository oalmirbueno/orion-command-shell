import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_EVENTS, FALLBACK_BRIEFING, FALLBACK_ATTENTION } from "./mocks";
import type { ActivityEvent, BriefingItem, AttentionItem, ActivityPageData } from "./types";
import type { DomainFetcher } from "../types";

/** Derive summary stats from events */
function buildSummary(events: ActivityEvent[]) {
  return {
    total: events.length,
    critical: events.filter(e => e.priority === "critical").length,
    warning: events.filter(e => e.priority === "warning").length,
    resolved: events.filter(e => e.priority === "success").length,
  };
}

const FALLBACK_PAGE: ActivityPageData = {
  events: FALLBACK_EVENTS,
  summary: buildSummary(FALLBACK_EVENTS),
};

/** Unified page fetcher — single source of truth for ActivityPage */
export const fetchActivityPage: DomainFetcher<ActivityPageData> = createRealFirstFetcher({
  endpoint: "/activity",
  fallbackData: FALLBACK_PAGE,
});

// Legacy exports for Home page widgets
export const fetchActivityEvents: DomainFetcher<ActivityEvent[]> = createRealFirstFetcher({
  endpoint: "/activity/events",
  fallbackData: FALLBACK_EVENTS,
});
export const fetchBriefing: DomainFetcher<BriefingItem[]> = createFallbackFetcher(FALLBACK_BRIEFING);
export const fetchAttentionItems: DomainFetcher<AttentionItem[]> = createFallbackFetcher(FALLBACK_ATTENTION);
