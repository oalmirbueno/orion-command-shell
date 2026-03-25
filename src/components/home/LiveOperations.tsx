import { Flame, Clock, Pause, ArrowRight, Bot } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

interface Operation {
  id: string;
  name: string;
  agent: string;
  status: "running" | "paused";
  progress: number;
  elapsed: string;
  priority: "high" | "normal";
}

const OPS: Operation[] = [
  { id: "1", name: "Classificação Batch #4821", agent: "Classifier-01", status: "running", progress: 67, elapsed: "14min", priority: "high" },
  { id: "2", name: "Sync CRM → Data Lake", agent: "Sync-01", status: "running", progress: 88, elapsed: "8min", priority: "normal" },
  { id: "3", name: "Sumarização Emails Inbound", agent: "Summarizer-01", status: "running", progress: 34, elapsed: "20min", priority: "high" },
  { id: "4", name: "Enriquecimento Leads Q1", agent: "Enricher-01", status: "running", progress: 41, elapsed: "32min", priority: "normal" },
  { id: "5", name: "Health Check #8472", agent: "Monitor-01", status: "running", progress: 92, elapsed: "2min", priority: "normal" },
  { id: "6", name: "Reprocessamento Eventos", agent: "Analyzer-01", status: "paused", progress: 22, elapsed: "1h02", priority: "normal" },
];

export function LiveOperations() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<Operation[]>({
    key: "live-operations",
    mockData: OPS,
    simulateDelay: 500,
  });

  const runningCount = (data || []).filter(o => o.status === "running").length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Operações em Andamento</h2>
        {data && (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-online/10 border border-status-online/20">
            <Flame className="h-3 w-3 text-status-online" />
            <span className="text-[9px] font-mono text-status-online font-medium">{runningCount} ativas</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="space-y-1.5">
          {(data || []).map(op => {
            const isPaused = op.status === "paused";
            const isHigh = op.priority === "high";
            return (
              <div key={op.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer group transition-colors ${isPaused ? "border-border/30 opacity-55 hover:opacity-75" : isHigh ? "border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06]" : "border-border/30 hover:bg-accent/20"}`}>
                <div className="shrink-0">
                  {isPaused ? <Pause className="h-3.5 w-3.5 text-status-warning" /> : <Flame className="h-3.5 w-3.5 text-status-online" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{op.name}</span>
                    {isHigh && !isPaused && (
                      <span className="text-[7px] font-mono uppercase px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/15">PRI</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Bot className="h-3 w-3 text-muted-foreground/25" />
                    <span className="text-[9px] font-mono text-muted-foreground/40">{op.agent}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-28">
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isPaused ? "bg-status-warning/50" : "bg-primary"}`} style={{ width: `${op.progress}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground/40 w-8 text-right">{op.progress}%</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-muted-foreground/20" />
                  <span className="text-[9px] font-mono text-muted-foreground/40">{op.elapsed}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
