import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_EVENTS, FALLBACK_BRIEFING, FALLBACK_ATTENTION } from "./mocks";
import type { ActivityEvent, BriefingItem, AttentionItem } from "./types";
import type { DomainFetcher } from "../types";

export const fetchActivityEvents: DomainFetcher<ActivityEvent[]> = createFallbackFetcher(FALLBACK_EVENTS);
export const fetchBriefing: DomainFetcher<BriefingItem[]> = createFallbackFetcher(FALLBACK_BRIEFING);
export const fetchAttentionItems: DomainFetcher<AttentionItem[]> = createFallbackFetcher(FALLBACK_ATTENTION);
