import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Clock, Flame, Pause, CheckCircle2, AlertCircle,
  ArrowRight, Timer, Tag, Layers, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { OperationTask, OperationStatus, OperationPriority } from "@/domains/operations/types";

/* ── Visual config ── */

const statusConfig: Record<OperationStatus, { label: string; color: string; icon: React.ElementType }> = {
  running: { label: "Em execução", color: "bg-status-online/15 text-status-online border-status-online/30", icon: Flame },
  queued: { label: "Na fila", color: "bg-muted text-muted-foreground border-border/40", icon: Clock },
  paused: { label: "Pausada", color: "bg-status-warning/15 text-status-warning border-status-warning/30", icon: Pause },
  done: { label: "Concluída", color: "bg-primary/15 text-primary border-primary/30", icon: CheckCircle2 },
  failed: { label: "Falha", color: "bg-status-critical/15 text-status-critical border-status-critical/30", icon: AlertCircle },
};

const priorityConfig: Record<OperationPriority, { label: string; color: string }> = {
  critical: { label: "Crítica", color: "bg-status-critical/15 text-status-critical border-status-critical/20" },
  high: { label: "Alta", color: "bg-status-warning/15 text-status-warning border-status-warning/20" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground border-border/30" },
  low: { label: "Baixa", color: "bg-surface-2 text-muted-foreground/50 border-border/20" },
};

function parseSource(id: string): { type: "session" | "cron" | "activity" | "agent" | "unknown"; rawId: string; route: string } {
  if (id.startsWith("session-")) return { type: "session", rawId: id.replace("session-", ""), route: "/sessions" };
  if (id.startsWith("cron-next-")) return { type: "cron", rawId: id.replace("cron-next-", ""), route: "/cron" };
  if (id.startsWith("cron-")) return { type: "cron", rawId: id.replace("cron-", ""), route: "/cron" };
  if (id.startsWith("activity-")) return { type: "activity", rawId: id.replace("activity-", "").replace("activity-ev-", ""), route: "/activity" };
  if (id.startsWith("agent-task-")) return { type: "agent", rawId: id.replace("agent-task-", ""), route: "/agents" };
  return { type: "unknown", rawId: id, route: "/" };
}

const sourceLabels: Record<string, { label: string; emoji: string }> = {
  session: { label: "Sessão", emoji: "💬" },
  cron: { label: "Cron Job", emoji: "⏰" },
  activity: { label: "Atividade", emoji: "📋" },
  agent: { label: "Agente", emoji: "🤖" },
  unknown: { label: "Operação", emoji: "⚙️" },
};

/* ── Detail row ── */

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <span className="text-xs font-mono text-muted-foreground/60 w-24 shrink-0">{label}</span>
      <span className="text-sm text-foreground/80 font-medium">{value}</span>
    </div>
  );
}

/* ── Main sheet ── */

interface Props {
  task: OperationTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperationDetailSheet({ task, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!task) return null;

  const stCfg = statusConfig[task.status];
  const prCfg = priorityConfig[task.priority];
  const source = parseSource(task.id);
  const srcLabel = sourceLabels[source.type];
  const StatusIcon = stCfg.icon;

  const handleNavigateSource = () => {
    onOpenChange(false);
    navigate(source.route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg border-l border-border/50 bg-background overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{srcLabel.emoji}</span>
            <Badge variant="outline" className={cn("text-[10px] font-mono uppercase", stCfg.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {stCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] font-mono uppercase", prCfg.color)}>
              {prCfg.label}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold leading-snug">{task.title}</SheetTitle>
        </SheetHeader>

        {task.description && (
          <p className="text-sm text-foreground/60 leading-relaxed mb-4">{task.description}</p>
        )}

        <Separator className="my-4" />

        {/* Details */}
        <div className="space-y-0.5">
          <DetailRow icon={Tag} label="Origem" value={`${srcLabel.label} (${source.type})`} />
          <DetailRow icon={Bot} label="Responsável" value={task.agent || "—"} />
          <DetailRow icon={Timer} label="Tempo" value={task.elapsed || "—"} />
          <DetailRow icon={Layers} label="Progresso" value={`${task.progress}%`} />
          <DetailRow icon={CalendarClock} label="Atualizado" value={task.updatedAt ? new Date(task.updatedAt).toLocaleString("pt-BR") : "—"} />
        </div>

        {/* Progress bar */}
        {task.progress > 0 && task.progress < 100 && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    task.status === "failed" ? "bg-status-critical/60" :
                    task.status === "running" ? "bg-status-online" :
                    "bg-primary/40",
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground/50">{task.progress}%</span>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Navigate to source */}
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={handleNavigateSource}
        >
          <span className="text-sm">Ver em {srcLabel.label}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </SheetContent>
    </Sheet>
  );
}
