import { Bot, Crown, Users, Cpu } from "lucide-react";

/**
 * AgentsHierarchy — visão operacional hierárquica dos agentes na home.
 * Mostra a arquitetura real: orquestrador → camadas → agentes.
 */

type AgentTier = "orchestrator" | "core" | "support";
type AgentStatus = "active" | "idle" | "offline";

interface AgentNode {
  name: string;
  role: string;
  tier: AgentTier;
  status: AgentStatus;
  load: number;
}

const AGENT_TREE: AgentNode[] = [
  // Orquestrador
  { name: "Router-01", role: "Orquestrador de Tarefas", tier: "orchestrator", status: "active", load: 63 },
  // Core — agentes primários
  { name: "Classifier-01", role: "Classificação de Leads", tier: "core", status: "active", load: 72 },
  { name: "Enricher-01", role: "Enriquecimento de Dados", tier: "core", status: "active", load: 45 },
  { name: "Summarizer-01", role: "Sumarização de Conteúdo", tier: "core", status: "active", load: 55 },
  { name: "Analyzer-01", role: "Detecção de Padrões", tier: "core", status: "idle", load: 0 },
  // Suporte — agentes auxiliares
  { name: "Sync-01", role: "Sincronização de Dados", tier: "support", status: "active", load: 91 },
  { name: "Monitor-01", role: "Saúde & Observabilidade", tier: "support", status: "active", load: 18 },
  { name: "Validator-01", role: "Validação de Dados", tier: "support", status: "offline", load: 0 },
  { name: "Exporter-01", role: "Geração de Relatórios", tier: "support", status: "idle", load: 0 },
  { name: "Responder-01", role: "Auto-Resposta", tier: "support", status: "idle", load: 0 },
];

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; color: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, color: "text-primary" },
  core: { label: "Núcleo", icon: Cpu, color: "text-foreground" },
  support: { label: "Suporte", icon: Users, color: "text-muted-foreground" },
};

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/40",
  offline: "status-critical",
};

export function AgentsHierarchy() {
  const tiers: AgentTier[] = ["orchestrator", "core", "support"];
  const activeCount = AGENT_TREE.filter(a => a.status === "active").length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Hierarquia de Agentes
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-[9px] font-mono text-primary font-medium">{activeCount}/{AGENT_TREE.length} ativos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const agents = AGENT_TREE.filter(a => a.tier === tier);
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;

          return (
            <div key={tier}>
              {/* Tier label */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <TierIcon className={`h-3 w-3 ${cfg.color}`} />
                <span className={`text-[9px] font-mono uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>

              {/* Agent nodes */}
              <div className={`grid gap-1.5 ${tier === "orchestrator" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md border border-border/30 bg-card hover:bg-accent/20 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-45" : ""} ${tier === "orchestrator" ? "border-l-2 border-l-primary/50 bg-primary/5" : ""}`}
                  >
                    <div className={`status-dot ${statusDot[agent.status]}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-foreground">{agent.name}</span>
                      <p className="text-[9px] font-mono text-muted-foreground/40">{agent.role}</p>
                    </div>
                    {agent.status !== "offline" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-12 h-1 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${agent.load > 85 ? "bg-status-warning" : "bg-primary/60"}`}
                            style={{ width: `${agent.load}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-muted-foreground/30 w-6 text-right">{agent.load}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
