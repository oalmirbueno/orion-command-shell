import { FileText } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchBriefing } from "@/domains/activity/fetcher";
import type { BriefingItem } from "@/domains/activity/types";

export function ExecutiveBriefing() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<BriefingItem[]>({
    key: "executive-briefing",
    fetcher: fetchBriefing,
  });

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
          <h2 className="orion-panel-title">Leitura Executiva</h2>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-xs font-mono text-muted-foreground/40">Hoje</span>
        </div>
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact hideSource>
        <div className="divide-y divide-border/20">
          {(data || []).map((item, i) => (
            <div key={i} className="flex gap-5 px-5 py-4 hover:bg-accent/15 transition-colors">
              <div className="flex flex-col items-center pt-0.5 shrink-0">
                <span className="text-xs font-mono text-primary/60 font-semibold">{item.time}</span>
                {i < (data || []).length - 1 && <div className="w-px flex-1 bg-border/25 mt-2" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/80 leading-relaxed">{item.content}</p>
                <p className="text-xs font-mono text-muted-foreground/40 mt-1.5">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
