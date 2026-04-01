import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch, Timer, Bot, Clock, CheckCircle2, XCircle, CalendarClock,
  Zap, ArrowRight, Activity, AlertTriangle, FileText, Hash, BarChart3,
} from "lucide-react";
import { apiUrl } from "@/domains/api";
import type { Pipeline, PipelineStep, PipelineStatus, StepStatus } from "@/domains/pipelines/types";

/* ── Types ── */

interface CronRunEntry {
  id: string;
  jobId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  error: string | null;
}

interface Props {
  pipeline: Pipeline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Status config ── */

const statusConfig: Record<PipelineStatus, { label: string; color: string }> = {
  running: { label: "Em execução", color: "text-blue-400" },
  healthy: { label: "Saudável", color: "text-emerald-400" },
  failed: { label: "Falhou", color: "text-red-400" },
  idle: { label: "Ocioso", color: "text-muted-foreground" },
  disabled: { label: "Desativado", color: "text-muted-foreground/50" },
};

const stepStatusColor: Record<StepStatus, string> = {
  done: "bg-emerald-500",
  running: "bg-blue-500 animate-pulse",
  queued: "bg-muted-foreground/30",
  failed: "bg-red-500",
  skipped: "bg-muted-foreground/20",
};

const stepTextColor: Record<StepStatus, string> = {
  done: "text-emerald-400",
  running: "text-blue-400",
  queued: "text-muted-foreground/50",
  failed: "text-red-400",
  skipped: "text-muted-foreground/40",
};

const stepLabel: Record<StepStatus, string> = {
  done: "Concluído",
  running: "Executando",
  queued: "Na fila",
  failed: "Falhou",
  skipped: "Ignorado",
};

/* ── Helpers ── */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}min`;
}

/* ── Step Detail Row ── */
function StepRow({ step, index }: { step: PipelineStep; index: number }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-3 h-3 rounded-full shrink-0 ${stepStatusColor[step.status]}`} />
        <div className="w-px h-full bg-border/30 min-h-[16px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground/40">#{index + 1}</span>
          <span className="text-sm font-medium text-foreground truncate">{step.label}</span>
          <Badge variant="outline" className={`text-[9px] font-mono ml-auto shrink-0 ${stepTextColor[step.status]}`}>
            {stepLabel[step.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground/50 font-mono">
          {step.duration && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {step.duration}
            </span>
          )}
          {step.detail && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {step.detail}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Run History Row ── */
function RunRow({ run }: { run: CronRunEntry }) {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-md border ${
      run.success ? "border-border/20 bg-card/30" : "border-red-500/20 bg-red-500/5"
    }`}>
      {run.success ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-foreground/80">
          {formatTime(run.startedAt)}
        </div>
        {run.error && (
          <div className="text-[10px] text-red-400/80 truncate mt-0.5">{run.error}</div>
        )}
      </div>
      <span className="text-[11px] font-mono text-muted-foreground/50">
        {formatDuration(run.durationMs)}
      </span>
    </div>
  );
}

/* ── Component ── */

export function PipelineDetailSheet({ pipeline, open, onOpenChange }: Props) {
  const [runs, setRuns] = useState<CronRunEntry[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Fetch cron run history when a cron-origin pipeline is selected
  useEffect(() => {
    if (!pipeline || !open) {
      setRuns([]);
      return;
    }

    // Only fetch runs for cron-origin pipelines
    if (pipeline.origin !== "cron" && pipeline.origin !== "mixed") return;

    let cancelled = false;
    setLoadingRuns(true);

    (async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch(apiUrl(`/cron/runs?jobId=${pipeline.id}`), {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          const entries = Array.isArray(data) ? data : data?.runs || [];
          setRuns(entries.slice(0, 15));
        }
      } catch {
        if (!cancelled) setRuns([]);
      } finally {
        if (!cancelled) setLoadingRuns(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pipeline?.id, open, pipeline?.origin]);

  if (!pipeline) return null;

  const cfg = statusConfig[pipeline.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l border-border bg-background">
        {/* Header */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-card border border-border/40 ${cfg.color}`}>
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">{pipeline.name}</h2>
              {pipeline.description && pipeline.description !== pipeline.name && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">{pipeline.description}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono shrink-0 ${
                pipeline.status === "failed" ? "border-red-500/40 text-red-400" :
                pipeline.status === "running" ? "border-blue-500/40 text-blue-400" :
                pipeline.status === "healthy" ? "border-emerald-500/40 text-emerald-400" :
                ""
              }`}
            >
              {cfg.label}
            </Badge>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Última execução", value: pipeline.lastRunAgo, icon: Clock },
              { label: "Duração", value: pipeline.lastDuration, icon: Timer },
              { label: "Taxa sucesso", value: pipeline.successRate, icon: BarChart3 },
            ].map((m) => (
              <div key={m.label} className="rounded-md border border-border/30 bg-card/40 p-2.5 text-center">
                <m.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground/40 mb-1" />
                <div className="text-sm font-bold font-mono text-foreground">{m.value}</div>
                <div className="text-[10px] text-muted-foreground/50">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Detail metadata */}
          <div className="rounded-lg border border-border/30 bg-card/30 divide-y divide-border/20">
            {[
              { label: "Origem", value: pipeline.origin === "cron" ? "Cron Job" : pipeline.origin === "mixed" ? "Cron + Operações" : pipeline.origin === "agent" ? "Agente" : "Operação" },
              { label: "Agendamento", value: pipeline.schedule || "—" },
              { label: "Próxima execução", value: pipeline.nextRunIn },
              { label: "Agente", value: pipeline.agent || "—" },
              { label: "Operações vinculadas", value: String(pipeline.operationCount) },
              { label: "Falhas consecutivas", value: pipeline.consecutiveFails > 0 ? `${pipeline.consecutiveFails}` : "0" },
              { label: "ID", value: pipeline.id },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-muted-foreground/50">{row.label}</span>
                <span className={`text-xs font-mono ${
                  row.label === "Falhas consecutivas" && pipeline.consecutiveFails > 0
                    ? "text-red-400"
                    : "text-foreground/80"
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-5" />

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 font-mono flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5" />
            Etapas do Pipeline
          </h3>

          {pipeline.steps.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic py-4 text-center">Sem etapas registradas</p>
          ) : (
            <div className="space-y-0">
              {pipeline.steps.map((step, i) => (
                <StepRow key={step.id} step={step} index={i} />
              ))}
            </div>
          )}
        </div>

        <Separator className="my-5" />

        {/* Run History */}
        <div className="space-y-3 pb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 font-mono flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Histórico de Execuções
          </h3>

          {loadingRuns ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : runs.length > 0 ? (
            <div className="space-y-1.5">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">
                {pipeline.origin === "cron" || pipeline.origin === "mixed"
                  ? "Sem histórico de execuções disponível"
                  : "Histórico disponível apenas para pipelines com origem cron"}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
