/**
 * Home / Command — Empty fallback (production-ready)
 *
 * Returns empty/neutral structures when the real API is unavailable.
 * No fake data — the UI will show appropriate empty states.
 */

import type { HomePageData } from "./types";
import type { CommandData, HealthService } from "../system/types";
import type { AttentionItem, BriefingItem } from "../activity/types";
import type { Operation } from "../operations/types";
import type { AgentNode } from "../agents/types";

const EMPTY_COMMAND: CommandData = {
  systemState: "nominal",
  metrics: [
    { label: "Disponib.", value: "—", icon: "Clock" },
    { label: "Agentes", value: "—", icon: "Bot" },
    { label: "Sessões", value: "—", icon: "Activity" },
    { label: "Tokens/h", value: "—", icon: "Zap" },
  ],
};

const EMPTY_ATTENTION: AttentionItem[] = [];
const EMPTY_LIVE_OPS: Operation[] = [];
const EMPTY_AGENTS: AgentNode[] = [];
const EMPTY_HEALTH: HealthService[] = [];
const EMPTY_BRIEFING: BriefingItem[] = [];

export const FALLBACK_HOME_PAGE: HomePageData = {
  command: EMPTY_COMMAND,
  attention: EMPTY_ATTENTION,
  liveOps: EMPTY_LIVE_OPS,
  agents: EMPTY_AGENTS,
  health: EMPTY_HEALTH,
  briefing: EMPTY_BRIEFING,
};
