import {
  Flame, CheckCircle2, AlertTriangle, Moon, CalendarClock,
  Bot, Clock, RotateCcw, ArrowRight, Zap, AlertCircle,
} from "lucide-react";
import { OrionSectionHeader } from "@/components/orion/primitives";
import { cn } from "@/lib/utils";
import type { OperationTask, TaskPriority } from "@/domains/operations/types";
import type { OperationSection } from "@/domains/operations/types.page";

/* ── Priority badge ── */

const priorityStyles: Record<TaskPriority, { label: string; cls: string }> = {
  critical: { label: "CRÍT", cls: "bg-status-critical/15 text-status-critical border-status-critical/20" },
  high: { label: "ALTO", cls: "bg-status-warning/15 text-status-warning border-status-warning/20" },
  normal: { label: "NORM", cls: "bg-muted text-muted-foreground border-border/30" },
  low: { label: "BAIXO", cls: "bg-surface-2 text-muted-foreground/50 border-border/20" },
};

/* ── Compact operation card ── */

function OpCard({ task, showTimer, onClick }: { task: OperationTask; showTimer?: boolean; onClick: () => void }) {
  const pri = priorityStyles[task.priority];
  const isActive = task.status === "running";
  const isFailed = task.status === "failed";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-lg border px-5 py-4 transition-all cursor-pointer",
        "hover:border-primary/30 hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.15)]",
        isFailed && "border-status-critical/25 bg-status-critical/[0.03]",
        isActive && "border-status-online/20 bg-status-online/[0.02]",
        !isActive && !isFailed && "border-border/40 bg-card/50",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{task.title}</h4>
        <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5", pri.cls)}>
          {pri.label}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-foreground/40 leading-relaxed mb-2.5 line-clamp-1">{task.description}</p>
      )}

      {task.status !== "queued" && task.progress > 0 && (
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isFailed ? "bg-status-critical/60" :
                task.status === "done" ? "bg-primary/40" :
                "bg-status-online",
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/40 w-8 text-right">{task.progress}%</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-3 w-3 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/50">{task.agent}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/25" />
          <span className="text-xs font-mono text-muted-foreground/40">{task.elapsed}</span>
        </div>
      </div>

      {showTimer && isActive && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/20">
          <div className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
          <span className="text-[10px] font-mono text-status-online/60 uppercase tracking-wider">Em execução</span>
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper ── */

function Section({
  icon: Icon,
  label,
  count,
  color,
  emptyText,
  tasks,
  onTaskClick,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  emptyText: string;
  tasks: OperationTask[];
  onTaskClick: (task: OperationTask) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4.5 w-4.5", color)} />
        <h3 className="text-sm font-mono uppercase tracking-[0.1em] text-foreground/80 font-medium">{label}</h3>
        <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full", color, "bg-current/10")}>
          <span className="text-current">{count}</span>
        </span>
      </div>

      {count === 0 ? (
        <div className="rounded-lg border border-border/30 bg-surface-0/30 flex items-center justify-center py-10">
          <span className="text-xs font-mono text-muted-foreground/30">{emptyText}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {tasks.map(t => (
            <OpCard key={t.id} task={t} showTimer={t.status === "running"} onClick={() => onTaskClick(t)} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Summary stats bar ── */

function SummaryBar({ sections }: { sections: OperationSection }) {
  const stats = [
    { label: "Em Andamento", value: sections.running.length, icon: Flame, color: "text-status-online" },
    { label: "Concluídas", value: sections.completed.length, icon: CheckCircle2, color: "text-primary" },
    { label: "Falhas", value: sections.failed.length, icon: AlertCircle, color: sections.failed.length > 0 ? "text-status-critical" : "text-muted-foreground/40" },
    { label: "Madrugada", value: sections.overnight.length, icon: Moon, color: "text-accent-foreground" },
    { label: "Próximas", value: sections.upcoming.length, icon: CalendarClock, color: "text-muted-foreground" },
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
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main export ── */

interface Props {
  sections: OperationSection;
  onTaskClick?: (task: OperationTask) => void;
}

export function OperationsSections({ sections, onTaskClick }: Props) {
  const handleClick = onTaskClick || (() => {});

  return (
    <div className="space-y-6">
      <SummaryBar sections={sections} />

      <Section
        icon={Flame}
        label="Em Andamento"
        count={sections.running.length}
        color="text-status-online"
        emptyText="Nenhuma operação ativa no momento"
        tasks={sections.running}
        onTaskClick={handleClick}
      />

      {sections.failed.length > 0 && (
        <Section
          icon={AlertTriangle}
          label="Falhas / Bloqueios"
          count={sections.failed.length}
          color="text-status-critical"
          emptyText="Nenhuma falha"
          tasks={sections.failed}
          onTaskClick={handleClick}
        />
      )}

      {sections.overnight.length > 0 && (
        <Section
          icon={Moon}
          label="Execuções da Madrugada"
          count={sections.overnight.length}
          color="text-foreground/60"
          emptyText="Nenhuma execução noturna"
          tasks={sections.overnight}
          onTaskClick={handleClick}
        />
      )}

      <Section
        icon={CheckCircle2}
        label="Concluído Recentemente"
        count={sections.completed.length}
        color="text-primary"
        emptyText="Nenhuma conclusão recente"
        tasks={sections.completed}
        onTaskClick={handleClick}
      />

      {sections.upcoming.length > 0 && (
        <Section
          icon={CalendarClock}
          label="Próximas Operações"
          count={sections.upcoming.length}
          color="text-muted-foreground"
          emptyText="Nenhuma operação agendada"
          tasks={sections.upcoming}
          onTaskClick={handleClick}
        />
      )}
    </div>
  );
}
