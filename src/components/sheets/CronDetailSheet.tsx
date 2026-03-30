import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Timer, CheckCircle2, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { CronJob } from "@/domains/cron/types";

interface Props {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

export function CronDetailSheet({ job, open, onOpenChange, onToggle }: Props) {
  if (!job) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Timer className="h-5 w-5" /> {job.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/80">Habilitado</span>
            <Switch
              checked={job.enabled}
              onCheckedChange={(checked) => onToggle?.(job.id, checked)}
            />
          </div>

          <Row label="Schedule" value={job.schedule} />
          <Row label="Descrição" value={job.scheduleHuman} />
          <Row label="Status" value={job.status} />
          <Row label="Última execução" value={`${job.lastRun} (${job.lastRunAgo})`} />
          <Row label="Duração" value={job.lastDuration} />
          <Row label="Resultado" value={job.lastResult} />
          <Row label="Próxima" value={`${job.nextRun} (${job.nextRunIn})`} />

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Histórico</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-status-online" />
                <span className="text-sm font-mono">{job.consecutiveSuccess}× OK</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-status-critical" />
                <span className="text-sm font-mono">{job.consecutiveFails}× falhas</span>
              </div>
            </div>
          </div>

          {job.error && (
            <div className="rounded-lg border border-status-critical/20 bg-status-critical/5 p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-status-critical/50 mb-2">Erro</h4>
              <p className="text-xs font-mono text-status-critical/70 whitespace-pre-wrap">{job.error}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className="text-sm font-mono text-foreground/80">{value}</span>
    </div>
  );
}
