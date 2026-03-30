import {
  Clock, CheckCircle2, AlertCircle, Bot, Flame,
  Pause, RotateCcw, Zap,
} from "lucide-react";
import { OrionSectionHeader } from "@/components/orion/primitives";
import { cn } from "@/lib/utils";
import type { OperationTask, TaskStatus, TaskPriority } from "@/domains/operations/types";

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
  critical: { label: "CRÍT", cls: "bg-status-critical/15 text-status-critical border-status-critical/20" },
  high: { label: "ALTO", cls: "bg-status-warning/15 text-status-warning border-status-warning/20" },
  normal: { label: "NORM", cls: "bg-muted text-muted-foreground border-border/30" },
  low: { label: "BAIXO", cls: "bg-surface-2 text-muted-foreground/50 border-border/20" },
};

/* ── Task Card ── */

function TaskCard({ task }: { task: OperationTask }) {
  const pri = priorityStyles[task.priority];
  const isActive = task.status === "running";
  const isFailed = task.status === "failed";

  return (
    <div className={cn(
      "group rounded-lg border px-5 py-4 transition-all cursor-pointer",
      "hover:border-primary/30 hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.15)]",
      isFailed && "border-status-critical/25 bg-status-critical/[0.03]",
      isActive && "border-status-online/20 bg-status-online/[0.02]",
      !isActive && !isFailed && "border-border/40 bg-card/50",
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{task.title}</h4>
        <span className={cn("text-xs font-mono uppercase px-2 py-1 rounded border shrink-0 mt-0.5", pri.cls)}>
          {pri.label}
        </span>
      </div>

      <p className="text-xs text-foreground/45 leading-relaxed mb-3 line-clamp-1">{task.description}</p>

      {task.status !== "queued" && (
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
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
          <span className="text-xs font-mono text-muted-foreground/50 w-10 text-right">{task.progress}%</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/50">{task.agent}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/25" />
          <span className="text-xs font-mono text-muted-foreground/40">{task.elapsed}</span>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
          <div className="w-2 h-2 rounded-full bg-status-online animate-pulse" />
          <span className="text-xs font-mono text-status-online/60 uppercase tracking-wider">Em execução</span>
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-status-critical/15">
          <RotateCcw className="h-3.5 w-3.5 text-status-critical/50" />
          <span className="text-xs font-mono text-status-critical/60 uppercase tracking-wider">Reexecutar disponível</span>
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
      <div className={cn("rounded-t-lg px-5 py-3.5 border border-b-0 border-border/40", column.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-2 h-2 rounded-full", column.accentDot)} />
            <Icon className={cn("h-4 w-4", column.accentText)} />
            <span className="text-xs font-mono uppercase tracking-[0.12em] text-foreground/80 font-medium">{column.label}</span>
          </div>
          <span className={cn("text-sm font-mono font-bold", column.accentText)}>{tasks.length}</span>
        </div>
      </div>

      <div className="rounded-b-lg border border-border/40 bg-surface-0/50 max-h-[500px] overflow-y-auto orion-thin-scroll">
        <div className="p-2.5 space-y-2.5">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[140px]">
              <span className="text-xs font-mono text-muted-foreground/30">{column.emptyLabel}</span>
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
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-px rounded-lg border border-border/50 bg-border/30 overflow-hidden">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card px-5 py-4 flex items-center gap-4">
            <Icon className={cn("h-5 w-5 shrink-0", s.color)} />
            <div>
              <p className={cn("text-xl font-bold font-mono leading-none", s.color)}>{s.value}</p>
              <span className="text-xs font-mono text-muted-foreground/50 uppercase tracking-wider">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Export ── */

interface OperationsKanbanProps {
  tasks: OperationTask[];
}

export function OperationsKanban({ tasks = [] }: OperationsKanbanProps) {
  return (
    <section className="space-y-4">
      <OrionSectionHeader
        label="Painel Operacional"
        badge={tasks.length > 0 ? { text: `${tasks.filter(t => t.status === "running").length} ativas`, variant: "success" } : undefined}
      />

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
    </section>
  );
}
