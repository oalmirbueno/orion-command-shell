import { useNavigate } from "react-router-dom";
import { FileText, Clock, ChevronRight } from "lucide-react";
import type { BriefingItem } from "@/domains/activity/types";

interface ExecutiveBriefingProps {
  items: BriefingItem[];
}

export function ExecutiveBriefing({ items = [] }: ExecutiveBriefingProps) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden h-full">
        <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/timeline")}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Log Operacional</h2>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="px-5 py-6 text-center flex flex-col items-center">
          <Clock className="h-5 w-5 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground/50 font-mono">Sem registros recentes</p>
          <p className="text-[10px] font-mono text-muted-foreground/25 mt-1">Eventos aparecerão conforme o sistema operar</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/timeline")}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
          <h2 className="orion-panel-title">Log Operacional</h2>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-xs font-mono text-muted-foreground/40">{items.length} registros</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>
      <div className="divide-y divide-border/20">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex gap-5 px-5 py-4 hover:bg-accent/15 transition-colors cursor-pointer"
            onClick={() => navigate("/activity")}
          >
            <div className="flex flex-col items-center pt-0.5 shrink-0">
              <span className="text-xs font-mono text-primary/60 font-semibold">{item.time}</span>
              {i < items.length - 1 && <div className="w-px flex-1 bg-border/25 mt-2" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/80 leading-relaxed">{item.content}</p>
              <p className="text-xs font-mono text-muted-foreground/40 mt-1.5">{item.source}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
