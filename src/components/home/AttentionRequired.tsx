import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

type Priority = "critical" | "warning" | "info";

interface AttentionItem {
  id: string;
  priority: Priority;
  title: string;
  context: string;
  timestamp: string;
}

const MOCK_ITEMS: AttentionItem[] = [
  { id: "1", priority: "critical", title: "Pipeline de ingestão com latência elevada", context: "Data Pipeline · P95 > 200ms há 12min", timestamp: "12min" },
  { id: "2", priority: "warning", title: "Agente Classifier atingiu 85% de memória", context: "ML Processor · Cluster East", timestamp: "28min" },
  { id: "3", priority: "warning", title: "3 tarefas na fila há mais de 5 minutos", context: "Queue Manager · Threshold: 3min", timestamp: "6min" },
  { id: "4", priority: "info", title: "Deploy v2.14.3 aguardando aprovação", context: "Release Pipeline · Staging validated", timestamp: "1h" },
];

const priorityConfig = {
  critical: { icon: AlertCircle, border: "border-l-status-critical", bg: "bg-status-critical/[0.04]", dot: "status-critical" },
  warning: { icon: AlertTriangle, border: "border-l-status-warning", bg: "bg-status-warning/[0.04]", dot: "status-warning" },
  info: { icon: Info, border: "border-l-primary/40", bg: "bg-primary/[0.03]", dot: "bg-primary/50" },
};

export function AttentionRequired() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<AttentionItem[]>({
    key: "attention-items",
    mockData: MOCK_ITEMS,
    simulateDelay: 700,
  });

  return (
    <section className="rounded-md border border-border/50 overflow-hidden">
      {/* Section header — OS panel style with border-bottom */}
      <div className="flex items-center justify-between px-4 py-2.5 surface-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-0.5 bg-status-warning rounded-full" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-medium">Atenção Necessária</h2>
        </div>
        {data && (
          <span className="text-[10px] font-mono text-status-warning font-semibold">{data.length} itens</span>
        )}
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="divide-y divide-border/20">
          {(data || []).map((item) => {
            const config = priorityConfig[item.priority];
            const Icon = config.icon;
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${config.bg} border-l-2 ${config.border} cursor-pointer hover:bg-accent/30 transition-colors group`}>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{item.context}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0">{item.timestamp}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
