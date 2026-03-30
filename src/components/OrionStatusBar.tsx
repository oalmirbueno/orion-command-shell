import { Cpu, HardDrive, MemoryStick, Shield, Clock, Wifi, Activity } from "lucide-react";
import { useLastUpdated } from "@/hooks/useLastUpdated";
import { format } from "date-fns";

function Sep() {
  return <div className="w-px h-3.5 bg-border" />;
}

export function OrionStatusBar() {
  const { lastUpdated, source } = useLastUpdated();

  const timeStr = lastUpdated ? format(lastUpdated, "HH:mm:ss") : "—";

  const isLive = source === "api";
  const isOffline = !lastUpdated && !source;
  const sourceLabel = isLive ? "Live" : source === "cache" ? "Cache" : source === "fallback" ? "Fallback" : "Offline";
  const sourceColor = isLive ? "text-status-online" : isOffline ? "text-status-critical/60" : "text-muted-foreground/60";
  const dotColor = isLive ? "bg-status-online animate-pulse" : isOffline ? "bg-status-critical/50" : "bg-muted-foreground/40";

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border surface-0 text-xs font-mono text-muted-foreground/60 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5" />
          <span>CPU</span>
          <span className="text-foreground/70">—</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <MemoryStick className="h-3.5 w-3.5" />
          <span>RAM</span>
          <span className="text-foreground/70">—</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <HardDrive className="h-3.5 w-3.5" />
          <span>DISCO</span>
          <span className="text-foreground/70">—</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          <span>LAT</span>
          <span className="text-foreground/70">—</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 ${sourceColor}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              <span>{sourceLabel}</span>
            </div>
            <Sep />

        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-muted-foreground/40">—</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5" />
          <span>— conexões</span>
        </div>

        <Sep />

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>Atualizado {timeStr}</span>
        </div>
      </div>
    </footer>
  );
}
