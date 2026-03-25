import { Crown, Cpu, Users, ArrowDown, ArrowRight } from "lucide-react";

/**
 * AgentArchitectureMap — visual top-down view of the agent hierarchy.
 * Shows the orchestrator at the top, core agents in the middle, support at the bottom,
 * with visual flow indicators showing task distribution.
 */

type AgentStatus = "active" | "idle" | "offline";

interface MapNode {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  load: number;
  sessions: number;
  feedsTo?: string[]; // IDs of agents this one feeds tasks to
}

const ORCHESTRATOR: MapNode = {
  id: "rtr-01", name: "Router-01", role: "Orquestrador Central", status: "active", load: 63, sessions: 5,
  feedsTo: ["clf-01", "enr-01", "sum-01", "anl-01"],
};

const CORE_AGENTS: MapNode[] = [
  { id: "clf-01", name: "Classifier-01", role: "Classificação", status: "active", load: 72, sessions: 3, feedsTo: ["syn-01", "val-01"] },
  { id: "enr-01", name: "Enricher-01", role: "Enriquecimento", status: "active", load: 45, sessions: 2, feedsTo: ["syn-01"] },
  { id: "sum-01", name: "Summarizer-01", role: "Sumarização", status: "active", load: 55, sessions: 2, feedsTo: ["res-01"] },
  { id: "anl-01", name: "Analyzer-01", role: "Análise", status: "idle", load: 0, sessions: 0 },
];

const SUPPORT_AGENTS: MapNode[] = [
  { id: "syn-01", name: "Sync-01", role: "Sincronização", status: "active", load: 91, sessions: 1 },
  { id: "mon-01", name: "Monitor-01", role: "Observabilidade", status: "active", load: 18, sessions: 1 },
  { id: "val-01", name: "Validator-01", role: "Validação", status: "offline", load: 0, sessions: 0 },
  { id: "exp-01", name: "Exporter-01", role: "Exportação", status: "idle", load: 0, sessions: 0 },
  { id: "res-01", name: "Responder-01", role: "Auto-Resposta", status: "idle", load: 0, sessions: 0 },
];

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/40",
  offline: "status-critical",
};

function MiniNode({ node, variant = "default" }: { node: MapNode; variant?: "orchestrator" | "core" | "support" | "default" }) {
  const isOrch = variant === "orchestrator";
  const isOffline = node.status === "offline";
  const loadColor = node.load > 85 ? "bg-status-warning" : "bg-primary/60";

  return (
    <div className={`
      relative rounded-lg border bg-card px-4 py-3 transition-all cursor-pointer group
      ${isOrch ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]" : "border-border/40 hover:bg-accent/20"}
      ${isOffline ? "opacity-50" : ""}
    `}>
      {/* Status pulse for active orchestrator */}
      {isOrch && node.status === "active" && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`status-dot ${statusDot[node.status]}`} />
        <span className={`text-[11px] font-semibold ${isOrch ? "text-primary" : "text-foreground"}`}>{node.name}</span>
        {node.sessions > 0 && (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-auto">
            {node.sessions}s
          </span>
        )}
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/50">{node.role}</p>

      {/* Load bar */}
      {node.status !== "offline" && node.load > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${loadColor}`} style={{ width: `${node.load}%` }} />
          </div>
          <span className="text-[8px] font-mono text-muted-foreground/30">{node.load}%</span>
        </div>
      )}
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-4 bg-border/30" />
      <ArrowDown className="h-3 w-3 text-border/40" />
      {label && <span className="text-[7px] font-mono text-muted-foreground/25 mt-0.5">{label}</span>}
    </div>
  );
}

export function AgentArchitectureMap() {
  const activeCore = CORE_AGENTS.filter(a => a.status === "active").length;
  const activeSupport = SUPPORT_AGENTS.filter(a => a.status === "active").length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Mapa de Arquitetura
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● AO VIVO</span>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 p-6">
        {/* Tier 1: Orchestrator */}
        <div className="flex flex-col items-center mb-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Crown className="h-3 w-3 text-primary" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-primary/70">Orquestrador</span>
          </div>
          <div className="w-full max-w-xs">
            <MiniNode node={ORCHESTRATOR} variant="orchestrator" />
          </div>
        </div>

        {/* Flow arrows */}
        <div className="flex justify-center">
          <FlowArrow label="distribui tasks" />
        </div>

        {/* Tier 2: Core */}
        <div className="mb-1">
          <div className="flex items-center gap-1.5 mb-2 justify-center">
            <Cpu className="h-3 w-3 text-foreground/50" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/50">
              Núcleo · {activeCore}/{CORE_AGENTS.length} ativos
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {CORE_AGENTS.map(agent => (
              <MiniNode key={agent.id} node={agent} variant="core" />
            ))}
          </div>
        </div>

        {/* Flow arrows */}
        <div className="flex justify-center">
          <FlowArrow label="alimenta" />
        </div>

        {/* Tier 3: Support */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 justify-center">
            <Users className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/40">
              Suporte · {activeSupport}/{SUPPORT_AGENTS.length} ativos
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {SUPPORT_AGENTS.map(agent => (
              <MiniNode key={agent.id} node={agent} variant="support" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
