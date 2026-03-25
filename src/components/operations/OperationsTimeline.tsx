import {
  CheckCircle2, AlertCircle, Loader2, Pause, Play, RotateCcw,
  Bot, Clock, ArrowRight,
} from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { OrionSectionHeader } from "@/components/orion/primitives";
import { cn } from "@/lib/utils";

/* ── Types ── */

type ActionType = "started" | "completed" | "failed" | "paused" | "resumed" | "retried" | "queued";

interface TimelineEvent {
  id: string;
  time: string;
  timeAgo: string;
  action: ActionType;
  taskTitle: string;
  agent: string;
  detail: string;
}

/* ── Mock ── */

const MOCK_TIMELINE: TimelineEvent[] = [
  { id: "tl-01", time: "09:47", timeAgo: "Agora", action: "failed", taskTitle: "Validação API Externa", agent: "Validator-01", detail: "Timeout após 3 retries — conexão perdida com endpoint" },
  { id: "tl-02", time: "09:47", timeAgo: "Agora", action: "started", taskTitle: "Classificação Batch #4821", agent: "Classifier-01", detail: "8.4k leads carregados — processamento iniciado" },
  { id: "tl-03", time: "09:45", timeAgo: "2min", action: "started", taskTitle: "Sync CRM → Data Lake", agent: "Sync-01", detail: "1.8k registros enfileirados para sincronização" },
  { id: "tl-04", time: "09:42", timeAgo: "5min", action: "completed", taskTitle: "Rollback Pipeline v2.14.2", agent: "Core Engine", detail: "Restauração concluída — performance normalizada em 4min" },
  { id: "tl-05", time: "09:42", timeAgo: "5min", action: "started", taskTitle: "Sumarização Emails Inbound", agent: "Summarizer-01", detail: "156 emails capturados para processamento" },
  { id: "tl-06", time: "09:40", timeAgo: "7min", action: "started", taskTitle: "Enriquecimento Leads Q1", agent: "Enricher-01", detail: "7.8k registros via LinkedIn + Clearbit" },
  { id: "tl-07", time: "09:38", timeAgo: "9min", action: "completed", taskTitle: "Health Check #8472", agent: "Monitor-01", detail: "12 endpoints verificados — todos nominais" },
  { id: "tl-08", time: "09:34", timeAgo: "13min", action: "paused", taskTitle: "Reprocessamento Eventos", agent: "Analyzer-01", detail: "Pausado manualmente pelo operador — 480 eventos pendentes" },
  { id: "tl-09", time: "08:55", timeAgo: "52min", action: "completed", taskTitle: "Deploy v2.14.3 Staging", agent: "Release Pipeline", detail: "Build #1847 validado — todos os testes passaram" },
  { id: "tl-10", time: "08:45", timeAgo: "1h", action: "retried", taskTitle: "Validação API Externa", agent: "Validator-01", detail: "Retry #2 iniciado — backoff exponencial 30s" },
  { id: "tl-11", time: "08:30", timeAgo: "1h17", action: "queued", taskTitle: "Classificação Batch #4822", agent: "Classifier-01", detail: "12k leads enfileirados — aguardando slot disponível" },
  { id: "tl-12", time: "08:00", timeAgo: "1h47", action: "completed", taskTitle: "Health Check Matinal", agent: "Health Monitor", detail: "11/12 serviços nominais — Data Pipeline com P95 elevado" },
];

/* ── Action config ── */

const actionConfig: Record<ActionType, { icon: React.ElementType; label: string; color: string; borderColor: string; bg: string }> = {
  started: { icon: Play, label: "Iniciada", color: "text-status-online", borderColor: "border-l-status-online", bg: "" },
  completed: { icon: CheckCircle2, label: "Concluída", color: "text-primary", borderColor: "border-l-primary/40", bg: "" },
  failed: { icon: AlertCircle, label: "Falha", color: "text-status-critical", borderColor: "border-l-status-critical", bg: "bg-status-critical/[0.03]" },
  paused: { icon: Pause, label: "Pausada", color: "text-status-warning", borderColor: "border-l-status-warning", bg: "" },
  resumed: { icon: Play, label: "Retomada", color: "text-status-online", borderColor: "border-l-status-online/40", bg: "" },
  retried: { icon: RotateCcw, label: "Retry", color: "text-status-warning", borderColor: "border-l-status-warning/40", bg: "bg-status-warning/[0.02]" },
  queued: { icon: Clock, label: "Na Fila", color: "text-muted-foreground", borderColor: "border-l-muted-foreground/30", bg: "" },
};

/* ── Timeline Row ── */

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const cfg = actionConfig[event.action];
  const Icon = cfg.icon;
  const isUrgent = event.action === "failed";

  return (
    <div className="flex gap-0">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-12 shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center",
          isUrgent ? "border-status-critical/40 bg-status-critical/10" : "border-border/40 bg-card",
        )}>
          <Icon className={cn("h-4 w-4", cfg.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border/20 my-1" />}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 rounded-lg border border-l-[3px] px-5 py-4 mb-2 transition-colors cursor-pointer",
        "hover:border-primary/20",
        cfg.borderColor, cfg.bg,
        "border-border/30",
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-xs font-mono text-primary/60 shrink-0 w-12 font-medium">{event.time}</span>
            <span className={cn("text-[9px] font-mono uppercase px-2 py-1 rounded border shrink-0",
              isUrgent ? "bg-status-critical/10 text-status-critical border-status-critical/20" : "bg-surface-2 text-muted-foreground/60 border-border/30"
            )}>
              {cfg.label}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{event.taskTitle}</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Bot className="h-4 w-4 text-muted-foreground/25" />
            <span className="text-[11px] font-mono text-muted-foreground/40">{event.agent}</span>
          </div>
        </div>
        <p className="text-xs text-foreground/40 leading-relaxed mt-1.5 ml-12 line-clamp-1">{event.detail}</p>
      </div>
    </div>
  );
}

/* ── Main Export ── */

export function OperationsTimeline() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<TimelineEvent[]>({
    key: "operations-timeline",
    mockData: MOCK_TIMELINE,
    simulateDelay: 400,
  });

  const events = data || [];

  return (
    <section className="space-y-4">
      <OrionSectionHeader
        label="Linha do Tempo Operacional"
        badge={{ text: `${events.length} eventos`, variant: "info" }}
        live
      />

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="max-w-5xl max-h-[500px] overflow-y-auto orion-thin-scroll pr-2">
          {events.map((event, i) => (
            <TimelineRow key={event.id} event={event} isLast={i === events.length - 1} />
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
