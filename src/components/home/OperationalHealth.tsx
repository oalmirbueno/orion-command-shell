import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

interface HealthService {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: string;
  uptime: string;
}

const MOCK_SERVICES: HealthService[] = [
  { name: "API Gateway", status: "healthy", responseTime: "12ms", uptime: "99.99%" },
  { name: "Core Engine", status: "healthy", responseTime: "8ms", uptime: "99.98%" },
  { name: "Data Pipeline", status: "degraded", responseTime: "187ms", uptime: "99.91%" },
  { name: "Auth Service", status: "healthy", responseTime: "15ms", uptime: "100%" },
  { name: "ML Processor", status: "healthy", responseTime: "34ms", uptime: "99.95%" },
  { name: "Cache Layer", status: "healthy", responseTime: "2ms", uptime: "100%" },
  { name: "Queue Service", status: "healthy", responseTime: "5ms", uptime: "99.99%" },
  { name: "Storage", status: "healthy", responseTime: "22ms", uptime: "99.97%" },
];

const statusIcon = {
  healthy: <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />,
  degraded: <Clock className="h-3.5 w-3.5 text-status-warning" />,
  down: <XCircle className="h-3.5 w-3.5 text-status-critical" />,
};

export function OperationalHealth() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<HealthService[]>({
    key: "operational-health",
    mockData: MOCK_SERVICES,
    simulateDelay: 500,
  });

  const healthyCount = (data || []).filter(s => s.status === "healthy").length;
  const total = (data || []).length;
  const allHealthy = healthyCount === total;

  return (
    <section className="rounded-md border border-border/50 overflow-hidden h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 surface-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className={`w-5 h-0.5 rounded-full ${allHealthy ? "bg-status-online" : "bg-status-warning"}`} />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-medium">Saúde Operacional</h2>
        </div>
        {data && (
          <span className={`text-[10px] font-mono font-semibold ${allHealthy ? "text-status-online" : "text-status-warning"}`}>
            {healthyCount}/{total}
          </span>
        )}
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-1.5 surface-2/50 border-b border-border/20 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
        <span className="w-4" />
        <span className="flex-1">Serviço</span>
        <span className="w-16 text-right">Latência</span>
        <span className="w-16 text-right">Uptime</span>
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="divide-y divide-border/15">
          {(data || []).map((svc) => (
            <div key={svc.name} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-accent/15 transition-colors ${svc.status === "degraded" ? "bg-status-warning/[0.03]" : ""}`}>
              {statusIcon[svc.status]}
              <span className="text-[12px] text-foreground flex-1">{svc.name}</span>
              <span className={`text-[10px] font-mono w-16 text-right ${svc.status === "degraded" ? "text-status-warning" : "text-muted-foreground/50"}`}>{svc.responseTime}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 w-16 text-right">{svc.uptime}</span>
            </div>
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
