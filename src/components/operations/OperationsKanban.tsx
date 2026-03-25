import {
  Clock, CheckCircle2, Loader2, AlertCircle, Bot, Flame,
  ArrowRight, Pause, RotateCcw, ChevronRight, Zap,
} from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { OrionSectionHeader } from "@/components/orion/primitives";
import { cn } from "@/lib/utils";

/* ── Types ── */

type TaskStatus = "queued" | "running" | "paused" | "done" | "failed";
type TaskPriority = "critical" | "high" | "normal" | "low";

interface OperationTask {
  id: string;
  title: string;
  agent: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  elapsed: string;
  updatedAt: string;
  description: string;
}

/* ── Mock Data ── */

const MOCK_TASKS: OperationTask[] = [
  { id: "op-01", title: "Classificação Batch #4821", agent: "Classifier-01", status: "running", priority: "critical", progress: 67, elapsed: "14min", updatedAt: "09:47", description: "8.4k leads — accuracy target 97%" },
  { id: "op-02", title: "Sync CRM → Data Lake", agent: "Sync-01", status: "running", priority: "high", progress: 88, elapsed: "8min", updatedAt: "09:45", description: "1.8k registros sincronizando" },
  { id: "op-03", title: "Sumarização Emails Inbound", agent: "Summarizer-01", status: "running", priority: "critical", progress: 34, elapsed: "20min", updatedAt: "09:42", description: "156 emails capturados — prioridade alta" },
  { id: "op-04", title: "Enriquecimento Leads Q1", agent: "Enricher-01", status: "running", priority: "normal", progress: 41, elapsed: "32min", updatedAt: "09:40", description: "7.8k registros via LinkedIn + Clearbit" },
  { id: "op-05", title: "Health Check #8472", agent: "Monitor-01", status: "done", priority: "normal", progress: 100, elapsed: "2min", updatedAt: "09:38", description: "12 endpoints verificados — todos OK" },
  { id: "op-06", title: "Reprocessamento Eventos", agent: "Analyzer-01", status: "paused", priority: "normal", progress: 22, elapsed: "1h02", updatedAt: "09:34", description: "480 eventos pendentes na fila" },
  { id: "op-07", title: "Deploy v2.14.3 Staging", agent: "Release Pipeline", status: "done", priority: "high", progress: 100, elapsed: "6min", updatedAt: "08:55", description: "Build #1847 — todos os testes passaram" },
  { id: "op-08", title: "Rollback Pipeline v2.14.2", agent: "Core Engine", status: "done", priority: "critical", progress: 100, elapsed: "4min", updatedAt: "09:42", description: "Restauração após falha no deploy" },
  { id: "op-09", title: "Classificação Batch #4822", agent: "Classifier-01", status: "queued", priority: "high", progress: 0, elapsed: "—", updatedAt: "09:47", description: "12k leads enfileirados — aguardando slot" },
  { id: "op-10", title: "Sync Salesforce Contacts", agent: "Sync-02", status: "queued", priority: "normal", progress: 0, elapsed: "—", updatedAt: "09:45", description: "3.2k contatos pendentes" },
  { id: "op-11", title: "Geração Report Semanal", agent: "Reporter-01", status: "queued", priority: "low", progress: 0, elapsed: "—", updatedAt: "09:30", description: "Relatório executivo — agendado 10:00" },
  { id: "op-12", title: "Validação API Externa", agent: "Validator-01", status: "failed", priority: "critical", progress: 78, elapsed: "3min", updatedAt: "09:47", description: "Timeout após 3 retries — conexão perdida" },
];

/* ── Column Config ── */

interface ColumnDef {
  key: TaskStatus;
  label: string;
  icon: React.ElementType;
  accentDot: string;
  accentText: string;
  headerBg: string;
  emptyLabel: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "queued", label: "Pendentes", icon: Clock, accentDot: "bg-muted-foreground/50", accentText: "text-muted-foreground", headerBg: "bg-surface-2", emptyLabel: "Nenhuma tarefa na fila" },
  { key: "running", label: "Em Andamento", icon: Flame, accentDot: "bg-status-online", accentText: "text-status-online", headerBg: "bg-status-online/5", emptyLabel: "Nenhuma operação ativa" },
  { key: "paused", label: "Pausadas", icon: Pause, accentDot: "bg-status-warning", accentText: "text-status-warning", headerBg: "bg-status-warning/5", emptyLabel: "Nenhuma tarefa pausada" },
  { key: "done", label: "Concluídas", icon: CheckCircle2, accentDot: "bg-primary/50", accentText: "text-primary", headerBg: "bg-primary/5", emptyLabel: "Nenhuma conclusão recente" },
  { key: "failed", label: "Falhas", icon: AlertCircle, accentDot: "bg-status-critical", accentText: "text-status-critical", headerBg: "bg-status-critical/5", emptyLabel: "Nenhuma falha" },
];

/* ── Priority badge ── */

const priorityStyles: Record<TaskPriority, { label: string; cls: string }> = {
  critical: { label: "CRIT", cls: "bg-status-critical/15 text-status-critical border-status-critical/20" },
  high: { label: "HIGH", cls: "bg-status-warning/15 text-status-warning border-status-warning/20" },
  normal: { label: "NORM", cls: "bg-muted text-muted-foreground border-border/30" },
  low: { label: "LOW", cls: "bg-surface-2 text-muted-foreground/50 border-border/20" },
};

/* ── Task Card ── */

function TaskCard({ task }: { task: OperationTask }) {
  const pri = priorityStyles[task.priority];
  const isActive = task.status === "running";
  const isFailed = task.status === "failed";

  return (
    <div className={cn(
      "group rounded-lg border px-4 py-3.5 transition-all cursor-pointer",
      "hover:border-primary/30 hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.15)]",
      isFailed && "border-status-critical/25 bg-status-critical/[0.03]",
      isActive && "border-status-online/20 bg-status-online/[0.02]",
      !isActive && !isFailed && "border-border/30 bg-card/50",
    )}>
      {/* Header: title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-medium text-foreground leading-snug line-clamp-2">{task.title}</h4>
        <span className={cn("text-[7px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5", pri.cls)}>
          {pri.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-foreground/40 leading-relaxed mb-3 line-clamp-1">{task.description}</p>

      {/* Progress bar (for running/paused/failed) */}
      {task.status !== "queued" && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isFailed ? "bg-status-critical/60" :
                task.status === "paused" ? "bg-status-warning/50" :
                task.status === "done" ? "bg-primary/40" :
                "bg-status-online",
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/40 w-8 text-right">{task.progress}%</span>
        </div>
      )}

      {/* Footer: agent + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3 w-3 text-muted-foreground/25" />
          <span className="text-[9px] font-mono text-muted-foreground/40">{task.agent}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/20" />
          <span className="text-[9px] font-mono text-muted-foreground/30">{task.elapsed}</span>
        </div>
      </div>

      {/* Active pulse indicator */}
      {isActive && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
          <div className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
          <span className="text-[8px] font-mono text-status-online/60 uppercase tracking-wider">Processando</span>
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-status-critical/15">
          <RotateCcw className="h-3 w-3 text-status-critical/50" />
          <span className="text-[8px] font-mono text-status-critical/60 uppercase tracking-wider">Retry disponível</span>
        </div>
      )}
    </div>
  );
}

/* ── Kanban Column ── */

function KanbanColumn({ column, tasks }: { column: ColumnDef; tasks: OperationTask[] }) {
  const Icon = column.icon;
  return (
    <div className="flex flex-col min-w-0">
      {/* Column Header */}
      <div className={cn("rounded-t-lg px-4 py-2.5 border border-b-0 border-border/30", column.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", column.accentDot)} />
            <Icon className={cn("h-3.5 w-3.5", column.accentText)} />
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-foreground/80">{column.label}</span>
          </div>
          <span className={cn("text-[11px] font-mono font-semibold", column.accentText)}>{tasks.length}</span>
        </div>
      </div>

      {/* Column Body — scrollable */}
      <div className="rounded-b-lg border border-border/30 bg-surface-0/50 max-h-[420px] overflow-y-auto orion-thin-scroll">
        <div className="p-2 space-y-2">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <span className="text-[10px] font-mono text-muted-foreground/30">{column.emptyLabel}</span>
            </div>
          ) : (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Summary Bar ── */

function KanbanSummaryBar({ tasks }: { tasks: OperationTask[] }) {
  const running = tasks.filter(t => t.status === "running").length;
  const queued = tasks.filter(t => t.status === "queued").length;
  const done = tasks.filter(t => t.status === "done").length;
  const failed = tasks.filter(t => t.status === "failed").length;
  const criticalActive = tasks.filter(t => t.status === "running" && t.priority === "critical").length;

  const stats = [
    { label: "Ativas", value: running, icon: Flame, color: "text-status-online" },
    { label: "Na Fila", value: queued, icon: Clock, color: "text-muted-foreground" },
    { label: "Concluídas", value: done, icon: CheckCircle2, color: "text-primary" },
    { label: "Falhas", value: failed, icon: AlertCircle, color: failed > 0 ? "text-status-critical" : "text-muted-foreground/40" },
    { label: "Críticas Ativas", value: criticalActive, icon: Zap, color: criticalActive > 0 ? "text-status-critical" : "text-muted-foreground/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-px rounded-lg border border-border/30 bg-border/30 overflow-hidden">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card px-4 py-3 flex items-center gap-3">
            <Icon className={cn("h-4 w-4 shrink-0", s.color)} />
            <div>
              <p className={cn("text-lg font-semibold font-mono leading-none", s.color)}>{s.value}</p>
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Export ── */

export function OperationsKanban() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<OperationTask[]>({
    key: "operations-kanban",
    mockData: MOCK_TASKS,
    simulateDelay: 600,
  });

  const tasks = data || [];

  return (
    <section className="space-y-4">
      <OrionSectionHeader
        label="Painel Operacional"
        badge={{ text: `${tasks.filter(t => t.status === "running").length} ativas`, variant: "success" }}
        live
      />

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <KanbanSummaryBar tasks={tasks} />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              column={col}
              tasks={tasks.filter(t => t.status === col.key)}
            />
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
