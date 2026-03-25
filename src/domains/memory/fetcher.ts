import { createFallbackFetcher } from "../createFallbackFetcher";
import { FALLBACK_SNAPSHOTS } from "./mocks";
import type { MemorySnapshot } from "./types";
import type { DomainFetcher } from "../types";

export const fetchMemorySnapshots: DomainFetcher<MemorySnapshot[]> = createFallbackFetcher(FALLBACK_SNAPSHOTS);
