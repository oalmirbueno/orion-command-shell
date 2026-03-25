import { Cpu, MemoryStick, HardDrive, Clock } from "lucide-react";
import type { ResourceGauge } from "@/domains/system/types";

const iconMap: Record<string, React.ElementType> = { Cpu, MemoryStick, HardDrive, Clock };

function CircularGauge({ data }: { data: ResourceGauge }) {
  const pct = (data.value / data.max) * 100;
  const isUptime = data.label === "Uptime";
  const Icon = iconMap[data.iconName] || Cpu;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col items-center gap-5">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--surface-3))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
            className={`transition-all duration-700 ${isUptime ? "" : pct > 90 ? "[stroke:hsl(var(--status-critical))]" : pct > 75 ? "[stroke:hsl(var(--status-warning))]" : ""}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground leading-none">
            {isUptime ? data.value : Math.round(pct)}
          </span>
          <span className="text-xs font-mono text-muted-foreground/50 mt-1">{data.unit}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Icon className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground">{data.label}</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground/40">{data.detail}</p>
      </div>
    </div>
  );
}

interface Props {
  gauges: ResourceGauge[];
}

export function ResourceGauges({ gauges }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Uso de Recursos</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-primary animate-pulse-glow">● AO VIVO</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {gauges.map((g) => (
          <CircularGauge key={g.label} data={g} />
        ))}
      </div>
    </section>
  );
}
