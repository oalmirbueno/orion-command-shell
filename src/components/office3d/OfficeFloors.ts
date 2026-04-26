/**
 * Office Floors — modelagem dinâmica de "andares" do escritório.
 *
 * Não há conceito de "floor" no backend, então os andares são derivados
 * de tier + status do agente. Cada andar tem:
 *   - filtro: agentes que pertencem a ele
 *   - foco de câmera: alvo/zoom para o OrbitControls
 *
 * Os andares são uma camada de NAVEGAÇÃO sobre a mesma cena 3D existente,
 * sem recriar geometria nem quebrar layout atual.
 */
import type { AgentView } from "@/domains/agents/types";
import type { LucideIcon } from "lucide-react";
import { Building2, Cpu, GraduationCap, Users, Wrench, Globe2 } from "lucide-react";

export type FloorId = "all" | "lobby" | "operations" | "training" | "meeting" | "infra" | "campus";

export interface FloorDefinition {
  id: FloorId;
  label: string;
  description: string;
  Icon: LucideIcon;
  /** Foco de câmera: target X/Y/Z */
  cameraTarget: [number, number, number];
  /** Distância sugerida da câmera */
  cameraDistance: number;
  /** Predicate para filtrar agentes neste andar */
  match: (a: AgentView) => boolean;
}

/** Definições derivadas — sem cadastro hardcoded de agentes. */
export const OFFICE_FLOORS: FloorDefinition[] = [
  {
    id: "all",
    label: "Visão Geral",
    description: "Todos os andares e setores",
    Icon: Building2,
    cameraTarget: [0, 0.5, 0.5],
    cameraDistance: 14,
    match: () => true,
  },
  {
    id: "lobby",
    label: "Lobby",
    description: "Orquestradores e ponto de entrada",
    Icon: Building2,
    cameraTarget: [0, 0.6, -0.6],
    cameraDistance: 8,
    match: (a) => a.tier === "orchestrator",
  },
  {
    id: "operations",
    label: "Operações",
    description: "Agentes core executando tarefas",
    Icon: Cpu,
    cameraTarget: [0, 0.5, 2.2],
    cameraDistance: 10,
    match: (a) => a.tier === "core" && a.status !== "offline",
  },
  {
    id: "training",
    label: "Treinamento",
    description: "Agentes idle aguardando trabalho",
    Icon: GraduationCap,
    cameraTarget: [0, 0.5, 2.2],
    cameraDistance: 11,
    match: (a) => a.status === "idle",
  },
  {
    id: "meeting",
    label: "Reunião",
    description: "Agentes em sala de reunião",
    Icon: Users,
    cameraTarget: [0, 0.6, -4.5],
    cameraDistance: 6,
    // Match real: vir de fora (meetingAgentIds) — aqui sempre falso, será sobreposto
    match: () => false,
  },
  {
    id: "infra",
    label: "Infra & Suporte",
    description: "Agentes de suporte e infraestrutura",
    Icon: Wrench,
    cameraTarget: [0, 0.5, 1],
    cameraDistance: 13,
    match: (a) => a.tier === "support",
  },
  {
    id: "campus",
    label: "Campus",
    description: "Agentes externos / offline",
    Icon: Globe2,
    cameraTarget: [0, 0.5, 0.5],
    cameraDistance: 16,
    match: (a) => a.status === "offline",
  },
];

export function getFloor(id: FloorId): FloorDefinition {
  return OFFICE_FLOORS.find(f => f.id === id) ?? OFFICE_FLOORS[0];
}

/** Conta agentes por andar — para badges no seletor. */
export function countByFloor(agents: AgentView[], meetingIds: string[] = []): Record<FloorId, number> {
  const counts: Record<FloorId, number> = {
    all: agents.length,
    lobby: 0,
    operations: 0,
    training: 0,
    meeting: meetingIds.length,
    infra: 0,
    campus: 0,
  };
  for (const a of agents) {
    if (a.tier === "orchestrator") counts.lobby++;
    if (a.tier === "core" && a.status !== "offline") counts.operations++;
    if (a.status === "idle") counts.training++;
    if (a.tier === "support") counts.infra++;
    if (a.status === "offline") counts.campus++;
  }
  return counts;
}
