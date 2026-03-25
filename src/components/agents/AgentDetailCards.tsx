import { Bot, Cpu, MessageSquare, Clock, Zap, AlertTriangle, Crown, Users, ArrowRight, Activity } from "lucide-react";

type AgentStatus = "active" | "idle" | "offline";
type AgentTier = "orchestrator" | "core" | "support";

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  tier: AgentTier;
  model: string;
  status: AgentStatus;
  sessions: number;
  currentTask: string;
  currentTaskAge: string;
  load: number;
  tokensToday: string;
  availability: string;
  dependsOn: string[];
  feeds: string[];
  alertCount: number;
}

const AGENTS: AgentDetail[] = [
  {
    id: "rtr-01", name: "Router-01", role: "Orquestrador de Tarefas",
    tier: "orchestrator", model: "GPT-4o-mini", status: "active", sessions: 5,
    currentTask: "Distribuindo tasks para fila de classificação", currentTaskAge: "há 1s",
    load: 63, tokensToday: "67k", availability: "100%",
    dependsOn: [], feeds: ["Classifier-01", "Enricher-01", "Summarizer-01", "Analyzer-01"],
    alertCount: 0,
  },
  {
    id: "clf-01", name: "Classifier-01", role: "Classificação de Leads",
    tier: "core", model: "GPT-4o", status: "active", sessions: 3,
    currentTask: "Classificando batch #4821 — 67% concluído", currentTaskAge: "há 2s",
    load: 72, tokensToday: "142k", availability: "99.8%",
    dependsOn: ["Router-01"], feeds: ["Sync-01", "Validator-01"],
    alertCount: 0,
  },
  {
    id: "enr-01", name: "Enricher-01", role: "Enriquecimento de Dados",
    tier: "core", model: "GPT-4o-mini", status: "active", sessions: 2,
    currentTask: "Enriquecendo registros via LinkedIn + Clearbit", currentTaskAge: "há 5s",
    load: 45, tokensToday: "89k", availability: "99.9%",
    dependsOn: ["Router-01"], feeds: ["Sync-01"],
    alertCount: 0,
  },
  {
    id: "sum-01", name: "Summarizer-01", role: "Sumarização de Conteúdo",
    tier: "core", model: "GPT-4o", status: "active", sessions: 2,
    currentTask: "Sumarizando 156 emails inbound", currentTaskAge: "há 4s",
    load: 55, tokensToday: "178k", availability: "99.6%",
    dependsOn: ["Router-01"], feeds: ["Responder-01"],
    alertCount: 0,
  },
  {
    id: "anl-01", name: "Analyzer-01", role: "Detecção de Padrões",
    tier: "core", model: "GPT-4o", status: "idle", sessions: 0,
    currentTask: "Aguardando — última análise concluída", currentTaskAge: "há 12min",
    load: 0, tokensToday: "34k", availability: "99.7%",
    dependsOn: ["Router-01"], feeds: [],
    alertCount: 0,
  },
  {
    id: "syn-01", name: "Sync-01", role: "Sincronização de Dados",
    tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1,
    currentTask: "Sincronizando HubSpot → Data Lake (2.1k registros)", currentTaskAge: "há 3s",
    load: 91, tokensToday: "201k", availability: "99.5%",
    dependsOn: ["Classifier-01", "Enricher-01"], feeds: [],
    alertCount: 1,
  },
  {
    id: "mon-01", name: "Monitor-01", role: "Saúde & Observabilidade",
    tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1,
    currentTask: "Ciclo de verificação #8472 — 11/12 OK", currentTaskAge: "há 8s",
    load: 18, tokensToday: "12k", availability: "100%",
    dependsOn: [], feeds: [],
    alertCount: 0,
  },
  {
    id: "val-01", name: "Validator-01", role: "Validação de Dados",
    tier: "support", model: "GPT-4o", status: "offline", sessions: 0,
    currentTask: "Offline — falha de conexão com API externa", currentTaskAge: "há 14min",
    load: 0, tokensToday: "8k", availability: "94.2%",
    dependsOn: ["Classifier-01"], feeds: [],
    alertCount: 2,
  },
  {
    id: "exp-01", name: "Exporter-01", role: "Geração de Relatórios",
    tier: "support", model: "GPT-4o-mini", status: "idle", sessions: 0,
    currentTask: "Relatório semanal exportado — aguardando", currentTaskAge: "há 1h",
    load: 0, tokensToday: "5k", availability: "99.9%",
    dependsOn: [], feeds: [],
    alertCount: 0,
  },
  {
    id: "res-01", name: "Responder-01", role: "Auto-Resposta & Rascunhos",
    tier: "support", model: "GPT-4o", status: "idle", sessions: 0,
    currentTask: "Fila vazia — aguardando input do Summarizer", currentTaskAge: "há 3min",
    load: 0, tokensToday: "22k", availability: "99.8%",
    dependsOn: ["Summarizer-01"], feeds: [],
    alertCount: 0,
  },
];

const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string; border: string; bg: string }> = {
  active: { label: "Ativo", dot: "status-online", text: "text-status-online", border: "border-l-status-online", bg: "" },
  idle: { label: "Ocioso", dot: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30", bg: "" },
  offline: { label: "Offline", dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/3" },
};

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; badgeClass: string; description: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, badgeClass: "orion-badge-info", description: "Ponto central de decisão e distribuição de tarefas" },
  core: { label: "Núcleo", icon: Cpu, badgeClass: "orion-badge-success", description: "Agentes primários que executam tarefas de negócio" },
  support: { label: "Suporte", icon: Users, badgeClass: "orion-badge-neutral", description: "Agentes auxiliares de infraestrutura e operações" },
};

function AgentCard({ agent }: { agent: AgentDetail }) {
  const cfg = statusConfig[agent.status];
  const tier = tierConfig[agent.tier];
  const isOrch = agent.tier === "orchestrator";
  const isOffline = agent.status === "offline";
  const loadColor = agent.load > 85 ? "bg-status-warning" : "bg-primary/60";

  return (
    <div className={`
      rounded-xl border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg}
      ${isOrch ? "bg-primary/[0.03] border-primary/25" : ""}
      ${isOffline ? "opacity-60" : ""}
      hover:bg-accent/20 transition-all cursor-pointer group
    `}>
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center ${isOrch ? "bg-primary/10 border-primary/25" : "bg-surface-2 border-border/50"}`}>
              <Bot className={`h-5 w-5 ${isOrch ? "text-primary" : "text-muted-foreground/60"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className={`text-base font-semibold ${isOrch ? "text-primary" : "text-foreground"}`}>{agent.name}</h3>
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-xs font-mono uppercase ${cfg.text}`}>{cfg.label}</span>
              </div>
              <p className="text-sm text-muted-foreground/50 mt-0.5">{agent.role} · <span className="text-muted-foreground/40">{agent.model}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {agent.alertCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-warning/10 border border-status-warning/20">
                <AlertTriangle className="h-4 w-4 text-status-warning" />
                <span className="text-xs font-mono text-status-warning">{agent.alertCount}</span>
              </div>
            )}
            <span className={`orion-badge ${tier.badgeClass}`}>{tier.label}</span>
          </div>
        </div>

        {/* Current Task */}
        <div className="flex items-start gap-3 mb-4 ml-[60px]">
          <Activity className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
          <span className="text-sm text-foreground/65 leading-relaxed">{agent.currentTask}</span>
          <span className="text-xs font-mono text-muted-foreground/30 shrink-0 ml-auto">{agent.currentTaskAge}</span>
        </div>

        {/* Dependencies & Feeds */}
        {(agent.dependsOn.length > 0 || agent.feeds.length > 0) && (
          <div className="flex items-center gap-5 mb-4 ml-[60px] flex-wrap">
            {agent.dependsOn.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground/35 uppercase">Recebe de</span>
                {agent.dependsOn.map(dep => (
                  <span key={dep} className="text-xs font-mono px-2 py-1 rounded bg-surface-2 border border-border/30 text-foreground/60">{dep}</span>
                ))}
              </div>
            )}
            {agent.feeds.length > 0 && (
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground/20" />
                <span className="text-[10px] font-mono text-muted-foreground/35 uppercase">Alimenta</span>
                {agent.feeds.map(f => (
                  <span key={f} className="text-xs font-mono px-2 py-1 rounded bg-surface-2 border border-border/30 text-foreground/60">{f}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-5 pt-4 border-t border-border/20 ml-[60px] flex-wrap">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-muted-foreground/25" />
            <span className="text-xs font-mono text-muted-foreground/40">Sessões</span>
            <span className={`text-sm font-mono font-medium ${agent.sessions > 0 ? "text-foreground" : "text-muted-foreground/30"}`}>{agent.sessions}</span>
          </div>
          <div className="h-4 w-px bg-border/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground/40">Tokens</span>
            <span className="text-sm font-mono text-foreground">{agent.tokensToday}</span>
          </div>
          <div className="h-4 w-px bg-border/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground/40">Disp.</span>
            <span className={`text-sm font-mono ${parseFloat(agent.availability) < 99 ? "text-status-warning" : "text-foreground"}`}>{agent.availability}</span>
          </div>
          {agent.status !== "offline" && agent.load > 0 && (
            <>
              <div className="h-4 w-px bg-border/20" />
              <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                <span className="text-xs font-mono text-muted-foreground/40">Carga</span>
                <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${loadColor}`} style={{ width: `${agent.load}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground/30">{agent.load}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentDetailCards() {
  const tiers: AgentTier[] = ["orchestrator", "core", "support"];

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Detalhe Operacional
        </h2>
        <div className="orion-section-divider" />
        <span className="orion-live-indicator">● AO VIVO</span>
      </div>

      <div className="space-y-8">
        {tiers.map(tier => {
          const agents = AGENTS.filter(a => a.tier === tier);
          if (agents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;
          const activeCount = agents.filter(a => a.status === "active").length;

          return (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-3">
                <TierIcon className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">{cfg.label}</span>
                <span className="text-xs font-mono text-muted-foreground/25">{activeCount}/{agents.length}</span>
                <span className="text-xs text-muted-foreground/30 ml-1">— {cfg.description}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              <div className="space-y-3">
                {agents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
