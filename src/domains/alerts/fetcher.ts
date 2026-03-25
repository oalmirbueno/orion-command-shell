import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_ALERTS } from "./mocks";
import type { Alert } from "./types";
import type { DomainFetcher } from "../types";

export const fetchAlerts: DomainFetcher<Alert[]> = createFallbackFetcher(FALLBACK_ALERTS);
