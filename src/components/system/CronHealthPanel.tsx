import { CheckCircle2, XCircle, AlertTriangle, Timer, Clock, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CronJob, CronSummaryData } from "@/domains/cron/types";

interface CronHealthPanelProps {
  jobs: CronJob[];
  summary: CronSummaryData;
}

export function CronHealthPanel({ jobs, summary }: CronHealthPanelProps) {
  const hasIssues = summary.failed > 0;
  const failedJobs = jobs.filter(j => j.status === "failed");
  const healthyJobs = jobs.filter(j => j.status === "healthy");
  const disabledJobs = jobs.filter(j => !j.enabled);

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-0.5 rounded-full ${hasIssues ? "bg-status-critical" : "bg-status-online"}`} />
          <h2 className="orion-panel-title">Saúde dos Cron Jobs</h2>
        </div>
        <span className={cn("text-xs font-mono font-semibold", hasIssues ? "text-status-critical" : "text-status-online")}>
          {hasIssues ? `${summary.failed} falhando` : "Todos saudáveis"}
        </span>
      </div>

      <div className="p-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Ativos", value: summary.active, icon: Timer, color: "text-foreground" },
          { label: "Saudáveis", value: summary.healthy, icon: CheckCircle2, color: "text-status-online" },
          { label: "Falhando", value: summary.failed, icon: XCircle, color: "text-status-critical" },
          { label: "Desativados", value: summary.disabled, icon: Pause, color: "text-muted-foreground" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border/30 px-3 py-2.5 flex items-center gap-2.5">
            <m.icon className={cn("h-3.5 w-3.5 shrink-0", m.color)} />
            <div>
              <p className="text-base font-bold text-foreground leading-none">{m.value}</p>
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Failed jobs detail */}
      {failedJobs.length > 0 && (
        <div className="space-y-2 mb-3">
          {failedJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-status-critical/20 bg-status-critical/[0.03]">
              <XCircle className="h-4 w-4 text-status-critical shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{job.name}</span>
                {job.error && <p className="text-[10px] font-mono text-status-critical/60 truncate mt-0.5">{job.error}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono text-muted-foreground/40">{job.lastRunAgo}</p>
                <p className="text-[10px] font-mono text-status-critical">{job.consecutiveFails}x falhas</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Healthy jobs compact */}
      {healthyJobs.length > 0 && (
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_80px_80px] gap-2 px-4 py-2 bg-muted/5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/35">
            <span>Job</span>
            <span>Frequência</span>
            <span>Último</span>
            <span>Próximo</span>
          </div>
          {healthyJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="grid grid-cols-[1fr_100px_80px_80px] gap-2 px-4 py-2.5 border-t border-border/15 items-center">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-3 w-3 text-status-online/60 shrink-0" />
                <span className="text-xs font-mono text-foreground/70 truncate">{job.name}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/40">{job.scheduleHuman}</span>
              <span className="text-[10px] font-mono text-muted-foreground/40">{job.lastRunAgo}</span>
              <span className="text-[10px] font-mono text-primary/50">{job.nextRunIn}</span>
            </div>
          ))}
          {healthyJobs.length > 6 && (
            <div className="px-4 py-2 border-t border-border/15 text-center">
              <span className="text-[10px] font-mono text-muted-foreground/30">+{healthyJobs.length - 6} jobs saudáveis</span>
            </div>
          )}
        </div>
      )}

      {/* Disabled note */}
      {disabledJobs.length > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground/25 mt-3">
          {disabledJobs.length} job{disabledJobs.length !== 1 ? "s" : ""} desativado{disabledJobs.length !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}
