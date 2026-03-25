import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, Timer,
  ToggleLeft, ToggleRight,
} from "lucide-react";

type JobStatus = "healthy" | "failed" | "warning" | "disabled";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  enabled: boolean;
  status: JobStatus;
  lastRun: string;
  lastRunAgo: string;
  lastDuration: string;
  lastResult: "success" | "failure" | "—";
  nextRun: string;
  nextRunIn: string;
  consecutiveSuccess: number;
  consecutiveFails: number;
  error?: string;
}

const MOCK_JOBS: CronJob[] = [
  {
    id: "j-01", name: "Health Check Global", schedule: "*/5 * * * *", scheduleHuman: "Every 5 min",
    enabled: true, status: "healthy", lastRun: "09:45", lastRunAgo: "2min ago", lastDuration: "4s",
    lastResult: "success", nextRun: "09:50", nextRunIn: "in 3min",
    consecutiveSuccess: 847, consecutiveFails: 0,
  },
  {
    id: "j-02", name: "Backup Database", schedule: "0 */6 * * *", scheduleHuman: "Every 6h",
    enabled: true, status: "healthy", lastRun: "06:00", lastRunAgo: "3h47 ago", lastDuration: "2m34s",
    lastResult: "success", nextRun: "12:00", nextRunIn: "in 2h13",
    consecutiveSuccess: 120, consecutiveFails: 0,
  },
  {
    id: "j-03", name: "Sync CRM Incremental", schedule: "*/15 * * * *", scheduleHuman: "Every 15 min",
    enabled: true, status: "healthy", lastRun: "09:30", lastRunAgo: "17min ago", lastDuration: "48s",
    lastResult: "success", nextRun: "09:45", nextRunIn: "in 0min",
    consecutiveSuccess: 312, consecutiveFails: 0,
  },
  {
    id: "j-04", name: "Limpar Temp Files", schedule: "0 3 * * *", scheduleHuman: "Daily 03:00",
    enabled: true, status: "healthy", lastRun: "03:00", lastRunAgo: "6h47 ago", lastDuration: "12s",
    lastResult: "success", nextRun: "03:00 +1d", nextRunIn: "in 17h13",
    consecutiveSuccess: 47, consecutiveFails: 0,
  },
  {
    id: "j-05", name: "Refresh Materialized Views", schedule: "0 */2 * * *", scheduleHuman: "Every 2h",
    enabled: true, status: "healthy", lastRun: "08:00", lastRunAgo: "1h47 ago", lastDuration: "1m18s",
    lastResult: "success", nextRun: "10:00", nextRunIn: "in 13min",
    consecutiveSuccess: 560, consecutiveFails: 0,
  },
  {
    id: "j-06", name: "Export Métricas Prometheus", schedule: "*/1 * * * *", scheduleHuman: "Every 1 min",
    enabled: true, status: "warning", lastRun: "09:46", lastRunAgo: "1min ago", lastDuration: "8s",
    lastResult: "success", nextRun: "09:47", nextRunIn: "in 0min",
    consecutiveSuccess: 14, consecutiveFails: 0,
    error: "Latência acima do normal nas últimas 3 execuções (avg 8s vs 2s normal)",
  },
  {
    id: "j-07", name: "Reprocessar Eventos Falhos", schedule: "*/30 * * * *", scheduleHuman: "Every 30 min",
    enabled: true, status: "failed", lastRun: "09:30", lastRunAgo: "17min ago", lastDuration: "2s",
    lastResult: "failure", nextRun: "10:00", nextRunIn: "in 13min",
    consecutiveSuccess: 0, consecutiveFails: 3,
    error: "ConnectionRefusedError: Unable to connect to event-processor:8081 — service may be down",
  },
  {
    id: "j-08", name: "Rotate Logs", schedule: "0 2 * * *", scheduleHuman: "Daily 02:00",
    enabled: true, status: "healthy", lastRun: "02:00", lastRunAgo: "7h47 ago", lastDuration: "6s",
    lastResult: "success", nextRun: "02:00 +1d", nextRunIn: "in 16h13",
    consecutiveSuccess: 47, consecutiveFails: 0,
  },
  {
    id: "j-09", name: "Warm ML Model Cache", schedule: "0 7 * * *", scheduleHuman: "Daily 07:00",
    enabled: true, status: "healthy", lastRun: "07:00", lastRunAgo: "2h47 ago", lastDuration: "3m42s",
    lastResult: "success", nextRun: "07:00 +1d", nextRunIn: "in 21h13",
    consecutiveSuccess: 12, consecutiveFails: 0,
  },
  {
    id: "j-10", name: "Report Semanal (Deprecated)", schedule: "0 8 * * 1", scheduleHuman: "Mon 08:00",
    enabled: false, status: "disabled", lastRun: "—", lastRunAgo: "—", lastDuration: "—",
    lastResult: "—", nextRun: "—", nextRunIn: "—",
    consecutiveSuccess: 0, consecutiveFails: 0,
  },
  {
    id: "j-11", name: "Purge Expired Tokens", schedule: "0 4 * * *", scheduleHuman: "Daily 04:00",
    enabled: false, status: "disabled", lastRun: "04:00 (3d ago)", lastRunAgo: "3d ago", lastDuration: "1s",
    lastResult: "success", nextRun: "—", nextRunIn: "—",
    consecutiveSuccess: 0, consecutiveFails: 0,
  },
];

const statusConfig: Record<JobStatus, { dot: string; text: string; border: string; bg: string }> = {
  healthy: { dot: "status-online", text: "text-status-online", border: "border-l-status-online", bg: "" },
  failed: { dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/5" },
  warning: { dot: "status-warning", text: "text-status-warning", border: "border-l-status-warning", bg: "bg-status-warning/5" },
  disabled: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/50", border: "border-l-muted-foreground/20", bg: "" },
};

function ResultBadge({ result }: { result: CronJob["lastResult"] }) {
  if (result === "success") {
    return (
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-status-online" />
        <span className="text-[10px] font-mono text-status-online">OK</span>
      </div>
    );
  }
  if (result === "failure") {
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-3 w-3 text-status-critical" />
        <span className="text-[10px] font-mono text-status-critical">FAIL</span>
      </div>
    );
  }
  return <span className="text-[10px] font-mono text-muted-foreground/30">—</span>;
}

function JobRow({ job }: { job: CronJob }) {
  const cfg = statusConfig[job.status];
  const isDisabled = !job.enabled;
  const hasFailed = job.status === "failed";

  return (
    <div className={`rounded-lg border border-border/40 border-l-2 ${cfg.border} ${cfg.bg} ${isDisabled ? "opacity-45" : ""} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-5 py-4">
        {/* Row 1: Name + Schedule + Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Timer className={`h-4 w-4 shrink-0 ${isDisabled ? "text-muted-foreground/30" : "text-muted-foreground/60"}`} />
            <h3 className="text-sm font-semibold text-foreground truncate">{job.name}</h3>
            <code className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border/40 text-muted-foreground/60 shrink-0">
              {job.schedule}
            </code>
            <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">{job.scheduleHuman}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {job.enabled ? (
              <ToggleRight className="h-4 w-4 text-status-online" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground/30" />
            )}
            <div className={`status-dot ${cfg.dot}`} />
            <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {/* Error row (only when failed or warning) */}
        {job.error && (
          <div className={`flex items-start gap-2 mb-3 ml-[26px] px-3 py-2 rounded-md border ${hasFailed ? "bg-status-critical/5 border-status-critical/15" : "bg-status-warning/5 border-status-warning/15"}`}>
            <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${hasFailed ? "text-status-critical" : "text-status-warning"}`} />
            <p className={`text-[10px] font-mono leading-relaxed ${hasFailed ? "text-status-critical/80" : "text-status-warning/80"}`}>
              {job.error}
            </p>
          </div>
        )}

        {/* Row 2: Metrics */}
        <div className="flex items-center gap-4 ml-[26px] text-[10px] font-mono text-muted-foreground/50 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/35">Last run</span>
            <span className="text-foreground/70">{job.lastRun}</span>
            <span className="text-muted-foreground/25">({job.lastRunAgo})</span>
          </div>
          <div className="h-3 w-px bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/35">Duration</span>
            <span className="text-foreground/70">{job.lastDuration}</span>
          </div>
          <div className="h-3 w-px bg-border/30" />
          <ResultBadge result={job.lastResult} />
          <div className="h-3 w-px bg-border/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/35">Next</span>
            <span className="text-primary/70">{job.nextRun}</span>
            <span className="text-muted-foreground/25">{job.nextRunIn}</span>
          </div>
          {job.consecutiveSuccess > 0 && (
            <>
              <div className="h-3 w-px bg-border/30" />
              <span className="text-status-online/60">{job.consecutiveSuccess}× consecutive OK</span>
            </>
          )}
          {job.consecutiveFails > 0 && (
            <>
              <div className="h-3 w-px bg-border/30" />
              <span className="text-status-critical">{job.consecutiveFails}× consecutive FAIL</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CronJobsList() {
  // Failed first, warning, healthy, disabled
  const order: Record<JobStatus, number> = { failed: 0, warning: 1, healthy: 2, disabled: 3 };
  const sorted = [...MOCK_JOBS].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Job Registry
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-[9px] font-mono text-primary font-medium">{MOCK_JOBS.filter(j => j.enabled).length} enabled</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-2">
        {sorted.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
