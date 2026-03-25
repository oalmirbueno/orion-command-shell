import { Bot, Clock, MessageSquare, Cpu, ChevronRight } from "lucide-react";

type AgentStatus = "active" | "idle" | "offline";

interface Agent {
  id: string;
  name: string;
  role: string;
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
    id: "clf-01", name: "Classifier-01", role: "Lead Scoring & Classification",
    model: "GPT-4o", status: "active", sessions: 3, lastActivity: "Classificando batch #4821",
    lastActivityLabel: "2s ago", load: 72, tokensToday: "142k", availability: "99.8%",
  },
  {
    id: "enr-01", name: "Enricher-01", role: "Data Enrichment & Augmentation",
    model: "GPT-4o-mini", status: "active", sessions: 2, lastActivity: "Enriquecendo registros CRM",
    lastActivityLabel: "5s ago", load: 45, tokensToday: "89k", availability: "99.9%",
  },
  {
    id: "rtr-01", name: "Router-01", role: "Task Routing & Distribution",
    model: "GPT-4o-mini", status: "active", sessions: 5, lastActivity: "Distribuindo tasks para fila",
    lastActivityLabel: "1s ago", load: 63, tokensToday: "67k", availability: "100%",
  },
  {
    id: "anl-01", name: "Analyzer-01", role: "Pattern Detection & Insights",
    model: "GPT-4o", status: "idle", sessions: 0, lastActivity: "Análise de padrões concluída",
    lastActivityLabel: "12min ago", load: 0, tokensToday: "34k", availability: "99.7%",
  },
  {
    id: "syn-01", name: "Sync-01", role: "Cross-system Data Sync",
    model: "GPT-4o-mini", status: "active", sessions: 1, lastActivity: "Sincronizando HubSpot → Lake",
    lastActivityLabel: "3s ago", load: 91, tokensToday: "201k", availability: "99.5%",
  },
  {
    id: "mon-01", name: "Monitor-01", role: "Health Check & Observability",
    model: "GPT-4o-mini", status: "active", sessions: 1, lastActivity: "Health check cycle #8472",
    lastActivityLabel: "8s ago", load: 18, tokensToday: "12k", availability: "100%",
  },
  {
    id: "val-01", name: "Validator-01", role: "Data Validation & QA",
    model: "GPT-4o", status: "offline", sessions: 0, lastActivity: "Falha de conexão com API externa",
    lastActivityLabel: "14min ago", load: 0, tokensToday: "8k", availability: "94.2%",
  },
  {
    id: "exp-01", name: "Exporter-01", role: "Report Generation & Export",
    model: "GPT-4o-mini", status: "idle", sessions: 0, lastActivity: "Relatório semanal exportado",
    lastActivityLabel: "1h ago", load: 0, tokensToday: "5k", availability: "99.9%",
  },
  {
    id: "sum-01", name: "Summarizer-01", role: "Content Summarization",
    model: "GPT-4o", status: "active", sessions: 2, lastActivity: "Sumarizando emails inbound",
    lastActivityLabel: "4s ago", load: 55, tokensToday: "178k", availability: "99.6%",
  },
  {
    id: "res-01", name: "Responder-01", role: "Auto-Response & Drafts",
    model: "GPT-4o", status: "idle", sessions: 0, lastActivity: "Fila vazia — aguardando",
    lastActivityLabel: "3min ago", load: 0, tokensToday: "22k", availability: "99.8%",
  },
];

const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string; border: string }> = {
  active: { label: "Active", dot: "status-online", text: "text-status-online", border: "border-l-status-online" },
  idle: { label: "Idle", dot: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30" },
  offline: { label: "Offline", dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical" },
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
  const isDown = agent.status === "offline";

  return (
    <div className={`border border-border/40 rounded-lg bg-card hover:bg-accent/20 transition-colors cursor-pointer border-l-2 ${cfg.border} ${isDown ? "opacity-60" : ""}`}>
      <div className="px-5 py-4">
        {/* Top: Identity + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-surface-2 border border-border/50 flex items-center justify-center">
              <Bot className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-[9px] font-mono uppercase ${cfg.text}`}>{cfg.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{agent.role}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/20 mt-1" />
        </div>

        {/* Middle: Activity */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          <span className="text-[11px] text-foreground/70 truncate">{agent.lastActivity}</span>
          <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 ml-auto">{agent.lastActivityLabel}</span>
        </div>

        {/* Bottom: Metrics row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-[10px] font-mono text-muted-foreground/60">{agent.model}</span>
          </div>

          <div className="h-3 w-px bg-border/30" />

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground/40">Sessions</span>
            <span className={`text-[10px] font-mono font-medium ${agent.sessions > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{agent.sessions}</span>
          </div>

          <div className="h-3 w-px bg-border/30" />

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground/40">Tokens</span>
            <span className="text-[10px] font-mono text-foreground">{agent.tokensToday}</span>
          </div>

          <div className="h-3 w-px bg-border/30" />

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground/40">Avail</span>
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
  // Sort: active first, then idle, then offline
  const sorted = [...MOCK_AGENTS].sort((a, b) => {
    const order: Record<AgentStatus, number> = { active: 0, idle: 1, offline: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Agent Registry
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● LIVE</span>
      </div>

      <div className="space-y-2">
        {sorted.map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
