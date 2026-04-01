/**
 * Office 3D — Layout definitions
 * Defines desk positions, sectors, and meeting room coordinates.
 */
import type { AgentView, AgentTier } from "@/domains/agents/types";

export interface DeskPosition {
  position: [number, number, number];
  rotation?: number; // Y-axis rotation in radians
  sector: OfficeSector;
}

export type OfficeSector = "command" | "operations" | "support" | "meeting" | "monitoring";

export const SECTOR_META: Record<OfficeSector, { label: string; color: string; description: string }> = {
  command:    { label: "Comando Central",  color: "#a78bfa", description: "Orquestração e coordenação" },
  operations: { label: "Operações",       color: "#60a5fa", description: "Execução e processamento" },
  support:    { label: "Suporte & Infra", color: "#6ee7b7", description: "Ferramentas e recursos" },
  meeting:    { label: "Sala de Reunião", color: "#fbbf24", description: "Coordenação de equipe" },
  monitoring: { label: "Monitoramento",   color: "#f87171", description: "Alertas e vigilância" },
};

export const TIER_TO_SECTOR: Record<AgentTier, OfficeSector> = {
  orchestrator: "command",
  core: "operations",
  support: "support",
};

export const STATUS_VISUAL = {
  active:  { color: "#a3e635", label: "Trabalhando", pulse: true },
  idle:    { color: "#fbbf24", label: "Disponível",  pulse: false },
  offline: { color: "#6b7280", label: "Offline",     pulse: false },
} as const;

export const TIER_COLORS: Record<AgentTier, string> = {
  orchestrator: "#a78bfa",
  core: "#60a5fa",
  support: "#6ee7b7",
};

// Floor-plan desk positions by sector
const COMMAND_DESKS: DeskPosition[] = [
  { position: [0, 0, -1],   sector: "command" },
  { position: [-1.8, 0, -0.5], sector: "command" },
  { position: [1.8, 0, -0.5],  sector: "command" },
];

const OPERATIONS_DESKS: DeskPosition[] = [
  { position: [-3.5, 0, 1.5], sector: "operations" },
  { position: [-2, 0, 1.5],   sector: "operations" },
  { position: [-0.5, 0, 1.5], sector: "operations" },
  { position: [0.5, 0, 1.5],  sector: "operations" },
  { position: [2, 0, 1.5],    sector: "operations" },
  { position: [3.5, 0, 1.5],  sector: "operations" },
  { position: [-3.5, 0, 3],   sector: "operations" },
  { position: [-2, 0, 3],     sector: "operations" },
  { position: [-0.5, 0, 3],   sector: "operations" },
  { position: [0.5, 0, 3],    sector: "operations" },
  { position: [2, 0, 3],      sector: "operations" },
  { position: [3.5, 0, 3],    sector: "operations" },
];

const SUPPORT_DESKS: DeskPosition[] = [
  { position: [5, 0, -1],   sector: "support" },
  { position: [5, 0, 0.5],  sector: "support" },
  { position: [5, 0, 2],    sector: "support" },
  { position: [5, 0, 3.5],  sector: "support" },
  { position: [-5, 0, -1],  sector: "support" },
  { position: [-5, 0, 0.5], sector: "support" },
  { position: [-5, 0, 2],   sector: "support" },
  { position: [-5, 0, 3.5], sector: "support" },
];

const MEETING_POSITION: [number, number, number] = [0, 0, -4.5];

const ALL_DESKS = [...COMMAND_DESKS, ...OPERATIONS_DESKS, ...SUPPORT_DESKS];

/**
 * Assign agents to desk positions based on tier.
 * Returns a map of agent id -> desk position.
 */
export function assignDesks(agents: AgentView[]): Map<string, DeskPosition> {
  const map = new Map<string, DeskPosition>();
  
  const orchs = agents.filter(a => a.tier === "orchestrator");
  const cores = agents.filter(a => a.tier === "core");
  const sups  = agents.filter(a => a.tier === "support");

  // Assign orchestrators to command desks
  orchs.forEach((a, i) => {
    if (i < COMMAND_DESKS.length) map.set(a.id, COMMAND_DESKS[i]);
  });

  // Assign core to operations desks
  cores.forEach((a, i) => {
    if (i < OPERATIONS_DESKS.length) map.set(a.id, OPERATIONS_DESKS[i]);
  });

  // Assign support to support desks
  sups.forEach((a, i) => {
    if (i < SUPPORT_DESKS.length) map.set(a.id, SUPPORT_DESKS[i]);
  });

  // Overflow: assign remaining to any free desk
  const assigned = new Set(map.values());
  const free = ALL_DESKS.filter(d => !assigned.has(d));
  const unassigned = agents.filter(a => !map.has(a.id));
  unassigned.forEach((a, i) => {
    if (i < free.length) map.set(a.id, free[i]);
  });

  return map;
}

export { MEETING_POSITION };
