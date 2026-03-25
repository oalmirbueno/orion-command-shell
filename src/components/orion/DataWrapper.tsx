/**
 * Orion Design System — Data State Wrapper
 *
 * Declarative wrapper that renders loading / empty / error / stale / ready states.
 * Wraps any section that depends on data fetching.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { OrionLoading, OrionEmpty, OrionError, OrionStale, OrionStateBanner } from "./states";
import type { DataState, DataSource } from "@/hooks/useOrionData";

interface OrionDataWrapperProps {
  state: DataState;
  source: DataSource;
  children: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
  lastUpdated?: Date | null;
  compact?: boolean;
  /** Label shown on the data source indicator */
  sourceLabel?: string;
  className?: string;
}

const sourceLabels: Record<DataSource, { label: string; className: string }> = {
  mock: { label: "DADOS SIMULADOS", className: "bg-status-warning/8 border-status-warning/20 text-status-warning" },
  simulated: { label: "SIMULAÇÃO", className: "bg-primary/8 border-primary/20 text-primary" },
  api: { label: "API CONECTADA", className: "bg-status-online/8 border-status-online/20 text-status-online" },
  cache: { label: "CACHE", className: "bg-muted border-border text-muted-foreground" },
};

function formatLastUpdated(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min atrás`;
  return `${Math.floor(diff / 3_600_000)}h atrás`;
}

export function OrionDataWrapper({
  state,
  source,
  children,
  error,
  onRetry,
  lastUpdated,
  compact,
  sourceLabel,
  className,
}: OrionDataWrapperProps) {
  const cfg = sourceLabels[source];

  return (
    <div className={cn("relative", className)}>
      {/* Data source indicator — always visible */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          "text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border",
          cfg.className,
        )}>
          {sourceLabel || cfg.label}
        </span>
        {lastUpdated && state === "ready" && (
          <span className="text-[8px] font-mono text-muted-foreground/30">
            Atualizado {formatLastUpdated(lastUpdated)}
          </span>
        )}
      </div>

      {/* State-driven content */}
      {state === "loading" && (
        <OrionLoading compact={compact} description="Obtendo dados..." />
      )}

      {state === "empty" && (
        <OrionEmpty
          compact={compact}
          title="Sem dados disponíveis"
          description="Este módulo será populado quando a integração estiver ativa"
        />
      )}

      {state === "error" && (
        <OrionError
          compact={compact}
          title="Falha ao obter dados"
          description={error || "Não foi possível conectar à fonte de dados"}
          onRetry={onRetry}
        />
      )}

      {state === "stale" && (
        <>
          <OrionStateBanner
            variant="stale"
            message="Dados podem estar desatualizados — última sync há mais de 5min"
            className="mb-3"
          />
          {children}
        </>
      )}

      {state === "ready" && children}
    </div>
  );
}
