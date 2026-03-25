/**
 * Orion Design System — State Components
 *
 * Visual states for loading, empty, error, stale, and ready.
 * Use these inside any page section or card.
 */

import { Loader2, Inbox, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

/* ── Loading ── */

export function OrionLoading({ title = "Loading...", description, className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className,
    )}>
      <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center mb-3">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1">{description}</p>}
    </div>
  );
}

/* ── Empty ── */

export function OrionEmpty({ title = "No data", description = "Nothing to display yet", className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className,
    )}>
      <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center mb-3">
        <Inbox className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/50 font-mono mt-1">{description}</p>
    </div>
  );
}

/* ── Error ── */

export function OrionError({
  title = "Something went wrong",
  description,
  className,
  compact,
  onRetry,
}: StateProps & { onRetry?: () => void }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className,
    )}>
      <div className="w-10 h-10 rounded-lg bg-status-critical/10 border border-status-critical/25 flex items-center justify-center mb-3">
        <AlertTriangle className="h-5 w-5 text-status-critical" />
      </div>
      <p className="text-sm font-medium text-status-critical">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-mono text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/20 hover:bg-primary/5"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ── Stale ── */

export function OrionStale({ title = "Data may be outdated", description, className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className,
    )}>
      <div className="w-10 h-10 rounded-lg bg-status-warning/10 border border-status-warning/25 flex items-center justify-center mb-3">
        <Clock className="h-5 w-5 text-status-warning" />
      </div>
      <p className="text-sm font-medium text-status-warning">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1">{description}</p>}
    </div>
  );
}

/* ── Ready / Connected ── */

export function OrionReady({ title = "Connected", description = "Awaiting data stream", className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className,
    )}>
      <div className="w-10 h-10 rounded-lg bg-status-online/10 border border-status-online/25 flex items-center justify-center mb-3">
        <CheckCircle2 className="h-5 w-5 text-status-online" />
      </div>
      <p className="text-sm font-medium text-status-online">{title}</p>
      <p className="text-xs text-muted-foreground/50 font-mono mt-1">{description}</p>
    </div>
  );
}

/* ── Inline State Banner ── */

export function OrionStateBanner({
  variant,
  message,
  className,
}: {
  variant: "loading" | "error" | "stale" | "empty";
  message: string;
  className?: string;
}) {
  const config = {
    loading: { icon: Loader2, color: "text-primary", bg: "bg-primary/5 border-primary/15", spin: true },
    error: { icon: AlertTriangle, color: "text-status-critical", bg: "bg-status-critical/5 border-status-critical/15", spin: false },
    stale: { icon: Clock, color: "text-status-warning", bg: "bg-status-warning/5 border-status-warning/15", spin: false },
    empty: { icon: Inbox, color: "text-muted-foreground/50", bg: "bg-surface-2 border-border/30", spin: false },
  };

  const cfg = config[variant];
  const Icon = cfg.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md border text-xs", cfg.bg, className)}>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color, cfg.spin && "animate-spin")} />
      <span className={cn("font-mono text-[10px]", cfg.color)}>{message}</span>
    </div>
  );
}
