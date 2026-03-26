import {
  CheckCircle2, AlertCircle, Pause, Play, RotateCcw,
  Bot, Clock,
} from "lucide-react";
import { OrionSectionHeader } from "@/components/orion/primitives";
import { cn } from "@/lib/utils";
import type { TimelineEvent, ActionType } from "@/domains/operations/types";

/* ── Action config ── */

const actionConfig: Record<ActionType, { icon: React.ElementType; label: string; color: string; borderColor: string; bg: string }> = {
  started: { icon: Play, label: "Iniciada", color: "text-status-online", borderColor: "border-l-status-online", bg: "" },
  completed: { icon: CheckCircle2, label: "Concluída", color: "text-primary", borderColor: "border-l-primary/40", bg: "" },
  failed: { icon: AlertCircle, label: "Falha", color: "text-status-critical", borderColor: "border-l-status-critical", bg: "bg-status-critical/[0.03]" },
  paused: { icon: Pause, label: "Pausada", color: "text-status-warning", borderColor: "border-l-status-warning", bg: "" },
  resumed: { icon: Play, label: "Retomada", color: "text-status-online", borderColor: "border-l-status-online/40", bg: "" },
  retried: { icon: RotateCcw, label: "Reexecução", color: "text-status-warning", borderColor: "border-l-status-warning/40", bg: "bg-status-warning/[0.02]" },
  queued: { icon: Clock, label: "Na Fila", color: "text-muted-foreground", borderColor: "border-l-muted-foreground/30", bg: "" },
};

/* ── Timeline Row ── */

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const cfg = actionConfig[event.action];
  const Icon = cfg.icon;
  const isUrgent = event.action === "failed";

  return (
    <div className="flex gap-0">
      <div className="flex flex-col items-center w-12 shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center",
          isUrgent ? "border-status-critical/40 bg-status-critical/10" : "border-border/40 bg-card",
        )}>
          <Icon className={cn("h-4 w-4", cfg.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border/20 my-1" />}
      </div>

      <div className={cn(
        "flex-1 rounded-lg border border-l-[3px] px-5 py-4 mb-2 transition-colors cursor-pointer",
        "hover:border-primary/20",
        cfg.borderColor, cfg.bg,
        "border-border/30",
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-xs font-mono text-primary/60 shrink-0 w-12 font-medium">{event.time}</span>
            <span className={cn("text-xs font-mono uppercase px-2 py-1 rounded border shrink-0",
              isUrgent ? "bg-status-critical/10 text-status-critical border-status-critical/20" : "bg-surface-2 text-muted-foreground/60 border-border/30"
            )}>
              {cfg.label}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{event.taskTitle}</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Bot className="h-4 w-4 text-muted-foreground/25" />
            <span className="text-xs font-mono text-muted-foreground/40">{event.agent}</span>
          </div>
        </div>
        <p className="text-xs text-foreground/40 leading-relaxed mt-1.5 ml-12 line-clamp-1">{event.detail}</p>
      </div>
    </div>
  );
}

/* ── Main Export ── */

interface OperationsTimelineProps {
  events: TimelineEvent[];
}

export function OperationsTimeline({ events }: OperationsTimelineProps) {
  return (
    <section className="space-y-4">
      <OrionSectionHeader
        label="Linha do Tempo Operacional"
        badge={events.length > 0 ? { text: `${events.length} eventos`, variant: "info" } : undefined}
      />

      <div className="max-w-5xl max-h-[500px] overflow-y-auto orion-thin-scroll pr-2">
        {events.map((event, i) => (
          <TimelineRow key={event.id} event={event} isLast={i === events.length - 1} />
        ))}
      </div>
    </section>
  );
}
