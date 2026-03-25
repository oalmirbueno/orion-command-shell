import { FileText } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

interface BriefingItem {
  time: string;
  content: string;
  source: string;
}

const MOCK_BRIEFING: BriefingItem[] = [
  { time: "09:42", content: "Pipeline de ingestão retomado após rollback automático do v2.14.2. Performance restaurada em 4min.", source: "Core Engine" },
  { time: "09:15", content: "Agente Validator-01 reportou falha de conectividade com API externa. Retry policy ativado.", source: "Validator-01" },
  { time: "08:58", content: "Classificação de leads Q1 iniciada. ETA: 45min com 12.4k registros enfileirados.", source: "Mission Control" },
  { time: "08:30", content: "Deploy v2.14.3 em staging validado. Aguardando aprovação para produção.", source: "Release Pipeline" },
  { time: "08:00", content: "Rotina de saúde matinal concluída. Todos os serviços nominais exceto Data Pipeline (P95 elevado).", source: "Health Monitor" },
];

export function ExecutiveBriefing() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<BriefingItem[]>({
    key: "executive-briefing",
    mockData: MOCK_BRIEFING,
    simulateDelay: 800,
  });

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Leitura Executiva</h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-accent border border-border/50">
          <FileText className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[9px] font-mono text-muted-foreground">Hoje</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="divide-y divide-border/30">
            {(data || []).map((item, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 hover:bg-accent/20 transition-colors">
                <div className="flex flex-col items-center pt-0.5">
                  <span className="text-[10px] font-mono text-primary/70">{item.time}</span>
                  {i < (data || []).length - 1 && <div className="w-px flex-1 bg-border/30 mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/90 leading-relaxed">{item.content}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </OrionDataWrapper>
    </section>
  );
}
