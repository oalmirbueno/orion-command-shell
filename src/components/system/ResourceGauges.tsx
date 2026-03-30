import { Cpu, MemoryStick, HardDrive, Clock, Inbox } from "lucide-react";
import type { ResourceGauge } from "@/domains/system/types";

const iconMap: Record<string, React.ElementType> = { Cpu, MemoryStick, HardDrive, Clock };

function CircularGauge({ data }: { data: ResourceGauge }) {
  const pct = (data.value / data.max) * 100;
  const isUptime = data.label === "Uptime" || data.label === "Disponib.";
  const Icon = iconMap[data.iconName] || Cpu;
  const strokeColor = isUptime ? "" : pct > 90 ? "[stroke:hsl(var(--status-critical))]" : pct > 75 ? "[stroke:hsl(var(--status-warning))]" : "";

  return (
    <div className="rounded-lg border border-border/40 bg-card p-5 flex flex-col items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--surface-3))" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
            className={`transition-all duration-700 ${strokeColor}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground leading-none">
            {isUptime ? data.value : Math.round(pct)}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">{data.unit}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-sm font-medium text-foreground">{data.label}</span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/30">{data.detail}</p>
      </div>
    </div>
  );
}

interface Props {
  gauges: ResourceGauge[];
}

export function ResourceGauges({ gauges = [] }: Props) {
  if (gauges.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Uso de Recursos</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Sem dados de recursos</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Uso de Recursos</h2>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {gauges.map((g) => (
          <CircularGauge key={g.label} data={g} />
        ))}
      </div>
    </section>
  );
}
