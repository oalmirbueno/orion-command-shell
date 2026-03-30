/**
 * Orion Design System — State Components
 *
 * Visual states for loading, empty, error, stale, and ready.
 */

import { Loader2, Inbox, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
  icon?: React.ElementType;
}

/* ── Loading ── */

export function OrionLoading({ title = "Carregando...", description, className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className,
    )}>
      <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1.5">{description}</p>}
    </div>
  );
}

/* ── Empty ── */

export function OrionEmpty({ title = "Sem dados", description = "Nada para exibir ainda", className, compact, icon }: StateProps) {
  const Icon = icon || Inbox;
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className,
    )}>
      <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/50 font-mono mt-1.5">{description}</p>
    </div>
  );
}

/* ── Error ── */

export function OrionError({
  title = "Algo deu errado",
  description,
  className,
  compact,
  onRetry,
}: StateProps & { onRetry?: () => void }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className,
    )}>
      <div className="w-12 h-12 rounded-lg bg-status-critical/10 border border-status-critical/25 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-status-critical" />
      </div>
      <p className="text-sm font-medium text-status-critical">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1.5 max-w-sm">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-mono text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-md border border-primary/20 hover:bg-primary/5"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/* ── Stale ── */

export function OrionStale({ title = "Dados podem estar desatualizados", description, className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className,
    )}>
      <div className="w-12 h-12 rounded-lg bg-status-warning/10 border border-status-warning/25 flex items-center justify-center mb-4">
        <Clock className="h-6 w-6 text-status-warning" />
      </div>
      <p className="text-sm font-medium text-status-warning">{title}</p>
      {description && <p className="text-xs text-muted-foreground/50 font-mono mt-1.5">{description}</p>}
    </div>
  );
}

/* ── Ready / Connected ── */

export function OrionReady({ title = "Conectado", description = "Aguardando fluxo de dados", className, compact }: StateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-10" : "py-20",
      className,
    )}>
      <div className="w-12 h-12 rounded-lg bg-status-online/10 border border-status-online/25 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-6 w-6 text-status-online" />
      </div>
      <p className="text-sm font-medium text-status-online">{title}</p>
      <p className="text-xs text-muted-foreground/50 font-mono mt-1.5">{description}</p>
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
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-md border text-sm", cfg.bg, className)}>
      <Icon className={cn("h-4 w-4 shrink-0", cfg.color, cfg.spin && "animate-spin")} />
      <span className={cn("font-mono text-xs", cfg.color)}>{message}</span>
    </div>
  );
}
