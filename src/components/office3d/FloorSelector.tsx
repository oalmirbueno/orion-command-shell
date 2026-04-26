/**
 * FloorSelector — barra horizontal para escolher o andar visível no Office 3D.
 *
 * É uma camada de navegação sobre a mesma cena, não recria geometria.
 * Cada andar mostra: ícone, nome curto e contagem de agentes pertencentes.
 */
import { OFFICE_FLOORS, type FloorId, countByFloor } from "./OfficeFloors";
import type { AgentView } from "@/domains/agents/types";

interface Props {
  active: FloorId;
  onChange: (id: FloorId) => void;
  agents: AgentView[];
  meetingAgentIds?: string[];
}

export function FloorSelector({ active, onChange, agents, meetingAgentIds = [] }: Props) {
  const counts = countByFloor(agents, meetingAgentIds);

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 bg-card/60 backdrop-blur-sm overflow-x-auto">
      <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mr-2 shrink-0">
        Andar
      </span>
      {OFFICE_FLOORS.map(floor => {
        const isActive = active === floor.id;
        const count = counts[floor.id];
        return (
          <button
            key={floor.id}
            onClick={() => onChange(floor.id)}
            title={floor.description}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 border ${
              isActive
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-card border-transparent"
            }`}
          >
            <floor.Icon className="h-3 w-3" />
            <span>{floor.label}</span>
            <span
              className={`text-[9px] px-1 rounded ${
                isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground/60"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
