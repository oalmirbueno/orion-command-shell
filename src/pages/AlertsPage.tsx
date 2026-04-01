import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdvancedFilters, type FilterState } from "@/components/filters/AdvancedFilters";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronRight,
  ExternalLink,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/domains/api";

/* ── Shape real do endpoint ── */
interface AlertItem {
  id: string;
  severity: "critical" | "warning";
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

interface AlertsResponse {
  alerts: AlertItem[];
  total: number;
}

/* ── Fetcher direto ── */
async function fetchAlerts(): Promise<AlertsResponse> {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return {
    alerts: Array.isArray(json.alerts) ? json.alerts : [],
    total: json.total ?? json.alerts?.length ?? 0,
  };
}

/* ── Helpers ── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

/* ── Summary Cards ── */
function SummaryCards({ alerts }: { alerts: AlertItem[] }) {
  const active = alerts.length;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  const cards = [
    {
      label: "Ativos",
      value: active,
      icon: ShieldAlert,
      accent: active > 0 ? "text-foreground" : "text-muted-foreground/40",
      bg: active > 0 ? "bg-primary/5 border-primary/20" : "bg-surface-2 border-border/40",
    },
    {
      label: "Críticos",
      value: critical,
      icon: AlertCircle,
      accent: critical > 0 ? "text-status-critical" : "text-muted-foreground/40",
      bg: critical > 0 ? "bg-status-critical/[0.06] border-status-critical/20" : "bg-surface-2 border-border/40",
    },
    {
      label: "Atenção",
      value: warning,
      icon: AlertTriangle,
      accent: warning > 0 ? "text-status-warning" : "text-muted-foreground/40",
      bg: warning > 0 ? "bg-status-warning/[0.06] border-status-warning/20" : "bg-surface-2 border-border/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`rounded-lg border px-5 py-4 flex items-center gap-4 ${c.bg}`}>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${c.bg}`}>
              <Icon className={`h-5 w-5 ${c.accent}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${c.accent}`}>{c.value}</p>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mt-1">
                {c.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Alert Row ── */
const sevConfig = {
  critical: {
    icon: AlertCircle,
    text: "text-status-critical",
    border: "border-l-status-critical",
    bg: "bg-status-critical/[0.04]",
    ringBg: "bg-status-critical/10 border-status-critical/20",
  },
  warning: {
    icon: AlertTriangle,
    text: "text-status-warning",
    border: "border-l-status-warning",
    bg: "bg-status-warning/[0.04]",
    ringBg: "bg-status-warning/10 border-status-warning/20",
  },
} as const;

function AlertRow({ alert }: { alert: AlertItem }) {
  const cfg = sevConfig[alert.severity];
  const Icon = cfg.icon;
  const isCritical = alert.severity === "critical";

  return (
    <div
      className={`rounded-lg border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} hover:bg-accent/20 transition-all cursor-pointer group`}
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.ringBg}`}>
              <Icon className={`h-4 w-4 ${cfg.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-semibold leading-snug ${isCritical ? "text-status-critical" : "text-foreground"}`}>
                {alert.title}
              </h3>
              <p className="text-xs text-foreground/45 leading-relaxed mt-1.5">{alert.description}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-2" />
        </div>

        <div className="flex items-center gap-3.5 ml-[50px] text-xs font-mono text-muted-foreground/40">
          <span>{alert.source}</span>
          <div className="w-px h-3 bg-border/20" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(alert.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ── */
function AlertsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Page ── */
const AlertsPage = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { data, isLoading, isError, error, isFetching } = useQuery<AlertsResponse>({
    queryKey: ["alerts-page"],
    queryFn: fetchAlerts,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["alerts-page"] });
    setIsRefreshing(false);
  };

  return (
    <OrionLayout title="Alertas">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Alertas"]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alertas</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Sinais de risco e atenção operacional
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando…" : "Atualizar"}
          </Button>
        </div>

        {/* Content */}
        {isLoading && !data ? (
          <AlertsSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <AlertCircle className="h-8 w-8 text-status-critical mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70">Falha ao carregar alertas</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        ) : data && data.alerts.length === 0 ? (
          <div className="rounded-lg border border-border p-16 text-center">
            <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/50">Nenhum alerta ativo</p>
            <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">
              O sistema está operando sem alertas pendentes
            </p>
          </div>
        ) : data ? (
          <>
            <SummaryCards alerts={data.alerts} />

            {/* List */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  Feed de Alertas
                </h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs font-mono text-muted-foreground/40">{data.total} total</span>
              </div>
              <div className="space-y-2.5 max-h-[calc(100vh-380px)] overflow-y-auto orion-thin-scroll pr-1">
                {data.alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </OrionLayout>
  );
};

export default AlertsPage;
