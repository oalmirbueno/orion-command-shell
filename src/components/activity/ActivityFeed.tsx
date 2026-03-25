import {
  AlertCircle, AlertTriangle, CheckCircle2, Info, Zap,
  Bot, Server, GitBranch, Shield, Clock, ChevronRight,
} from "lucide-react";

type EventPriority = "critical" | "warning" | "success" | "info" | "neutral";
type EventCategory = "agent" | "system" | "pipeline" | "security" | "session" | "deploy";

interface ActivityEvent {
  id: string;
  time: string;
  timeAgo: string;
  priority: EventPriority;
  category: EventCategory;
  title: string;
  description: string;
  source: string;
}

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: "e-01", time: "09:47", timeAgo: "Agora", priority: "critical",
    category: "agent", title: "Validator-01 ficou offline",
    description: "Falha de conexão com API externa após 3 retries. Última resposta: timeout 30s.",
    source: "Validator-01",
  },
  {
    id: "e-02", time: "09:45", timeAgo: "2min ago", priority: "warning",
    category: "pipeline", title: "Pipeline ingestão com latência elevada",
    description: "P95 subiu para 187ms (threshold: 100ms). Causa provável: volume de dados 3x acima do normal.",
    source: "Data Pipeline",
  },
  {
    id: "e-03", time: "09:42", timeAgo: "5min ago", priority: "success",
    category: "system", title: "Rollback automático concluído com sucesso",
    description: "Pipeline restaurado para v2.14.2 após falha no deploy. Performance normalizada em 4min.",
    source: "Core Engine",
  },
  {
    id: "e-04", time: "09:40", timeAgo: "7min ago", priority: "info",
    category: "session", title: "Session Health Check #8472 iniciada",
    description: "Verificação de 12 endpoints agendada. Execução automática pelo Monitor-01.",
    source: "Monitor-01",
  },
  {
    id: "e-05", time: "09:38", timeAgo: "9min ago", priority: "warning",
    category: "agent", title: "Sync-01 atingiu 91% de carga",
    description: "Carga elevada devido a sync CRM com 2.1k registros simultâneos. Monitorando.",
    source: "Sync-01",
  },
  {
    id: "e-06", time: "09:34", timeAgo: "13min ago", priority: "success",
    category: "session", title: "Sync CRM → Data Lake concluído",
    description: "1.8k registros sincronizados com sucesso. Duração: 8min. Zero erros.",
    source: "Sync-01",
  },
  {
    id: "e-07", time: "09:28", timeAgo: "19min ago", priority: "info",
    category: "session", title: "Classificação Batch #4821 iniciada",
    description: "8.4k leads enfileirados para classificação. Agente Classifier-01 alocado.",
    source: "Classifier-01",
  },
  {
    id: "e-08", time: "09:22", timeAgo: "25min ago", priority: "neutral",
    category: "session", title: "Sumarização Emails Inbound iniciada",
    description: "156 emails capturados. Prioridade alta. Summarizer-01 processando.",
    source: "Summarizer-01",
  },
  {
    id: "e-09", time: "09:15", timeAgo: "32min ago", priority: "warning",
    category: "security", title: "Rate limit atingido na API de enrichment",
    description: "Clearbit retornou 429. Backoff exponencial ativado. Próximo retry em 60s.",
    source: "Enricher-01",
  },
  {
    id: "e-10", time: "09:10", timeAgo: "37min ago", priority: "info",
    category: "session", title: "Enriquecimento Leads Q1 iniciado",
    description: "7.8k registros para enriquecimento via LinkedIn + Clearbit. ETA: 45min.",
    source: "Enricher-01",
  },
  {
    id: "e-11", time: "08:55", timeAgo: "52min ago", priority: "neutral",
    category: "deploy", title: "Deploy v2.14.3 em staging validado",
    description: "Todos os testes passaram. Aguardando aprovação manual para produção.",
    source: "Release Pipeline",
  },
  {
    id: "e-12", time: "08:45", timeAgo: "1h ago", priority: "info",
    category: "session", title: "Reprocessamento pausado por operador",
    description: "Session s-4816 pausada manualmente. 480 eventos pendentes na fila.",
    source: "Analyzer-01",
  },
  {
    id: "e-13", time: "08:30", timeAgo: "1h17 ago", priority: "success",
    category: "deploy", title: "Deploy v2.14.3 aprovado para staging",
    description: "Build #1847 promovido. Imagem docker validada. Ambiente staging atualizado.",
    source: "Release Pipeline",
  },
  {
    id: "e-14", time: "08:00", timeAgo: "1h47 ago", priority: "success",
    category: "system", title: "Health check matinal concluído",
    description: "Rotina diária executada. 11/12 serviços nominais. Data Pipeline com P95 elevado.",
    source: "Health Monitor",
  },
  {
    id: "e-15", time: "07:30", timeAgo: "2h17 ago", priority: "success",
    category: "session", title: "Classificação Batch #4809 concluída",
    description: "6.2k leads classificados. Accuracy: 97.3%. Duração: 18min.",
    source: "Classifier-01",
  },
];

const priorityConfig: Record<EventPriority, { icon: React.ElementType; dot: string; text: string; borderAccent: string; bg: string }> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", borderAccent: "border-l-status-critical", bg: "bg-status-critical/5" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", borderAccent: "border-l-status-warning", bg: "bg-status-warning/5" },
  success: { icon: CheckCircle2, dot: "status-online", text: "text-status-online", borderAccent: "border-l-status-online", bg: "" },
  info: { icon: Info, dot: "bg-primary/50", text: "text-primary", borderAccent: "border-l-primary/30", bg: "" },
  neutral: { icon: Clock, dot: "bg-muted-foreground/30", text: "text-muted-foreground", borderAccent: "border-l-muted-foreground/20", bg: "" },
};

const categoryConfig: Record<EventCategory, { icon: React.ElementType; label: string; color: string }> = {
  agent: { icon: Bot, label: "Agent", color: "bg-primary/10 text-primary border-primary/20" },
  system: { icon: Server, label: "System", color: "bg-status-online/10 text-status-online border-status-online/20" },
  pipeline: { icon: GitBranch, label: "Pipeline", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  security: { icon: Shield, label: "Security", color: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  session: { icon: Zap, label: "Session", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  deploy: { icon: GitBranch, label: "Deploy", color: "bg-primary/10 text-primary border-primary/20" },
};

// Group events by time blocks
function groupByTimeBlock(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const blocks: { label: string; events: ActivityEvent[] }[] = [];
  let currentBlock: { label: string; events: ActivityEvent[] } | null = null;

  for (const event of events) {
    const hour = parseInt(event.time.split(":")[0]);
    let blockLabel: string;
    if (event.timeAgo.includes("Just now") || event.timeAgo.includes("min ago")) {
      const mins = parseInt(event.timeAgo) || 0;
      blockLabel = mins <= 10 || event.timeAgo === "Just now" ? "Right Now" : "Last 30 Minutes";
    } else {
      blockLabel = hour >= 9 ? "Earlier Today" : "This Morning";
    }

    if (!currentBlock || currentBlock.label !== blockLabel) {
      currentBlock = { label: blockLabel, events: [] };
      blocks.push(currentBlock);
    }
    currentBlock.events.push(event);
  }

  return blocks;
}

function EventRow({ event }: { event: ActivityEvent }) {
  const pcfg = priorityConfig[event.priority];
  const ccfg = categoryConfig[event.category];
  const PIcon = pcfg.icon;
  const isHot = event.priority === "critical" || event.priority === "warning";
  const isDimmed = event.priority === "neutral";

  return (
    <div className={`flex gap-4 group cursor-pointer hover:bg-accent/20 transition-colors rounded-lg border border-border/30 border-l-2 ${pcfg.borderAccent} ${pcfg.bg} ${isDimmed ? "opacity-60 hover:opacity-80" : ""} px-4 py-3.5`}>
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0 w-12 pt-0.5">
        <span className="text-[10px] font-mono text-primary/70 leading-none">{event.time}</span>
        <span className="text-[8px] font-mono text-muted-foreground/30 mt-0.5 leading-none whitespace-nowrap">{event.timeAgo}</span>
      </div>

      {/* Priority icon */}
      <div className="shrink-0 pt-0.5">
        <PIcon className={`h-4 w-4 ${pcfg.text} ${isHot ? "animate-pulse-glow" : ""}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[13px] font-medium text-foreground truncate">{event.title}</h3>
          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${ccfg.color}`}>
            {ccfg.label}
          </span>
        </div>
        <p className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2">{event.description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[9px] font-mono text-muted-foreground/40">via {event.source}</span>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0 flex items-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const blocks = groupByTimeBlock(MOCK_EVENTS);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Event Feed
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-online/10 border border-status-online/20">
          <span className="text-[9px] font-mono text-status-online font-medium">{MOCK_EVENTS.length} events</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● LIVE</span>
      </div>

      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.label}>
            {/* Time block header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">{block.label}</span>
              <div className="flex-1 h-px bg-border/20" />
            </div>

            {/* Events in block */}
            <div className="space-y-1.5">
              {block.events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
