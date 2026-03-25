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
  critical: { icon: AlertCircle, border: "border-l-status-critical", bg: "bg-status-critical/5", dot: "status-critical", label: "CRÍTICO" },
  warning: { icon: AlertTriangle, border: "border-l-status-warning", bg: "bg-status-warning/5", dot: "status-warning", label: "ATENÇÃO" },
  info: { icon: Info, border: "border-l-primary", bg: "bg-primary/5", dot: "bg-primary/60", label: "INFO" },
};

export function AttentionRequired() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<AttentionItem[]>({
    key: "attention-items",
    mockData: MOCK_ITEMS,
    simulateDelay: 700,
  });

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Atenção Necessária</h2>
        {data && (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-warning/10 border border-status-warning/20">
            <span className="text-[9px] font-mono text-status-warning font-medium">{data.length}</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="space-y-1.5">
          {(data || []).map((item) => {
            const config = priorityConfig[item.priority];
            const Icon = config.icon;
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 rounded-md border border-border/40 ${config.bg} border-l-2 ${config.border} cursor-pointer hover:bg-accent/50 transition-colors group`}>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{item.context}</p>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">{item.timestamp}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
