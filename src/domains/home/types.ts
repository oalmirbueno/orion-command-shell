/**
 * Home / Command — Unified Page Model
 *
 * Aggregates data from multiple domains into a single
 * coherent structure for the Home page.
 */

import type { CommandData, HealthService } from "../system/types";
import type { AttentionItem, BriefingItem } from "../activity/types";
import type { Operation } from "../operations/types";
import type { AgentNode } from "../agents/types";

export interface HomePageData {
  /** Top banner — system state + key metrics */
  command: CommandData;
  /** Items requiring immediate attention */
  attention: AttentionItem[];
  /** Live running operations */
  liveOps: Operation[];
  /** Agent hierarchy tree */
  agents: AgentNode[];
  /** Service health table */
  health: HealthService[];
  /** Executive briefing timeline */
  briefing: BriefingItem[];
}
