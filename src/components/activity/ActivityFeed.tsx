import {
  AlertCircle, AlertTriangle, CheckCircle2, Info, Zap,
  Bot, Server, GitBranch, Shield, Clock, ChevronRight,
} from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchActivityEvents } from "@/domains/activity/fetcher";
import type { ActivityEvent, EventPriority, EventCategory } from "@/domains/activity/types";

const priorityConfig: Record<EventPriority, { icon: React.ElementType; dot: string; text: string; borderAccent: string; bg: string }> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", borderAccent: "border-l-status-critical", bg: "bg-status-critical/5" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", borderAccent: "border-l-status-warning", bg: "bg-status-warning/5" },
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

function EventRow({ event }: { event: ActivityEvent }) {
  const pcfg = priorityConfig[event.priority];
  const ccfg = categoryConfig[event.category];
  const PIcon = pcfg.icon;
  const isHot = event.priority === "critical" || event.priority === "warning";
  const isDimmed = event.priority === "neutral";

  return (
    <div className={`flex gap-5 group cursor-pointer hover:bg-accent/20 transition-colors rounded-lg border border-border/40 border-l-[3px] ${pcfg.borderAccent} ${pcfg.bg} ${isDimmed ? "opacity-60 hover:opacity-80" : ""} px-6 py-5`}>
      <div className="flex flex-col items-center shrink-0 w-14 pt-0.5">
        <span className="text-xs font-mono text-primary/70 leading-none font-medium">{event.time}</span>
        <span className="text-[10px] font-mono text-muted-foreground/30 mt-1 leading-none whitespace-nowrap">{event.timeAgo}</span>
      </div>
      <div className="shrink-0 pt-0.5">
        <PIcon className={`h-5 w-5 ${pcfg.text} ${isHot ? "animate-pulse-glow" : ""}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <h3 className="text-sm font-semibold text-foreground truncate">{event.title}</h3>
          <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded border shrink-0 ${ccfg.color}`}>{ccfg.label}</span>
        </div>
        <p className="text-sm text-foreground/50 leading-relaxed line-clamp-2">{event.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-mono text-muted-foreground/50">via {event.source}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        <ChevronRight className="h-5 w-5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<ActivityEvent[]>({
    key: "activity-events",
    fetcher: fetchActivityEvents,
  });

  const events = data || [];
  const blocks = groupByTimeBlock(events);

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Feed de Eventos</h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-online/10 border border-status-online/20">
          <span className="text-[11px] font-mono text-status-online font-semibold">{events.length} eventos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-primary animate-pulse-glow font-medium">● AO VIVO</span>
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="space-y-8">
          {blocks.map((block) => (
            <div key={block.label}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50">{block.label}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              <div className="space-y-2.5">
                {block.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
