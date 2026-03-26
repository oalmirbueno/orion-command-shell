// Home / Command — Tipos Canônicos
//
// Home é um agregador leve que compõe leituras dos domínios base.
// Não é uma fonte primária de dados.

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — agregação dos domínios existentes
// ═══════════════════════════════════════════════════════

// Home não define tipos canônicos próprios.
// Ela reutiliza os tipos de UI (view) dos domínios base.
// Os tipos abaixo são re-exports para conveniência do page model.

import type { CommandData, HealthService } from "../system/types";
import type { AttentionItem, BriefingItem } from "../activity/types";
import type { Operation } from "../operations/types";
import type { AgentNode } from "../agents/types";

export type { CommandData, HealthService, AttentionItem, BriefingItem, Operation, AgentNode };

// ═══════════════════════════════════════════════════════
// PAGE MODEL — composição para a UI
// ═══════════════════════════════════════════════════════

export interface HomePageData {
  /** Top banner — system state + key metrics (de System) */
  command: CommandData;
  /** Items requiring immediate attention (de Activity) */
  attention: AttentionItem[];
  /** Live running operations (de Operations) */
  liveOps: Operation[];
  /** Agent hierarchy tree (de Agents) */
  agents: AgentNode[];
  /** Service health table (de System) */
  health: HealthService[];
  /** Executive briefing timeline (de Activity) */
  briefing: BriefingItem[];
}
