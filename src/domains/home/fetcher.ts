/**
 * Home / Command — Unified Fetcher (real-first + fallback-safe)
 * Tenta /api/home primeiro; fallback vazio honesto em erro.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { HomePageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_HOME: HomePageData = {
  command: {
    systemState: "nominal",
    metrics: [
      { label: "Disponib.", value: "—", icon: "Clock" },
      { label: "Agentes", value: "—", icon: "Bot" },
      { label: "Sessões", value: "—", icon: "Activity" },
      { label: "Tokens/h", value: "—", icon: "Zap" },
    ],
  },
  attention: [],
  liveOps: [],
  agents: [],
  health: [],
  briefing: [],
};

export const fetchHomePage: DomainFetcher<HomePageData> = createRealFirstFetcher({
  endpoint: "/home",
  fallbackData: EMPTY_HOME,
});
