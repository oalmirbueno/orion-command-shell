import { Bot, Clock, MessageSquare, Cpu, ChevronRight, Crown, Users } from "lucide-react";

type AgentStatus = "active" | "idle" | "offline";
type AgentTier = "orchestrator" | "core" | "support";

interface Agent {
  id: string;
  name: string;
  role: string;
  tier: AgentTier;
  model: string;
  status: AgentStatus;
  sessions: number;
  lastActivity: string;
  lastActivityLabel: string;
  load: number;
  tokensToday: string;
  availability: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: "rtr-01", name: "Router-01", role: "Orquestrador de Tarefas",
    tier: "orchestrator", model: "GPT-4o-mini", status: "active", sessions: 5,
    lastActivity: "Distribuindo tasks para fila", lastActivityLabel: "há 1s", load: 63, tokensToday: "67k", availability: "100%",
  },
  {
    id: "clf-01", name: "Classifier-01", role: "Classificação de Leads",
    tier: "core", model: "GPT-4o", status: "active", sessions: 3,
    lastActivity: "Classificando batch #4821", lastActivityLabel: "há 2s", load: 72, tokensToday: "142k", availability: "99.8%",
  },
  {
    id: "enr-01", name: "Enricher-01", role: "Enriquecimento de Dados",
    tier: "core", model: "GPT-4o-mini", status: "active", sessions: 2,
    lastActivity: "Enriquecendo registros CRM", lastActivityLabel: "há 5s", load: 45, tokensToday: "89k", availability: "99.9%",
  },
  {
    id: "sum-01", name: "Summarizer-01", role: "Sumarização de Conteúdo",
    tier: "core", model: "GPT-4o", status: "active", sessions: 2,
    lastActivity: "Sumarizando emails inbound", lastActivityLabel: "há 4s", load: 55, tokensToday: "178k", availability: "99.6%",
  },
  {
    id: "anl-01", name: "Analyzer-01", role: "Detecção de Padrões",
    tier: "core", model: "GPT-4o", status: "idle", sessions: 0,
    lastActivity: "Análise de padrões concluída", lastActivityLabel: "há 12min", load: 0, tokensToday: "34k", availability: "99.7%",
  },
  {
    id: "syn-01", name: "Sync-01", role: "Sincronização de Dados",
    tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1,
    lastActivity: "Sincronizando HubSpot → Lake", lastActivityLabel: "há 3s", load: 91, tokensToday: "201k", availability: "99.5%",
  },
  {
    id: "mon-01", name: "Monitor-01", role: "Saúde & Observabilidade",
    tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1,
    lastActivity: "Ciclo de verificação #8472", lastActivityLabel: "há 8s", load: 18, tokensToday: "12k", availability: "100%",
  },
  {
    id: "val-01", name: "Validator-01", role: "Validação de Dados",
    tier: "support", model: "GPT-4o", status: "offline", sessions: 0,
    lastActivity: "Falha de conexão com API externa", lastActivityLabel: "há 14min", load: 0, tokensToday: "8k", availability: "94.2%",
  },
  {
    id: "exp-01", name: "Exporter-01", role: "Geração de Relatórios",
    tier: "support", model: "GPT-4o-mini", status: "idle", sessions: 0,
    lastActivity: "Relatório semanal exportado", lastActivityLabel: "há 1h", load: 0, tokensToday: "5k", availability: "99.9%",
  },
  {
    id: "res-01", name: "Responder-01", role: "Auto-Resposta & Rascunhos",
    tier: "support", model: "GPT-4o", status: "idle", sessions: 0,
    lastActivity: "Fila vazia — aguardando", lastActivityLabel: "há 3min", load: 0, tokensToday: "22k", availability: "99.8%",
  },
];

const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string; border: string }> = {
  active: { label: "Ativo", dot: "status-online", text: "text-status-online", border: "border-l-status-online" },
  idle: { label: "Ocioso", dot: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30" },
  offline: { label: "Offline", dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical" },
};

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; badgeClass: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, badgeClass: "orion-badge-info" },
  core: { label: "Núcleo", icon: Cpu, badgeClass: "orion-badge-success" },
  support: { label: "Suporte", icon: Users, badgeClass: "orion-badge-neutral" },
};

function LoadBar({ load, status }: { load: number; status: AgentStatus }) {
  if (status === "offline") return <div className="h-1 w-full bg-surface-3 rounded-full" />;
  const color = load > 85 ? "bg-status-warning" : "bg-primary/60";
  return (
    <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${load}%` }} />
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const cfg = statusConfig[agent.status];
  const tier = tierConfig[agent.tier];
  const isDown = agent.status === "offline";

  return (
    <div className={`border border-border/40 rounded-lg bg-card hover:bg-accent/20 transition-colors cursor-pointer border-l-2 ${cfg.border} ${isDown ? "opacity-60" : ""} ${agent.tier === "orchestrator" ? "bg-primary/3" : ""}`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-md bg-surface-2 border border-border/50 flex items-center justify-center ${agent.tier === "orchestrator" ? "bg-primary/10 border-primary/25" : ""}`}>
              <Bot className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-[9px] font-mono uppercase ${cfg.text}`}>{cfg.label}</span>
                <span className={`orion-badge ${tier.badgeClass}`}>{tier.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{agent.role}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/20 mt-1" />
        </div>

        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          <span className="text-[11px] text-foreground/70 truncate">{agent.lastActivity}</span>
          <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 ml-auto">{agent.lastActivityLabel}</span>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-muted-foreground/30" />
            <span className="orion-mono-sm">{agent.model}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Sessões</span>
            <span className={`text-[10px] font-mono font-medium ${agent.sessions > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{agent.sessions}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Tokens</span>
            <span className="text-[10px] font-mono text-foreground">{agent.tokensToday}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Disp.</span>
            <span className={`text-[10px] font-mono ${parseFloat(agent.availability) < 99 ? "text-status-warning" : "text-foreground"}`}>{agent.availability}</span>
          </div>
          <div className="flex-1 max-w-[80px] ml-auto">
            <LoadBar load={agent.load} status={agent.status} />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/40 w-8 text-right">{agent.load}%</span>
        </div>
      </div>
    </div>
  );
}

export function AgentsList() {
  // Tier order: orchestrator → core → support, then by status
  const tierOrder: Record<AgentTier, number> = { orchestrator: 0, core: 1, support: 2 };
  const statusOrder: Record<AgentStatus, number> = { active: 0, idle: 1, offline: 2 };
  const sorted = [...MOCK_AGENTS].sort((a, b) => {
    const t = tierOrder[a.tier] - tierOrder[b.tier];
    return t !== 0 ? t : statusOrder[a.status] - statusOrder[b.status];
  });

  // Group by tier
  const tiers: AgentTier[] = ["orchestrator", "core", "support"];

  return (
    <section>
      <div className="orion-section-header">
        <h2 className="orion-section-label">Registro de Agentes</h2>
        <div className="orion-section-divider" />
        <span className="orion-live-indicator">● AO VIVO</span>
      </div>

      <div className="space-y-6">
        {tiers.map((tier) => {
          const agents = sorted.filter(a => a.tier === tier);
          if (agents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;

          return (
            <div key={tier}>
              <div className="flex items-center gap-1.5 mb-2">
                <TierIcon className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">{cfg.label}</span>
                <span className="text-[9px] font-mono text-muted-foreground/25">{agents.length}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
