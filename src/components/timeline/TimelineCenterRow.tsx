import {
  Activity, AlertTriangle, Bot, Clock, CheckCircle2, XCircle,
  Calendar, Server, Timer, Radio, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineItem, TimelineItemStatus, TimelineItemType } from "@/domains/timeline/types";

const statusConfig: Record<TimelineItemStatus, { icon: React.ElementType; color: string; bg: string; glow: string; label: string }> = {
  running:   { icon: Activity,      color: "text-status-online",    bg: "bg-status-online/10",    glow: "shadow-[0_0_12px_hsl(var(--status-online)/0.3)]", label: "Em Andamento" },
  completed: { icon: CheckCircle2,   color: "text-primary",          bg: "bg-primary/10",          glow: "",                                                 label: "Concluído" },
  failed:    { icon: XCircle,        color: "text-status-critical",  bg: "bg-status-critical/10",  glow: "shadow-[0_0_12px_hsl(var(--status-critical)/0.3)]", label: "Falha" },
  scheduled: { icon: Calendar,       color: "text-muted-foreground", bg: "bg-muted/20",            glow: "",                                                 label: "Agendado" },
  warning:   { icon: AlertTriangle,  color: "text-status-warning",   bg: "bg-status-warning/10",   glow: "shadow-[0_0_10px_hsl(var(--status-warning)/0.2)]", label: "Atenção" },
  critical:  { icon: AlertTriangle,  color: "text-status-critical",  bg: "bg-status-critical/15",  glow: "shadow-[0_0_14px_hsl(var(--status-critical)/0.4)]", label: "Crítico" },
  info:      { icon: Radio,          color: "text-primary/70",       bg: "bg-primary/5",           glow: "",                                                 label: "Info" },
};

const typeConfig: Record<TimelineItemType, { icon: React.ElementType; label: string; badgeColor: string }> = {
  session:   { icon: Activity,       label: "Sessão",    badgeColor: "bg-primary/10 text-primary border-primary/20" },
  cron:      { icon: Timer,          label: "Cron",      badgeColor: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  alert:     { icon: AlertTriangle,  label: "Alerta",    badgeColor: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  agent:     { icon: Bot,            label: "Agente",    badgeColor: "bg-status-online/10 text-status-online border-status-online/20" },
  system:    { icon: Server,         label: "Sistema",   badgeColor: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  operation: { icon: Clock,          label: "Operação",  badgeColor: "bg-primary/10 text-primary border-primary/20" },
};

interface Props {
  item: TimelineItem;
  index: number;
  onNavigate: (path: string) => void;
}

export function TimelineCenterRow({ item, index, onNavigate }: Props) {
  const scfg = statusConfig[item.status];
  const tcfg = typeConfig[item.type];
  const Icon = scfg.icon;
  const isLeft = index % 2 === 0;
  const isUrgent = item.status === "critical" || item.status === "failed";
  const isRunning = item.status === "running";

  return (
    <div className="relative flex items-start group">
      {/* Left side content */}
      <div className={cn("w-[calc(50%-20px)]", isLeft ? "pr-6" : "")}>
        {isLeft && (
          <Card
            item={item}
            scfg={scfg}
            tcfg={tcfg}
            isUrgent={isUrgent}
            isRunning={isRunning}
            align="right"
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Center node */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
        <div className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
          isUrgent ? "border-status-critical/50 bg-status-critical/10" :
          isRunning ? "border-status-online/50 bg-status-online/10" :
          "border-border/50 bg-card",
          scfg.glow,
        )}>
          <Icon className={cn("h-4 w-4", scfg.color, isRunning && "animate-pulse")} />
        </div>
      </div>

      {/* Right side content */}
      <div className={cn("w-[calc(50%-20px)] ml-auto", !isLeft ? "pl-6" : "")}>
        {!isLeft && (
          <Card
            item={item}
            scfg={scfg}
            tcfg={tcfg}
            isUrgent={isUrgent}
            isRunning={isRunning}
            align="left"
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

function Card({
  item, scfg, tcfg, isUrgent, isRunning, align, onNavigate,
}: {
  item: TimelineItem;
  scfg: typeof statusConfig[TimelineItemStatus];
  tcfg: typeof typeConfig[TimelineItemType];
  isUrgent: boolean;
  isRunning: boolean;
  align: "left" | "right";
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      onClick={() => item.linkTo && onNavigate(item.linkTo)}
      className={cn(
        "rounded-lg border px-4 py-3.5 cursor-pointer transition-all relative",
        "hover:border-primary/30 group-hover:bg-accent/5",
        isUrgent ? "border-status-critical/30 bg-status-critical/[0.03]" :
        isRunning ? "border-status-online/30 bg-status-online/[0.03]" :
        "border-border/30",
        scfg.bg,
      )}
    >
      {/* Connector arrow */}
      <div className={cn(
        "absolute top-4 w-3 h-px bg-border/30",
        align === "right" ? "-right-3" : "-left-3",
      )} />
      <div className={cn(
        "absolute top-[13px] w-2 h-2 border bg-background rotate-45",
        align === "right"
          ? "-right-[5px] border-r border-t border-border/30"
          : "-left-[5px] border-l border-b border-border/30",
      )} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-mono text-primary/70 font-semibold">{item.timeLabel}</span>
        <span className={cn(
          "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0",
          isUrgent ? "bg-status-critical/10 text-status-critical border-status-critical/20" :
          isRunning ? "bg-status-online/10 text-status-online border-status-online/20" :
          "bg-muted/30 text-muted-foreground/60 border-border/30"
        )}>
          {scfg.label}
        </span>
        <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0", tcfg.badgeColor)}>
          {tcfg.label}
        </span>
        <div className="flex-1" />
        <ChevronRight className="h-3 w-3 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug truncate">{item.title}</p>

      {/* Detail */}
      <p className="text-[11px] text-foreground/35 leading-relaxed mt-1 line-clamp-2">{item.detail}</p>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border/10">
        <span className="text-[9px] font-mono text-muted-foreground/25">{item.timeAgo}</span>
        <span className="text-[9px] font-mono text-muted-foreground/15">•</span>
        <span className="text-[9px] font-mono text-muted-foreground/25">{item.source}</span>
      </div>
    </div>
  );
}
