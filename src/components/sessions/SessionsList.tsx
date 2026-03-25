import { Bot, Clock, ChevronRight, Cpu, Flame, Pause, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type SessionStatus = "running" | "paused" | "completed" | "failed";
type SessionType = "classification" | "enrichment" | "sync" | "analysis" | "export" | "routing";

interface Session {
  id: string;
  title: string;
  type: SessionType;
  agent: string;
  model: string;
  status: SessionStatus;
  progress: number;
  preview: string;
  startedAt: string;
  elapsed: string;
  tokens: string;
}

const MOCK_SESSIONS: Session[] = [
  {
    id: "s-4821", title: "Classificação Batch #4821", type: "classification",
    agent: "Classifier-01", model: "GPT-4o", status: "running", progress: 67,
    preview: "Processando 8.4k leads · 5.6k classificados · ETA 12min",
    startedAt: "09:28", elapsed: "14min", tokens: "42k",
  },
  {
    id: "s-4820", title: "Sync CRM → Data Lake", type: "sync",
    agent: "Sync-01", model: "GPT-4o-mini", status: "running", progress: 88,
    preview: "Sincronizando 2.1k registros · 1.8k sincronizados",
    startedAt: "09:34", elapsed: "8min", tokens: "18k",
  },
  {
    id: "s-4819", title: "Sumarização Emails Inbound", type: "analysis",
    agent: "Summarizer-01", model: "GPT-4o", status: "running", progress: 34,
    preview: "Processando 156 emails · 53 sumarizados · Prioridade alta",
    startedAt: "09:22", elapsed: "20min", tokens: "89k",
  },
  {
    id: "s-4818", title: "Enriquecimento Leads Q1", type: "enrichment",
    agent: "Enricher-01", model: "GPT-4o-mini", status: "running", progress: 41,
    preview: "Enriquecendo com dados LinkedIn e Clearbit · 3.2k/7.8k",
    startedAt: "09:10", elapsed: "32min", tokens: "67k",
  },
  {
    id: "s-4817", title: "Health Check Cycle #8472", type: "routing",
    agent: "Monitor-01", model: "GPT-4o-mini", status: "running", progress: 92,
    preview: "Verificando 12 endpoints · 11/12 OK · 1 pendente",
    startedAt: "09:40", elapsed: "2min", tokens: "3k",
  },
  {
    id: "s-4816", title: "Reprocessamento Eventos Falhos", type: "analysis",
    agent: "Analyzer-01", model: "GPT-4o", status: "paused", progress: 22,
    preview: "Pausado por operador · 480 eventos pendentes",
    startedAt: "08:45", elapsed: "1h02", tokens: "34k",
  },
  {
    id: "s-4815", title: "Validação Dataset Treinamento", type: "enrichment",
    agent: "Validator-01", model: "GPT-4o", status: "failed", progress: 15,
    preview: "Erro: API externa não responde · Retry 3/3 falhou",
    startedAt: "09:12", elapsed: "30min", tokens: "8k",
  },
  {
    id: "s-4814", title: "Distribuição Tasks Sprint 14", type: "routing",
    agent: "Router-01", model: "GPT-4o-mini", status: "paused", progress: 60,
    preview: "Aguardando aprovação do operador · 12 tasks pendentes",
    startedAt: "08:55", elapsed: "47min", tokens: "14k",
  },
  {
    id: "s-4810", title: "Export Relatório Semanal", type: "export",
    agent: "Exporter-01", model: "GPT-4o-mini", status: "completed", progress: 100,
    preview: "PDF gerado · 24 páginas · Enviado para stakeholders",
    startedAt: "08:00", elapsed: "12min", tokens: "5k",
  },
  {
    id: "s-4809", title: "Classificação Batch #4809", type: "classification",
    agent: "Classifier-01", model: "GPT-4o", status: "completed", progress: 100,
    preview: "6.2k leads classificados · Accuracy 97.3%",
    startedAt: "07:30", elapsed: "18min", tokens: "52k",
  },
];

const statusConfig: Record<SessionStatus, { icon: React.ElementType; dot: string; text: string; bg: string; border: string }> = {
  running: { icon: Flame, dot: "status-online", text: "text-status-online", bg: "bg-status-online/5", border: "border-l-status-online" },
  paused: { icon: Pause, dot: "status-warning", text: "text-status-warning", bg: "bg-status-warning/5", border: "border-l-status-warning" },
  completed: { icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary", bg: "", border: "border-l-primary/30" },
  failed: { icon: XCircle, dot: "status-critical", text: "text-status-critical", bg: "bg-status-critical/5", border: "border-l-status-critical" },
};

const typeBadge: Record<SessionType, { label: string; color: string }> = {
  classification: { label: "Classificação", color: "bg-primary/10 text-primary border-primary/20" },
  enrichment: { label: "Enriquecimento", color: "bg-status-info/10 text-status-info border-status-info/20" },
  sync: { label: "Sincronização", color: "bg-status-online/10 text-status-online border-status-online/20" },
  analysis: { label: "Análise", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  export: { label: "Exportação", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  routing: { label: "Roteamento", color: "bg-primary/10 text-primary border-primary/20" },
};

function ProgressBar({ progress, status }: { progress: number; status: SessionStatus }) {
  const color = status === "failed" ? "bg-status-critical/60" : status === "paused" ? "bg-status-warning/50" : status === "completed" ? "bg-primary/40" : "bg-primary";
  return (
    <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${progress}%` }} />
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const cfg = statusConfig[session.status];
  const badge = typeBadge[session.type];
  const Icon = cfg.icon;
  const isLive = session.status === "running";
  const isDimmed = session.status === "completed";

  return (
    <div className={`border border-border/40 rounded-lg bg-card hover:bg-accent/20 transition-colors cursor-pointer border-l-2 ${cfg.border} ${cfg.bg} ${isDimmed ? "opacity-60 hover:opacity-80" : ""} group`}>
      <div className="px-5 py-4">
        {/* Row 1: Title + Status + Type badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Icon className={`h-4 w-4 shrink-0 ${cfg.text} ${isLive ? "animate-pulse-glow" : ""}`} />
            <h3 className="text-sm font-semibold text-foreground truncate">{session.title}</h3>
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`text-[9px] font-mono uppercase ${cfg.text}`}>{session.status}</span>
            <div className={`status-dot ${cfg.dot}`} />
            <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
          </div>
        </div>

        {/* Row 2: Preview */}
        <p className="text-[11px] text-foreground/60 mb-3 pl-[26px] truncate">{session.preview}</p>

        {/* Row 3: Progress bar */}
        <div className="mb-3 pl-[26px]">
          <ProgressBar progress={session.progress} status={session.status} />
        </div>

        {/* Row 4: Metadata */}
        <div className="flex items-center gap-4 pl-[26px] text-[10px] font-mono text-muted-foreground/50">
          <div className="flex items-center gap-1.5">
            <Bot className="h-3 w-3" />
            <span>{session.agent}</span>
          </div>
          <div className="h-3 w-px bg-border/30" />
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>{session.model}</span>
          </div>
          <div className="h-3 w-px bg-border/30" />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{session.elapsed}</span>
          </div>
          <div className="h-3 w-px bg-border/30" />
          <span>{session.tokens} tokens</span>
          <span className="ml-auto text-muted-foreground/30">Started {session.startedAt}</span>
        </div>
      </div>
    </div>
  );
}

export function SessionsList() {
  // Running first, then paused, then failed, then completed
  const order: Record<SessionStatus, number> = { running: 0, paused: 1, failed: 2, completed: 3 };
  const sorted = [...MOCK_SESSIONS].sort((a, b) => order[a.status] - order[b.status]);

  const runningCount = MOCK_SESSIONS.filter(s => s.status === "running").length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Session Log
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-online/10 border border-status-online/20">
          <span className="text-[9px] font-mono text-status-online font-medium">{runningCount} live</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● LIVE</span>
      </div>

      <div className="space-y-2">
        {sorted.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}
