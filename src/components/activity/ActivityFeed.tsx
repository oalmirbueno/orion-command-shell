import { useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Info, Zap,
  Bot, Server, GitBranch, Shield, Clock, ChevronRight, Inbox,
} from "lucide-react";
import type { ActivityEvent, EventPriority, EventCategory } from "@/domains/activity/types";
import { ActivityDetailSheet } from "@/components/sheets/ActivityDetailSheet";

const priorityConfig: Record<EventPriority, { icon: React.ElementType; dot: string; text: string; borderAccent: string; bg: string }> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", borderAccent: "border-l-status-critical", bg: "bg-status-critical/[0.04]" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", borderAccent: "border-l-status-warning", bg: "bg-status-warning/[0.04]" },
  success: { icon: CheckCircle2, dot: "status-online", text: "text-status-online", borderAccent: "border-l-status-online", bg: "" },
  info: { icon: Info, dot: "bg-primary/50", text: "text-primary", borderAccent: "border-l-primary/30", bg: "" },
  neutral: { icon: Clock, dot: "bg-muted-foreground/30", text: "text-muted-foreground", borderAccent: "border-l-muted-foreground/20", bg: "" },
};

const categoryConfig: Record<EventCategory, { icon: React.ElementType; label: string; color: string }> = {
  agent: { icon: Bot, label: "Agente", color: "bg-primary/10 text-primary border-primary/20" },
  system: { icon: Server, label: "Sistema", color: "bg-status-online/10 text-status-online border-status-online/20" },
  pipeline: { icon: GitBranch, label: "Pipeline", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  security: { icon: Shield, label: "Segurança", color: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  session: { icon: Zap, label: "Sessão", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  deploy: { icon: GitBranch, label: "Deploy", color: "bg-primary/10 text-primary border-primary/20" },
};

function groupByTimeBlock(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const blocks: { label: string; events: ActivityEvent[] }[] = [];
  let currentBlock: { label: string; events: ActivityEvent[] } | null = null;
  for (const event of events) {
    const hour = parseInt(event.time.split(":")[0]);
    let blockLabel: string;
    if (event.timeAgo.includes("Agora") || event.timeAgo.includes("min ago")) {
      const mins = parseInt(event.timeAgo) || 0;
      blockLabel = mins <= 10 || event.timeAgo === "Agora" ? "Agora" : "Últimos 30 Minutos";
    } else {
      blockLabel = hour >= 9 ? "Mais Cedo" : "Esta Manhã";
    }
    if (!currentBlock || currentBlock.label !== blockLabel) {
      currentBlock = { label: blockLabel, events: [] };
      blocks.push(currentBlock);
    }
    currentBlock.events.push(event);
  }
  return blocks;
}

function EventRow({ event, onClick }: { event: ActivityEvent; onClick: () => void }) {
  const pcfg = priorityConfig[event.priority];
  const ccfg = categoryConfig[event.category];
  const PIcon = pcfg.icon;
  const isDimmed = event.priority === "neutral";

  return (
    <div onClick={onClick} className={`flex gap-4 group cursor-pointer hover:bg-accent/20 transition-colors rounded-lg border border-border/40 border-l-[3px] ${pcfg.borderAccent} ${pcfg.bg} ${isDimmed ? "opacity-50 hover:opacity-70" : ""} px-5 py-4`}>
      <div className="flex flex-col items-center shrink-0 w-12 pt-0.5">
        <span className="text-xs font-mono text-primary/70 leading-none font-medium">{event.time}</span>
        <span className="text-[10px] font-mono text-muted-foreground/25 mt-1 leading-none whitespace-nowrap">{event.timeAgo}</span>
      </div>
      <div className="shrink-0 pt-0.5">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${pcfg.bg || "bg-surface-2"} border-border/30`}>
          <PIcon className={`h-4 w-4 ${pcfg.text}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{event.title}</h3>
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${ccfg.color}`}>{ccfg.label}</span>
        </div>
        <p className="text-xs text-foreground/45 leading-relaxed line-clamp-2">{event.description}</p>
        <p className="text-[10px] font-mono text-muted-foreground/35 mt-1.5">via {event.source}</p>
      </div>
      <div className="shrink-0 flex items-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors" />
      </div>
    </div>
  );
}

interface ActivityFeedProps { events: ActivityEvent[]; }

export function ActivityFeed({ events }: ActivityFeedProps) {
  const [selected, setSelected] = useState<ActivityEvent | null>(null);

  if (events.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Feed de Eventos</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum evento registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const blocks = groupByTimeBlock(events);

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Feed de Eventos</h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-muted-foreground/5 border border-border/40">
          <span className="text-xs font-mono text-muted-foreground/60">{events.length} eventos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.label}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">{block.label}</span>
              <div className="flex-1 h-px bg-border/20" />
            </div>
            <div className="space-y-2">
              {block.events.map((event) => (
                <EventRow key={event.id} event={event} onClick={() => setSelected(event)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ActivityDetailSheet event={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
