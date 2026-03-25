import { OrionLayout } from "@/components/OrionLayout";
import { Activity, Target, Zap, Shield } from "lucide-react";

function MetricCard({ label, value, icon: Icon, status }: { label: string; value: string; icon: React.ElementType; status?: "online" | "warning" | "critical" }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-foreground tracking-tight">{value}</span>
        {status && <div className={`status-dot mb-1.5 status-${status}`} />}
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <OrionLayout title="Command">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status bar */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Overview</span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Active Missions" value="12" icon={Target} status="online" />
          <MetricCard label="Throughput" value="847/s" icon={Activity} status="online" />
          <MetricCard label="Automations" value="34" icon={Zap} />
          <MetricCard label="Threat Level" value="Low" icon={Shield} status="online" />
        </div>

        {/* Main content area placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card p-6 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Mission Feed</h2>
              <span className="text-[10px] font-mono text-primary animate-pulse-glow">● LIVE</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground/50 font-mono">Awaiting telemetry data...</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-6 min-h-[320px] flex flex-col">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">System Status</h2>
            <div className="space-y-3 flex-1">
              {[
                { name: "Core Engine", status: "online" as const },
                { name: "Data Pipeline", status: "online" as const },
                { name: "Auth Service", status: "online" as const },
                { name: "ML Processor", status: "warning" as const },
                { name: "Edge Network", status: "online" as const },
              ].map((system) => (
                <div key={system.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs text-foreground">{system.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground capitalize">{system.status}</span>
                    <div className={`status-dot status-${system.status}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OrionLayout>
  );
};

export default Index;
