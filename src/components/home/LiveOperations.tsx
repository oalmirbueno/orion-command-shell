import { Flame, Clock, Pause, ArrowRight, Bot } from "lucide-react";
import type { Operation } from "@/domains/operations/types";

interface LiveOperationsProps {
  operations: Operation[];
}

export function LiveOperations({ operations = [] }: LiveOperationsProps) {
  const runningCount = operations.filter(o => o.status === "running").length;

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-status-online rounded-full" />
          <h2 className="orion-panel-title">Operações em Andamento</h2>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-status-online" />
          <span className="text-xs font-mono text-status-online font-semibold">{runningCount} ativas</span>
        </div>
      </div>

      <div className="divide-y divide-border/25">
        {operations.map(op => {
          const isPaused = op.status === "paused";
          const isHigh = op.priority === "high";
          return (
            <div key={op.id} className={`flex items-center gap-4 px-5 py-4 cursor-pointer group transition-colors ${isPaused ? "opacity-40 hover:opacity-60" : isHigh ? "bg-primary/[0.02] hover:bg-primary/[0.05]" : "hover:bg-accent/20"}`}>
              <div className="shrink-0">
                {isPaused ? <Pause className="h-4 w-4 text-status-warning" /> : <Flame className="h-4 w-4 text-status-online" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{op.name}</span>
                  {isHigh && !isPaused && (
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/15 font-bold">PRI</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-xs font-mono text-muted-foreground/50">{op.agent}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 w-32">
                <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isPaused ? "bg-status-warning/50" : "bg-primary"}`} style={{ width: `${op.progress}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground/50 w-9 text-right">{op.progress}%</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/30" />
                <span className="text-xs font-mono text-muted-foreground/50">{op.elapsed}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
