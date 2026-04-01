import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, Bot, Clock, CheckCircle2, XCircle,
  Calendar, Server, Timer, Radio, ChevronRight, Inbox,
  Filter,
} from "lucide-react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchTimelinePage } from "@/domains/timeline/fetcher";
import { cn } from "@/lib/utils";
import type { TimelinePageData, TimelineItem, TimelineItemStatus, TimelineItemType } from "@/domains/timeline/types";

// ═══════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════

const statusConfig: Record<TimelineItemStatus, { icon: React.ElementType; color: string; border: string; bg: string; label: string }> = {
  running:   { icon: Activity,      color: "text-status-online",   border: "border-l-status-online",     bg: "bg-status-online/[0.04]",   label: "Em Andamento" },
  completed: { icon: CheckCircle2,   color: "text-primary",         border: "border-l-primary/40",        bg: "",                          label: "Concluído" },
  failed:    { icon: XCircle,        color: "text-status-critical",  border: "border-l-status-critical",   bg: "bg-status-critical/[0.04]", label: "Falha" },
  scheduled: { icon: Calendar,       color: "text-muted-foreground", border: "border-l-muted-foreground/30", bg: "",                       label: "Agendado" },
  warning:   { icon: AlertTriangle,  color: "text-status-warning",  border: "border-l-status-warning",    bg: "bg-status-warning/[0.04]",  label: "Atenção" },
  critical:  { icon: AlertTriangle,  color: "text-status-critical",  border: "border-l-status-critical",   bg: "bg-status-critical/[0.06]", label: "Crítico" },
  info:      { icon: Radio,          color: "text-primary/70",      border: "border-l-primary/20",        bg: "",                          label: "Info" },
};

const typeConfig: Record<TimelineItemType, { icon: React.ElementType; label: string; badgeColor: string }> = {
  session:   { icon: Activity, label: "Sessão",    badgeColor: "bg-primary/10 text-primary border-primary/20" },
  cron:      { icon: Timer,    label: "Cron",      badgeColor: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  alert:     { icon: AlertTriangle, label: "Alerta", badgeColor: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  agent:     { icon: Bot,      label: "Agente",    badgeColor: "bg-status-online/10 text-status-online border-status-online/20" },
  system:    { icon: Server,   label: "Sistema",   badgeColor: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  operation: { icon: Clock,    label: "Operação",  badgeColor: "bg-primary/10 text-primary border-primary/20" },
};

type FilterKey = "all" | TimelineItemType;
const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "session", label: "Sessões" },
  { key: "cron", label: "Cron" },
  { key: "alert", label: "Alertas" },
  { key: "agent", label: "Agentes" },
  { key: "system", label: "Sistema" },
];

// ═══════════════════════════════════════════════════════
// Summary Cards
// ═══════════════════════════════════════════════════════

function SummaryCards({ data }: { data: TimelinePageData }) {
  const { summary } = data;
  const cards = [
    { label: "Total", value: summary.total, icon: Radio, accent: "text-foreground" },
    { label: "Em Andamento", value: summary.running, icon: Activity, accent: "text-status-online" },
    { label: "Concluídos", value: summary.completed, icon: CheckCircle2, accent: "text-primary" },
    { label: "Falhas", value: summary.failed, icon: XCircle, accent: "text-status-critical" },
    { label: "Agendados", value: summary.scheduled, icon: Calendar, accent: "text-muted-foreground" },
    { label: "Atenção", value: summary.critical, icon: AlertTriangle, accent: "text-status-warning" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border/40 bg-card px-4 py-3 flex items-center gap-3">
          <c.icon className={cn("h-4 w-4 shrink-0", c.accent)} />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{c.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mt-0.5">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Timeline Row
// ═══════════════════════════════════════════════════════

function TimelineRow({ item, onNavigate }: { item: TimelineItem; onNavigate: (path: string) => void }) {
  const scfg = statusConfig[item.status];
  const tcfg = typeConfig[item.type];
  const Icon = scfg.icon;
  const isUrgent = item.status === "critical" || item.status === "failed";
  const isRunning = item.status === "running";

  return (
    <div
      onClick={() => item.linkTo && onNavigate(item.linkTo)}
      className={cn(
        "flex gap-0 group cursor-pointer",
      )}
    >
      {/* Timeline node */}
      <div className="flex flex-col items-center w-10 shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
          isUrgent ? "border-status-critical/40 bg-status-critical/10" :
          isRunning ? "border-status-online/40 bg-status-online/10" :
          "border-border/40 bg-card",
        )}>
          <Icon className={cn("h-4 w-4", scfg.color, isRunning && "animate-pulse")} />
        </div>
        <div className="w-px flex-1 bg-border/20 my-1" />
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 rounded-lg border border-l-[3px] px-4 py-3.5 mb-2 transition-colors",
        "hover:border-primary/20 group-hover:bg-accent/10",
        scfg.border, scfg.bg,
        "border-border/30",
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xs font-mono text-primary/60 shrink-0 w-11 font-medium">{item.timeLabel}</span>
            <span className={cn(
              "text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0",
              isUrgent ? "bg-status-critical/10 text-status-critical border-status-critical/20" :
              isRunning ? "bg-status-online/10 text-status-online border-status-online/20" :
              "bg-surface-2 text-muted-foreground/60 border-border/30"
            )}>
              {scfg.label}
            </span>
            <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0", tcfg.badgeColor)}>
              {tcfg.label}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground/30">{item.timeAgo}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>
        <p className="text-xs text-foreground/40 leading-relaxed mt-1 ml-11 line-clamp-1">{item.detail}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Grouping by time block
// ═══════════════════════════════════════════════════════

function groupByBlock(items: TimelineItem[]): { label: string; items: TimelineItem[] }[] {
  const now = Date.now();
  const blocks: Map<string, TimelineItem[]> = new Map();
  const order: string[] = [];

  for (const item of items) {
    const ts = new Date(item.timestamp).getTime();
    const diff = now - ts;
    const diffFuture = ts - now;

    let label: string;
    if (diffFuture > 0) {
      label = "🔮 Próximos";
    } else if (diff < 600_000) { // 10min
      label = "🔴 Agora";
    } else if (diff < 3_600_000) { // 1h
      label = "⏱ Última Hora";
    } else if (diff < 21_600_000) { // 6h
      label = "📋 Últimas 6 Horas";
    } else {
      const hour = new Date(item.timestamp).getHours();
      label = hour < 6 ? "🌙 Madrugada" : "📁 Mais Antigos";
    }

    if (!blocks.has(label)) {
      blocks.set(label, []);
      order.push(label);
    }
    blocks.get(label)!.push(item);
  }

  // Custom block order
  const blockOrder = ["🔴 Agora", "⏱ Última Hora", "📋 Últimas 6 Horas", "🌙 Madrugada", "📁 Mais Antigos", "🔮 Próximos"];
  const sorted = [...order].sort((a, b) => {
    const ia = blockOrder.indexOf(a);
    const ib = blockOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return sorted.map(label => ({ label, items: blocks.get(label)! }));
}

// ═══════════════════════════════════════════════════════
// Skeleton
// ═══════════════════════════════════════════════════════

function TimelineSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/40 bg-card px-4 py-3 h-14" />
        ))}
      </div>
      <div className="space-y-3 mt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/30" />
            <div className="flex-1 h-16 rounded-lg bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════

const TimelinePage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");

  const { state, data, source, lastUpdated, refetch } = useOrionData<TimelinePageData>({
    key: "timeline-page",
    fetcher: fetchTimelinePage,
    refreshInterval: 20_000,
  });

  const pageData = data || { items: [], summary: { total: 0, running: 0, completed: 0, failed: 0, scheduled: 0, critical: 0 } };

  const filtered = useMemo(() => {
    if (filter === "all") return pageData.items;
    return pageData.items.filter(i => i.type === filter);
  }, [pageData.items, filter]);

  const blocks = useMemo(() => groupByBlock(filtered), [filtered]);

  return (
    <OrionLayout title="Timeline">
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Timeline Operacional"]} />

        <OrionDataWrapper
          state={state}
          source={source}
          lastUpdated={lastUpdated}
          onRetry={refetch}
          emptyTitle="Nenhum evento na timeline"
          emptyDescription="Eventos aparecerão aqui quando houver atividade nos domínios"
          skeleton={<TimelineSkeleton />}
        >
          {/* Summary */}
          <SummaryCards data={pageData} />

          {/* Filters */}
          <div className="flex items-center gap-2 mt-5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/40" />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-md border transition-colors",
                  filter === f.key
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-muted-foreground/50 border-border/30 hover:border-border/60 hover:text-muted-foreground/70"
                )}
              >
                {f.label}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-[10px] font-mono text-muted-foreground/30">
              {filtered.length} evento{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Timeline */}
          <div className="mt-5 max-h-[calc(100vh-340px)] overflow-y-auto orion-thin-scroll pr-1 space-y-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <Inbox className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/50">Nenhum evento neste filtro</p>
              </div>
            ) : (
              blocks.map((block) => (
                <div key={block.label}>
                  <div className="flex items-center gap-2.5 mb-3 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-1">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 font-medium">
                      {block.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/25">({block.items.length})</span>
                    <div className="flex-1 h-px bg-border/20" />
                  </div>
                  <div>
                    {block.items.map((item) => (
                      <TimelineRow key={item.id} item={item} onNavigate={navigate} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default TimelinePage;
