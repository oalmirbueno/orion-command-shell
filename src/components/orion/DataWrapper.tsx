/**
 * Orion Design System — Data State Wrapper
 *
 * Declarative wrapper that renders loading / empty / error / stale / ready states.
 * When real APIs are connected, the source indicator will automatically reflect the data origin.
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
  /** Hide the source indicator entirely (for inline usage) */
  hideSource?: boolean;
}

const sourceLabels: Record<DataSource, { label: string; className: string }> = {
  fallback: { label: "OFFLINE", className: "text-muted-foreground/40 border-border/30" },
  api: { label: "LIVE", className: "text-status-online border-status-online/30" },
  cache: { label: "CACHE", className: "text-muted-foreground/50 border-border/30" },
};

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
  hideSource,
}: OrionDataWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {/* State-driven content */}
      {state === "loading" && (
        <OrionLoading compact={compact} />
      )}

      {state === "empty" && (
        <OrionEmpty
          compact={compact}
          title="Sem dados"
          description="Aguardando integração ativa"
        />
      )}

      {state === "error" && (
        <OrionError
          compact={compact}
          title="Falha na conexão"
          description={error || "Não foi possível conectar à fonte de dados"}
          onRetry={onRetry}
        />
      )}

      {state === "stale" && (
        <>
          <OrionStateBanner
            variant="stale"
            message="Dados desatualizados — última sync há mais de 5min"
            className="mb-3"
          />
          {children}
        </>
      )}

      {state === "ready" && children}
    </div>
  );
}
