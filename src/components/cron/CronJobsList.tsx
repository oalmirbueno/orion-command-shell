import {
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, Timer,
  ToggleLeft, ToggleRight, Inbox,
} from "lucide-react";
import type { CronJob, JobStatus } from "@/domains/cron/types";

const statusConfig: Record<JobStatus, { dot: string; text: string; border: string; bg: string }> = {
  healthy: { dot: "status-online", text: "text-status-online", border: "border-l-status-online", bg: "" },
  failed: { dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/[0.04]" },
  warning: { dot: "status-warning", text: "text-status-warning", border: "border-l-status-warning", bg: "bg-status-warning/[0.04]" },
  disabled: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/50", border: "border-l-muted-foreground/20", bg: "" },
};

function ResultBadge({ result }: { result: CronJob["lastResult"] }) {
  if (result === "success") return <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-status-online" /><span className="text-[10px] font-mono text-status-online">OK</span></div>;
  if (result === "failure") return <div className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-status-critical" /><span className="text-[10px] font-mono text-status-critical">FALHA</span></div>;
  return <span className="text-[10px] font-mono text-muted-foreground/25">—</span>;
}

function JobRow({ job }: { job: CronJob }) {
  const cfg = statusConfig[job.status];
  const isDisabled = !job.enabled;
  const hasFailed = job.status === "failed";

  return (
    <div className={`rounded-lg border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} ${isDisabled ? "opacity-40" : ""} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${hasFailed ? "bg-status-critical/10 border-status-critical/20" : "bg-surface-2 border-border/40"}`}>
              <Timer className={`h-4 w-4 ${isDisabled ? "text-muted-foreground/25" : hasFailed ? "text-status-critical" : "text-muted-foreground/50"}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{job.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border/30 text-muted-foreground/50">{job.schedule}</code>
                <span className="text-[10px] font-mono text-muted-foreground/30">{job.scheduleHuman}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 ml-4">
            {job.enabled ? <ToggleRight className="h-4 w-4 text-status-online" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground/25" />}
            <div className={`status-dot ${cfg.dot}`} />
            <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {job.error && (
          <div className={`flex items-start gap-2.5 mb-4 ml-12 px-3.5 py-2.5 rounded-lg border ${hasFailed ? "bg-status-critical/[0.04] border-status-critical/15" : "bg-status-warning/[0.04] border-status-warning/15"}`}>
            <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${hasFailed ? "text-status-critical" : "text-status-warning"}`} />
            <p className={`text-xs font-mono leading-relaxed ${hasFailed ? "text-status-critical/70" : "text-status-warning/70"}`}>{job.error}</p>
          </div>
        )}

        <div className="flex items-center gap-4 ml-12 text-xs font-mono text-muted-foreground/40 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">Última</span>
            <span className="text-foreground/60">{job.lastRun}</span>
            <span className="text-muted-foreground/20">({job.lastRunAgo})</span>
          </div>
          <div className="w-px h-3 bg-border/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">Duração</span>
            <span className="text-foreground/60">{job.lastDuration}</span>
          </div>
          <div className="w-px h-3 bg-border/20" />
          <ResultBadge result={job.lastResult} />
          <div className="w-px h-3 bg-border/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">Próxima</span>
            <span className="text-primary/60">{job.nextRun}</span>
            <span className="text-muted-foreground/20">{job.nextRunIn}</span>
          </div>
          {job.consecutiveSuccess > 0 && (
            <><div className="w-px h-3 bg-border/20" /><span className="text-status-online/50">{job.consecutiveSuccess}× OK</span></>
          )}
          {job.consecutiveFails > 0 && (
            <><div className="w-px h-3 bg-border/20" /><span className="text-status-critical/70">{job.consecutiveFails}× falhas</span></>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  jobs: CronJob[];
}

export function CronJobsList({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Registro de Jobs</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum job registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const order: Record<JobStatus, number> = { failed: 0, warning: 1, healthy: 2, disabled: 3 };
  const sorted = [...jobs].sort((a, b) => order[a.status] - order[b.status]);
  const enabledCount = jobs.filter(j => j.enabled).length;
  const failedCount = jobs.filter(j => j.status === "failed").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Registro de Jobs</h2>
        {failedCount > 0 ? (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-critical/10 border border-status-critical/20">
            <span className="text-xs font-mono text-status-critical font-medium">{failedCount} com falha</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-online/10 border border-status-online/20">
            <span className="text-xs font-mono text-status-online font-medium">{enabledCount} habilitados</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-muted-foreground/40">{jobs.length} total</span>
      </div>
      <div className="space-y-2.5">
        {sorted.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
