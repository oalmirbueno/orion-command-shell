import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_SESSIONS } from "./mocks";
import type { Session } from "./types";
import type { DomainFetcher } from "../types";

export const fetchSessions: DomainFetcher<Session[]> = createFallbackFetcher(FALLBACK_SESSIONS);
