import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, Timer,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchCronJobs } from "@/domains/cron/fetcher";
import type { CronJob, JobStatus } from "@/domains/cron/types";

const statusConfig: Record<JobStatus, { dot: string; text: string; border: string; bg: string }> = {
  healthy: { dot: "status-online", text: "text-status-online", border: "border-l-status-online", bg: "" },
  failed: { dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/5" },
  warning: { dot: "status-warning", text: "text-status-warning", border: "border-l-status-warning", bg: "bg-status-warning/5" },
  disabled: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/50", border: "border-l-muted-foreground/20", bg: "" },
};

function ResultBadge({ result }: { result: CronJob["lastResult"] }) {
  if (result === "success") return <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-status-online" /><span className="text-xs font-mono text-status-online">OK</span></div>;
  if (result === "failure") return <div className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-status-critical" /><span className="text-xs font-mono text-status-critical">FAIL</span></div>;
  return <span className="text-xs font-mono text-muted-foreground/30">—</span>;
}

function JobRow({ job }: { job: CronJob }) {
  const cfg = statusConfig[job.status];
  const isDisabled = !job.enabled;
  const hasFailed = job.status === "failed";

  return (
    <div className={`rounded-xl border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} ${isDisabled ? "opacity-45" : ""} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Timer className={`h-5 w-5 shrink-0 ${isDisabled ? "text-muted-foreground/30" : "text-muted-foreground/60"}`} />
            <h3 className="text-base font-semibold text-foreground truncate">{job.name}</h3>
            <code className="text-xs font-mono px-2 py-1 rounded bg-surface-2 border border-border/40 text-muted-foreground/60 shrink-0">{job.schedule}</code>
            <span className="text-xs font-mono text-muted-foreground/40 shrink-0">{job.scheduleHuman}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {job.enabled ? <ToggleRight className="h-5 w-5 text-status-online" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground/30" />}
            <div className={`status-dot ${cfg.dot}`} />
            <ChevronRight className="h-5 w-5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {job.error && (
          <div className={`flex items-start gap-3 mb-4 ml-8 px-4 py-3 rounded-lg border ${hasFailed ? "bg-status-critical/5 border-status-critical/15" : "bg-status-warning/5 border-status-warning/15"}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${hasFailed ? "text-status-critical" : "text-status-warning"}`} />
            <p className={`text-sm font-mono leading-relaxed ${hasFailed ? "text-status-critical/80" : "text-status-warning/80"}`}>{job.error}</p>
          </div>
        )}

        <div className="flex items-center gap-5 ml-8 text-xs font-mono text-muted-foreground/50 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/35">Última exec.</span>
            <span className="text-foreground/70">{job.lastRun}</span>
            <span className="text-muted-foreground/25">({job.lastRunAgo})</span>
          </div>
          <div className="h-4 w-px bg-border/30" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/35">Duração</span>
            <span className="text-foreground/70">{job.lastDuration}</span>
          </div>
          <div className="h-4 w-px bg-border/30" />
          <ResultBadge result={job.lastResult} />
          <div className="h-4 w-px bg-border/30" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/35">Próxima</span>
            <span className="text-primary/70">{job.nextRun}</span>
            <span className="text-muted-foreground/25">{job.nextRunIn}</span>
          </div>
          {job.consecutiveSuccess > 0 && (
            <><div className="h-4 w-px bg-border/30" /><span className="text-status-online/60">{job.consecutiveSuccess}× consecutivos OK</span></>
          )}
          {job.consecutiveFails > 0 && (
            <><div className="h-4 w-px bg-border/30" /><span className="text-status-critical">{job.consecutiveFails}× falhas consecutivas</span></>
          )}
        </div>
      </div>
    </div>
  );
}

export function CronJobsList() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<CronJob[]>({
    key: "cron-jobs",
    fetcher: fetchCronJobs,
  });

  const jobs = data || [];
  const order: Record<JobStatus, number> = { failed: 0, warning: 1, healthy: 2, disabled: 3 };
  const sorted = [...jobs].sort((a, b) => order[a.status] - order[b.status]);
  const enabledCount = jobs.filter(j => j.enabled).length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Registro de Jobs</h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-mono text-primary font-medium">{enabledCount} habilitados</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="space-y-3">
          {sorted.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
