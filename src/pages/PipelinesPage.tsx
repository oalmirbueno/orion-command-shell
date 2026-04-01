import { useState } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionDataWrapper, OrionBreadcrumb } from "@/components/orion";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchPipelinesPage } from "@/domains/pipelines/fetcher";
import type { PipelinesPageData, Pipeline, PipelineStep, PipelineStatus, StepStatus } from "@/domains/pipelines/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch, Activity, CheckCircle2, XCircle, Clock, Pause, Timer,
  ChevronRight, Zap, Bot, CalendarClock, ArrowRight, Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PipelineDetailSheet } from "@/components/sheets/PipelineDetailSheet";

/* ── Skeleton ── */
function PipelinesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg border border-border/30" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg border border-border/30" />
      ))}
    </div>
  );
}

/* ── Status visuals ── */
const statusConfig: Record<PipelineStatus, { label: string; color: string; icon: React.ElementType }> = {
  running: { label: "Em execução", color: "text-blue-400", icon: Activity },
  healthy: { label: "Saudável", color: "text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Falhou", color: "text-red-400", icon: XCircle },
  idle: { label: "Ocioso", color: "text-muted-foreground", icon: Clock },
  disabled: { label: "Desativado", color: "text-muted-foreground/50", icon: Pause },
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

/* ── Summary Bar ── */
function SummaryBar({ summary }: { summary: PipelinesPageData["summary"] }) {
  const metrics = [
    { label: "Total", value: summary.total, color: "text-foreground" },
    { label: "Executando", value: summary.running, color: "text-blue-400" },
    { label: "Saudáveis", value: summary.healthy, color: "text-emerald-400" },
    { label: "Falhas", value: summary.failed, color: "text-red-400" },
    { label: "Desativados", value: summary.disabled, color: "text-muted-foreground/50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border border-border/40 bg-card/50 p-4 text-center">
          <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
          <div className="text-xs text-muted-foreground/60 mt-1">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Step Flow (visual pipeline) ── */
function StepFlow({ steps }: { steps: PipelineStep[] }) {
  if (steps.length === 0) return <span className="text-xs text-muted-foreground/40 italic">Sem etapas</span>;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-0.5 group relative">
            <div className={`w-3 h-3 rounded-full ${stepStatusColor[step.status]} shrink-0`} />
            <span className={`text-[10px] font-mono leading-tight max-w-[80px] truncate ${stepTextColor[step.status]}`}>
              {step.label}
            </span>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="bg-popover border border-border rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                <div className="font-medium">{step.label}</div>
                {step.duration && <div className="text-muted-foreground">{step.duration}</div>}
                {step.detail && <div className="text-muted-foreground">{step.detail}</div>}
              </div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0 -mt-3" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Pipeline Card ── */
function PipelineCard({ pipeline, onSelect }: { pipeline: Pipeline; onSelect: (p: Pipeline) => void }) {
  const navigate = useNavigate();
  const cfg = statusConfig[pipeline.status];
  const Icon = cfg.icon;

  const originLabels: Record<string, string> = {
    cron: "Cron",
    operation: "Operação",
    agent: "Agente",
    mixed: "Misto",
  };

  return (
    <div
      onClick={() => onSelect(pipeline)}
      className={`rounded-lg border bg-card/60 hover:bg-card/80 transition-colors cursor-pointer ${
        pipeline.status === "failed" ? "border-red-500/30" :
        pipeline.status === "running" ? "border-blue-500/30" :
        "border-border/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`mt-0.5 p-1.5 rounded-md bg-card border border-border/30 ${cfg.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{pipeline.name}</h3>
            {pipeline.description && pipeline.description !== pipeline.name && (
              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{pipeline.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] font-mono">
            {originLabels[pipeline.origin] || pipeline.origin}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${
              pipeline.status === "failed" ? "border-red-500/40 text-red-400" :
              pipeline.status === "running" ? "border-blue-500/40 text-blue-400" :
              pipeline.status === "healthy" ? "border-emerald-500/40 text-emerald-400" :
              ""
            }`}
          >
            {cfg.label}
          </Badge>
        </div>
      </div>

      {/* Step flow */}
      <div className="px-4 py-2">
        <StepFlow steps={pipeline.steps} />
      </div>

      {/* Metadata footer */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/20 text-[11px] text-muted-foreground/50 font-mono">
        {pipeline.schedule && (
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {pipeline.schedule}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {pipeline.lastDuration}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {pipeline.lastRunAgo}
        </span>
        {pipeline.agent && (
          <span
            className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/agents")}
          >
            <Bot className="h-3 w-3" />
            {pipeline.agent}
          </span>
        )}
        {pipeline.nextRunIn !== "—" && (
          <span className="flex items-center gap-1 text-muted-foreground/40">
            Próxima: {pipeline.nextRunIn}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Taxa: {pipeline.successRate}
        </span>
        {pipeline.consecutiveFails > 0 && (
          <span className="text-red-400 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {pipeline.consecutiveFails}x falha
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-card border border-border/40 flex items-center justify-center mb-4">
        <GitBranch className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <h3 className="text-sm font-semibold text-foreground/80">Nenhum pipeline ativo</h3>
      <p className="text-xs text-muted-foreground/50 mt-1 max-w-xs">
        Pipelines são derivados automaticamente de cron jobs e operações. Quando houver fluxos ativos, aparecerão aqui.
      </p>
    </div>
  );
}

/* ── Page ── */
const PipelinesPage = () => {
  const [selected, setSelected] = useState<Pipeline | null>(null);
  const { state, data, source, lastUpdated, refetch } = useOrionData<PipelinesPageData>({
    key: "pipelines-page",
    fetcher: fetchPipelinesPage,
    refreshInterval: 30_000,
  });

  return (
    <OrionLayout title="Pipelines">
      <OrionBreadcrumb items={["Pipelines"]} />
      <PipelineDetailSheet pipeline={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact hideSource skeleton={<PipelinesSkeleton />}>
        {data && (
          data.pipelines.length === 0 ? <EmptyState /> : (
            <div className="space-y-5">
              <SummaryBar summary={data.summary} />

              {/* Running pipelines section */}
              {data.pipelines.some(p => p.status === "running") && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400/70 font-mono flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    Em Execução
                  </h2>
                  <div className="space-y-3">
                    {data.pipelines.filter(p => p.status === "running").map(p => (
                      <PipelineCard key={p.id} pipeline={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Failed pipelines */}
              {data.pipelines.some(p => p.status === "failed") && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-red-400/70 font-mono flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5" />
                    Com Falhas
                  </h2>
                  <div className="space-y-3">
                    {data.pipelines.filter(p => p.status === "failed").map(p => (
                      <PipelineCard key={p.id} pipeline={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy + idle */}
              {data.pipelines.some(p => p.status === "healthy" || p.status === "idle") && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Operacionais
                  </h2>
                  <div className="space-y-3">
                    {data.pipelines.filter(p => p.status === "healthy" || p.status === "idle").map(p => (
                      <PipelineCard key={p.id} pipeline={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Disabled */}
              {data.pipelines.some(p => p.status === "disabled") && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 font-mono flex items-center gap-2">
                    <Pause className="h-3.5 w-3.5" />
                    Desativados
                  </h2>
                  <div className="space-y-3">
                    {data.pipelines.filter(p => p.status === "disabled").map(p => (
                      <PipelineCard key={p.id} pipeline={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </OrionDataWrapper>
    </OrionLayout>
  );
};

export default PipelinesPage;
