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
  core: { label: "Núcleo", icon: Cpu, color: "text-foreground/70" },
  support: { label: "Suporte", icon: Users, color: "text-muted-foreground" },
};

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/30",
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
    <section className="rounded-md border border-border/50 overflow-hidden h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 surface-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-0.5 bg-primary rounded-full" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-medium">Hierarquia de Agentes</h2>
        </div>
        {data && (
          <span className="text-[10px] font-mono text-primary font-semibold">{activeCount}/{total} ativos</span>
        )}
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="p-3 space-y-3">
          {tiers.map((tier) => {
            const agents = (data || []).filter(a => a.tier === tier);
            if (agents.length === 0) return null;
            const cfg = tierConfig[tier];
            const TierIcon = cfg.icon;

            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <TierIcon className={`h-3 w-3 ${cfg.color}`} />
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>

                <div className="space-y-1">
                  {agents.map((agent) => (
                    <div key={agent.name} className={`flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-accent/20 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-35" : ""} ${tier === "orchestrator" ? "border-l-2 border-l-primary/40 bg-primary/[0.03]" : ""}`}>
                      <div className={`status-dot ${statusDot[agent.status]}`} style={{ width: 6, height: 6 }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium text-foreground">{agent.name}</span>
                        <p className="text-[9px] font-mono text-muted-foreground/40 mt-0">{agent.role}</p>
                      </div>
                      {agent.status !== "offline" && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-12 h-1 bg-surface-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${agent.load > 85 ? "bg-status-warning" : "bg-primary/50"}`} style={{ width: `${agent.load}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground/30 w-7 text-right">{agent.load}%</span>
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
