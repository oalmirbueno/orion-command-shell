import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Timer, CheckCircle2, XCircle, AlertTriangle, Clock,
  Play, Calendar, Hash, BarChart3, Loader2,
} from "lucide-react";
import { apiUrl } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { CronJob, JobStatus } from "@/domains/cron/types";

const statusBadge: Record<JobStatus, { label: string; className: string }> = {
  healthy: { label: "Saudável", className: "bg-status-online/15 text-status-online border-status-online/30" },
  failed: { label: "Falha", className: "bg-status-critical/15 text-status-critical border-status-critical/30" },
  warning: { label: "Atenção", className: "bg-status-warning/15 text-status-warning border-status-warning/30" },
  disabled: { label: "Desativado", className: "bg-muted text-muted-foreground border-border/40" },
};

interface Props {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

export function CronDetailSheet({ job, open, onOpenChange, onToggle }: Props) {
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!job) return null;

  const badge = statusBadge[job.status];

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetch(apiUrl("/cron/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: `"${job.name}" executado com sucesso` });
    } catch {
      toast({ title: "Erro ao executar job", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      // Delegate to parent which handles optimistic update + API call
      onToggle?.(job.id, enabled);
    } finally {
      // Parent controls the actual async; just clear local spinner after a tick
      setTimeout(() => setToggling(false), 600);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/40 flex items-center justify-center shrink-0">
              <Timer className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-foreground text-base truncate">{job.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0 ${badge.className}`}>
                  {badge.label}
                </Badge>
                <code className="text-[10px] font-mono text-muted-foreground/40 truncate">{job.id.slice(0, 8)}</code>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-2 px-4 py-3">
            <span className="text-sm text-foreground/80">Habilitado</span>
            <Switch
              checked={job.enabled}
              disabled={toggling}
              onCheckedChange={handleToggle}
              className={`data-[state=checked]:bg-primary ${toggling ? "opacity-50" : ""}`}
            />
          </div>

          <Separator className="bg-border/30" />

          {/* Schedule */}
          <Section icon={Calendar} title="Schedule">
            <Row label="Expressão" value={job.schedule} mono />
            <Row label="Descrição" value={job.scheduleHuman} />
          </Section>

          <Separator className="bg-border/30" />

          {/* Last run */}
          <Section icon={Clock} title="Última execução">
            <Row label="Data" value={job.lastRun} />
            <Row label="Tempo atrás" value={job.lastRunAgo} />
            <Row label="Duração" value={job.lastDuration} />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/50 w-28 shrink-0">Resultado</span>
              {job.lastResult === "success" ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />
                  <span className="text-xs font-mono text-status-online">OK</span>
                </div>
              ) : job.lastResult === "failure" ? (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-status-critical" />
                  <span className="text-xs font-mono text-status-critical">FALHA</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-muted-foreground/30">—</span>
              )}
            </div>
          </Section>

          {/* Error block */}
          {job.error && (
            <div className="rounded-lg border border-status-critical/20 bg-status-critical/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-status-critical/60" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-status-critical/50">Erro</h4>
              </div>
              <p className="text-xs font-mono text-status-critical/70 whitespace-pre-wrap break-words leading-relaxed">{job.error}</p>
            </div>
          )}

          <Separator className="bg-border/30" />

          {/* Next run */}
          <Section icon={Calendar} title="Próxima execução">
            <Row label="Data" value={job.nextRun} />
            <Row label="Countdown" value={job.nextRunIn} />
          </Section>

          <Separator className="bg-border/30" />

          {/* Stats */}
          <Section icon={BarChart3} title="Estatísticas">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-lg font-bold text-status-online">{job.consecutiveSuccess}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">Sucessos</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-lg font-bold text-status-critical">{job.consecutiveFails}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">Falhas</p>
              </div>
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Run now button */}
          <Button
            onClick={handleRun}
            disabled={running || !job.enabled}
            className="w-full"
            variant="outline"
          >
            {running ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {running ? "Executando…" : "Executar agora"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{title}</h4>
      </div>
      <div className="space-y-2.5 ml-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-foreground/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
