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
  healthy: <CheckCircle2 className="h-4 w-4 text-status-online" />,
  degraded: <Clock className="h-4 w-4 text-status-warning" />,
  down: <XCircle className="h-4 w-4 text-status-critical" />,
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
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Saúde Operacional</h2>
        {data && (
          <div className={`flex items-center gap-2 ml-2 px-3 py-1 rounded-full border ${allHealthy ? "bg-status-online/10 border-status-online/20" : "bg-status-warning/10 border-status-warning/20"}`}>
            <span className={`text-[11px] font-mono font-semibold ${allHealthy ? "text-status-online" : "text-status-warning"}`}>
              {healthyCount}/{total} saudáveis
            </span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {(data || []).map((svc, i) => (
            <div key={svc.name} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-border/30" : ""} hover:bg-accent/30 transition-colors`}>
              {statusIcon[svc.status]}
              <span className="text-sm text-foreground flex-1">{svc.name}</span>
              <span className="text-xs font-mono text-muted-foreground/60 w-20 text-right">{svc.responseTime}</span>
              <span className="text-xs font-mono text-muted-foreground/60 w-20 text-right">{svc.uptime}</span>
            </div>
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
