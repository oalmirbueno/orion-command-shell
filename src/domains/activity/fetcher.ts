import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { ActivityEvent, BriefingItem, AttentionItem, ActivityPageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_PAGE: ActivityPageData = {
  events: [],
  summary: { total: 0, critical: 0, warning: 0, resolved: 0 },
};

/** Unified page fetcher — single source of truth for ActivityPage */
export const fetchActivityPage: DomainFetcher<ActivityPageData> = createRealFirstFetcher({
  endpoint: "/activity",
  fallbackData: EMPTY_PAGE,
});

/** Fetchers for Home widgets */
export const fetchActivityEvents: DomainFetcher<ActivityEvent[]> = createRealFirstFetcher({
  endpoint: "/activity/events",
  fallbackData: [],
});

export const fetchBriefing: DomainFetcher<BriefingItem[]> = createRealFirstFetcher({
  endpoint: "/activity/briefing",
  fallbackData: [],
});

export const fetchAttentionItems: DomainFetcher<AttentionItem[]> = createRealFirstFetcher({
  endpoint: "/activity/attention",
  fallbackData: [],
});
