import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Inbox } from "lucide-react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchTimelinePage } from "@/domains/timeline/fetcher";
import { cn } from "@/lib/utils";
import { TimelineSummary } from "@/components/timeline/TimelineSummary";
import { TimelineCenterRow } from "@/components/timeline/TimelineCenterRow";
import { TimelineBlockLabel } from "@/components/timeline/TimelineBlockLabel";
import { TimelineSkeleton } from "@/components/timeline/TimelineSkeleton";
import type { TimelinePageData, TimelineItem, TimelineItemType } from "@/domains/timeline/types";

// ── Filters ──
type FilterKey = "all" | TimelineItemType;
const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "session", label: "Sessões" },
  { key: "cron", label: "Cron" },
  { key: "alert", label: "Alertas" },
  { key: "agent", label: "Agentes" },
  { key: "system", label: "Sistema" },
];

// ── Group by time block ──
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
    } else if (diff < 600_000) {
      label = "🔴 Agora";
    } else if (diff < 3_600_000) {
      label = "⏱ Última Hora";
    } else if (diff < 21_600_000) {
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

  const blockOrder = ["🔴 Agora", "⏱ Última Hora", "📋 Últimas 6 Horas", "🌙 Madrugada", "📁 Mais Antigos", "🔮 Próximos"];
  const sorted = [...order].sort((a, b) => {
    const ia = blockOrder.indexOf(a);
    const ib = blockOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return sorted.map(label => ({ label, items: blocks.get(label)! }));
}

// ── Page ──
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

  // Global index for alternating sides
  let globalIndex = 0;

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
          <TimelineSummary data={pageData} />

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

          {/* Center Timeline */}
          <div className="mt-6 max-h-[calc(100vh-360px)] overflow-y-auto orion-thin-scroll pr-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-lg bg-muted/10 border border-border flex items-center justify-center mb-4">
                  <Inbox className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/50">Nenhum evento neste filtro</p>
              </div>
            ) : (
              <div className="relative">
                {/* Central spine */}
                <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-border/30 to-border/10" />

                {blocks.map((block) => {
                  const rows = block.items.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <TimelineCenterRow
                        key={item.id}
                        item={item}
                        index={idx}
                        onNavigate={navigate}
                      />
                    );
                  });

                  return (
                    <div key={block.label}>
                      <TimelineBlockLabel label={block.label} count={block.items.length} />
                      <div className="space-y-4">
                        {rows}
                      </div>
                    </div>
                  );
                })}

                {/* End cap */}
                <div className="flex justify-center mt-6 mb-2">
                  <div className="w-3 h-3 rounded-full bg-border/30 border border-border/50" />
                </div>
              </div>
            )}
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default TimelinePage;
