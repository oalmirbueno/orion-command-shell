import { Cpu, HardDrive, MemoryStick, Shield, Clock, Wifi, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemTelemetry {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  uptime: string;
  latency: number;
  activeConnections: number;
}

function useMockTelemetry() {
  const [stats, setStats] = useState<SystemTelemetry>({
    cpu: 23,
    ram: { used: 2.8, total: 8 },
    disk: { used: 42, total: 100 },
    uptime: "14d 7h",
    latency: 12,
    activeConnections: 47,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(5, prev.cpu + (Math.random() - 0.5) * 8)),
        ram: { ...prev.ram, used: Math.min(prev.ram.total, Math.max(1, prev.ram.used + (Math.random() - 0.5) * 0.3)) },
        latency: Math.max(1, Math.round(prev.latency + (Math.random() - 0.5) * 4)),
        activeConnections: Math.max(10, Math.round(prev.activeConnections + (Math.random() - 0.5) * 6)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

function getBarColor(percent: number): string {
  if (percent < 60) return "bg-status-online";
  if (percent < 85) return "bg-status-warning";
  return "bg-status-critical";
}

function MiniBar({ percent }: { percent: number }) {
  return (
    <div className="w-14 h-1.5 bg-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(percent)}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Sep() {
  return <div className="w-px h-3.5 bg-border" />;
}

export function OrionStatusBar() {
  const stats = useMockTelemetry();
  const cpuPct = Math.round(stats.cpu);
  const ramPct = Math.round((stats.ram.used / stats.ram.total) * 100);
  const diskPct = Math.round((stats.disk.used / stats.disk.total) * 100);

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border surface-0 text-xs font-mono text-muted-foreground/60 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5" />
          <span>CPU</span>
          <span className="text-foreground/70">{cpuPct}%</span>
          <MiniBar percent={cpuPct} />
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <MemoryStick className="h-3.5 w-3.5" />
          <span>RAM</span>
          <span className="text-foreground/70">{stats.ram.used.toFixed(1)}/{stats.ram.total}GB</span>
          <MiniBar percent={ramPct} />
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <HardDrive className="h-3.5 w-3.5" />
          <span>DISCO</span>
          <span className="text-foreground/70">{diskPct}%</span>
          <MiniBar percent={diskPct} />
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          <span>LAT</span>
          <span className="text-foreground/70">{stats.latency}ms</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-status-online" />
          <span className="text-status-online">SEGURO</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5" />
          <span>{stats.activeConnections} conexões</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>ATIVO {stats.uptime}</span>
        </div>
      </div>
    </footer>
  );
}
