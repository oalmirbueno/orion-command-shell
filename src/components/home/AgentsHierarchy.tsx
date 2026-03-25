import { Bot, Crown, Users, Cpu } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

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
  { name: "Router-01", role: "Orquestrador de Tarefas", tier: "orchestrator", status: "active", load: 63 },
  { name: "Classifier-01", role: "Classificação de Leads", tier: "core", status: "active", load: 72 },
  { name: "Enricher-01", role: "Enriquecimento de Dados", tier: "core", status: "active", load: 45 },
  { name: "Summarizer-01", role: "Sumarização de Conteúdo", tier: "core", status: "active", load: 55 },
  { name: "Analyzer-01", role: "Detecção de Padrões", tier: "core", status: "idle", load: 0 },
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
  const { state, data, source, lastUpdated, refetch } = useOrionData<AgentNode[]>({
    key: "agents-hierarchy",
    mockData: AGENT_TREE,
    simulateDelay: 600,
  });

  const tiers: AgentTier[] = ["orchestrator", "core", "support"];
  const activeCount = (data || []).filter(a => a.status === "active").length;
  const total = (data || []).length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Hierarquia de Agentes</h2>
        {data && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-[11px] font-mono text-primary font-semibold">{activeCount}/{total} ativos</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const agents = (data || []).filter(a => a.tier === tier);
            if (agents.length === 0) return null;
            const cfg = tierConfig[tier];
            const TierIcon = cfg.icon;

            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-2">
                  <TierIcon className={`h-4 w-4 ${cfg.color}`} />
                  <span className={`text-[11px] font-mono uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>

                <div className={`grid gap-2 ${tier === "orchestrator" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {agents.map((agent) => (
                    <div key={agent.name} className={`flex items-center gap-4 px-4 py-3 rounded-lg border border-border/40 bg-card hover:bg-accent/30 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-45" : ""} ${tier === "orchestrator" ? "border-l-[3px] border-l-primary/50 bg-primary/5" : ""}`}>
                      <div className={`status-dot ${statusDot[agent.status]}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{agent.name}</span>
                        <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">{agent.role}</p>
                      </div>
                      {agent.status !== "offline" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-surface-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${agent.load > 85 ? "bg-status-warning" : "bg-primary/60"}`} style={{ width: `${agent.load}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/40 w-8 text-right">{agent.load}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
