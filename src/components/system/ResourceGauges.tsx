import { Cpu, MemoryStick, HardDrive, Clock } from "lucide-react";

interface GaugeData {
  label: string;
  value: number;
  max: number;
  unit: string;
  detail: string;
  icon: React.ElementType;
}

const MOCK_GAUGES: GaugeData[] = [
  { label: "CPU", value: 34, max: 100, unit: "%", detail: "8 cores · 3.2GHz", icon: Cpu },
  { label: "RAM", value: 12.4, max: 32, unit: "GB", detail: "32 GB total · 19.6 GB livre", icon: MemoryStick },
  { label: "Disco", value: 187, max: 500, unit: "GB", detail: "500 GB NVMe · 313 GB livre", icon: HardDrive },
  { label: "Uptime", value: 99.97, max: 100, unit: "%", detail: "47d 12h 38m · 30d contínuos", icon: Clock },
];

function getStatusColor(value: number, max: number): string {
  const pct = (value / max) * 100;
  if (pct > 90) return "bg-status-critical";
  if (pct > 75) return "bg-status-warning";
  return "bg-primary";
}

function getStatusRing(value: number, max: number): string {
  const pct = (value / max) * 100;
  if (pct > 90) return "border-status-critical/30";
  if (pct > 75) return "border-status-warning/30";
  return "border-primary/30";
}

function CircularGauge({ data }: { data: GaugeData }) {
  const pct = (data.value / data.max) * 100;
  // For uptime, invert the visual logic (99.97% is good)
  const isUptime = data.label === "Uptime";
  const barColor = isUptime ? "bg-primary" : getStatusColor(data.value, data.max);
  const ringColor = isUptime ? "border-primary/30" : getStatusRing(data.value, data.max);
  const Icon = data.icon;

  return (
    <div className={`rounded-lg border border-border/50 bg-card p-5 flex flex-col items-center gap-4`}>
      {/* Gauge circle */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="hsl(var(--surface-3))"
            strokeWidth="6"
          />
          {/* Value ring */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
            className={`transition-all duration-700 ${isUptime ? "" : pct > 90 ? "[stroke:hsl(var(--status-critical))]" : pct > 75 ? "[stroke:hsl(var(--status-warning))]" : ""}`}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-foreground leading-none">
            {data.label === "Uptime" ? data.value : Math.round(pct)}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{data.unit}</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[11px] font-medium text-foreground">{data.label}</span>
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/40">{data.detail}</p>
      </div>
    </div>
  );
}

export function ResourceGauges() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Uso de Recursos
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● AO VIVO</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_GAUGES.map((g) => (
          <CircularGauge key={g.label} data={g} />
        ))}
      </div>
    </section>
  );
}
