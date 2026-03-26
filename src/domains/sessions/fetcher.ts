import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { Session } from "./types";
import type { DomainFetcher } from "../types";

export const fetchSessions: DomainFetcher<Session[]> = createRealFirstFetcher({
  endpoint: "/sessions",
  fallbackData: [],
});
