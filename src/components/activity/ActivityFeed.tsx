import { useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Info,
  Bot, Server, GitBranch, Shield, Zap, Clock, ChevronRight, Inbox,
} from "lucide-react";
import type { ActivityEvent, EventPriority, EventCategory } from "@/domains/activity/types";
import { ActivityDetailSheet } from "@/components/sheets/ActivityDetailSheet";

const priorityConfig: Record<EventPriority, { icon: React.ElementType; dot: string; text: string; borderAccent: string; bg: string }> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", borderAccent: "border-l-status-critical", bg: "bg-status-critical/[0.03]" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", borderAccent: "border-l-status-warning", bg: "bg-status-warning/[0.03]" },
  success: { icon: CheckCircle2, dot: "status-online", text: "text-status-online", borderAccent: "border-l-status-online", bg: "" },
  info: { icon: Info, dot: "bg-primary/40", text: "text-primary/70", borderAccent: "border-l-primary/20", bg: "" },
  neutral: { icon: Clock, dot: "bg-muted-foreground/25", text: "text-muted-foreground/50", borderAccent: "border-l-muted-foreground/15", bg: "" },
};

const categoryLabel: Record<EventCategory, { icon: React.ElementType; label: string }> = {
  agent: { icon: Bot, label: "Agente" },
  system: { icon: Server, label: "Sistema" },
  pipeline: { icon: GitBranch, label: "Pipeline" },
  security: { icon: Shield, label: "Segurança" },
  session: { icon: Zap, label: "Sessão" },
  deploy: { icon: GitBranch, label: "Deploy" },
};

function groupByTimeBlock(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const blocks: { label: string; events: ActivityEvent[] }[] = [];
  let currentBlock: { label: string; events: ActivityEvent[] } | null = null;
  for (const event of events) {
    const hour = parseInt(event.time.split(":")[0]);
    let blockLabel: string;
    if (event.timeAgo.includes("Agora") || event.timeAgo.includes("min ago")) {
      const mins = parseInt(event.timeAgo) || 0;
      blockLabel = mins <= 10 || event.timeAgo === "Agora" ? "Agora" : "Últimos 30 min";
    } else {
      blockLabel = hour >= 9 ? "Mais cedo" : "Esta manhã";
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
  const ccfg = categoryLabel[event.category];
  const PIcon = pcfg.icon;
  const isDimmed = event.priority === "neutral";

  return (
    <div onClick={onClick} className={`flex gap-3 group cursor-pointer hover:bg-accent/20 transition-colors rounded-lg border border-border/30 border-l-[3px] ${pcfg.borderAccent} ${pcfg.bg} ${isDimmed ? "opacity-40 hover:opacity-60" : ""} px-4 py-3.5`}>
      {/* Time */}
      <div className="flex flex-col items-center shrink-0 w-10 pt-0.5">
        <span className="text-[11px] font-mono text-primary/60 leading-none font-medium">{event.time}</span>
        <span className="text-[9px] font-mono text-muted-foreground/20 mt-1 leading-none whitespace-nowrap">{event.timeAgo}</span>
      </div>
      {/* Icon */}
      <div className="shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-md border flex items-center justify-center ${pcfg.bg || "bg-surface-2"} border-border/20`}>
          <PIcon className={`h-3.5 w-3.5 ${pcfg.text}`} />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-foreground truncate">{event.title}</h3>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-border/20 bg-muted/10 text-muted-foreground/40 shrink-0">
            {ccfg.label}
          </span>
        </div>
        <p className="text-[11px] text-foreground/40 leading-relaxed line-clamp-1">{event.description}</p>
        <p className="text-[9px] font-mono text-muted-foreground/25 mt-1">via {event.source}</p>
      </div>
      <div className="shrink-0 flex items-center">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/8 group-hover:text-muted-foreground/30 transition-colors" />
      </div>
    </div>
  );
}

interface ActivityFeedProps { events: ActivityEvent[]; }

export function ActivityFeed({ events }: ActivityFeedProps) {
  const [selected, setSelected] = useState<ActivityEvent | null>(null);

  if (!events || events.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Trilha Operacional</h2>
          </div>
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon"><Inbox className="h-5 w-5 text-muted-foreground/30" /></div>
          <p className="orion-empty-title">Nenhum evento registrado</p>
          <p className="orion-empty-subtitle">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const blocks = groupByTimeBlock(events);

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary/40 rounded-full" />
          <h2 className="orion-panel-title">Trilha Operacional</h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/30">{events.length} eventos</span>
      </div>
      <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto orion-thin-scroll p-1">
        {blocks.map((block) => (
          <div key={block.label}>
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/30">{block.label}</span>
              <div className="flex-1 h-px bg-border/15" />
              <span className="text-[9px] font-mono text-muted-foreground/18">{block.events.length}</span>
            </div>
            <div className="space-y-1.5">
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
