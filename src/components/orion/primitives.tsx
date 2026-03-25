/**
 * Orion Design System — Shared Primitives
 */

import React from "react";
import { cn } from "@/lib/utils";

/* ── Types ── */

export type OrionStatus = "online" | "warning" | "critical" | "info" | "neutral";
export type OrionSeverity = "critical" | "warning" | "success" | "info" | "neutral";

/* ── Breadcrumb ── */

export function OrionBreadcrumb({ items }: { items: string[] }) {
  return (
    <div className="orion-breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="orion-breadcrumb-separator">/</span>}
          <span className={i === items.length - 1 ? "orion-breadcrumb-current" : ""}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Section Header ── */

interface SectionHeaderProps {
  label: string;
  badge?: { text: string; variant?: OrionSeverity };
  live?: boolean;
  right?: React.ReactNode;
}

const badgeVariantClass: Record<OrionSeverity, string> = {
  critical: "orion-badge-critical",
  warning: "orion-badge-warning",
  success: "orion-badge-success",
  info: "orion-badge-info",
  neutral: "orion-badge-neutral",
};

export function OrionSectionHeader({ label, badge, live, right }: SectionHeaderProps) {
  return (
    <div className="orion-section-header">
      <h2 className="orion-section-label">{label}</h2>
      {badge && (
        <span className={cn("orion-badge-pill ml-2", badgeVariantClass[badge.variant || "info"])}>
          {badge.text}
        </span>
      )}
      <div className="orion-section-divider" />
      {right}
      {live && <span className="orion-live-indicator">● AO VIVO</span>}
    </div>
  );
}

/* ── Summary Grid ── */

interface SummaryMetric {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  dotClass?: string;
  highlight?: boolean;
}

export function OrionSummaryGrid({
  metrics,
  columns = 4,
  alertBorder,
}: {
  metrics: SummaryMetric[];
  columns?: number;
  alertBorder?: boolean;
}) {
  const colClass =
    columns === 6 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" :
    columns === 3 ? "grid-cols-1 sm:grid-cols-3" :
    "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn(
      "orion-summary-grid",
      colClass,
      alertBorder && "bg-status-critical/10 border-status-critical/30",
    )}>
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className={cn("orion-summary-cell", m.highlight && "bg-status-critical/8")}>
            <div className={cn("orion-icon-box", m.highlight && "bg-status-critical/10 border-status-critical/25")}>
              <Icon className={cn("h-5 w-5", m.iconColor || "text-muted-foreground/60")} />
            </div>
            <div>
              <p className={cn("orion-metric-value", m.highlight && "text-status-critical")}>{m.value}</p>
              <div className="flex items-center gap-2 mt-1">
                {m.dotClass && <div className={cn("status-dot", m.dotClass)} />}
                <span className="orion-metric-label">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Status Badge ── */

export function OrionBadge({
  children,
  variant = "neutral",
  pill,
}: {
  children: React.ReactNode;
  variant?: OrionSeverity;
  pill?: boolean;
}) {
  return (
    <span className={cn(pill ? "orion-badge-pill" : "orion-badge", badgeVariantClass[variant])}>
      {children}
    </span>
  );
}

/* ── Row with left border ── */

export function OrionRow({
  children,
  borderColor,
  bg,
  dimmed,
  className,
}: {
  children: React.ReactNode;
  borderColor?: string;
  bg?: string;
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      "orion-row-bordered",
      borderColor,
      bg,
      dimmed && "orion-dimmed",
      className,
    )}>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ── Vertical separator ── */

export function OrionVSep() {
  return <div className="orion-vsep" />;
}

/* ── Meta line ── */

export function OrionMeta({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 orion-meta", className)}>
      {children}
    </div>
  );
}

/* ── Context Box ── */

export function OrionContextBox({ children, variant }: { children: React.ReactNode; variant?: "critical" | "warning" }) {
  return (
    <div className={cn(
      "orion-context-box",
      variant === "critical" && "bg-status-critical/5 border-status-critical/15",
      variant === "warning" && "bg-status-warning/5 border-status-warning/15",
    )}>
      {children}
    </div>
  );
}

/* ── Progress Bar ── */

export function OrionProgress({
  value,
  variant = "primary",
}: {
  value: number;
  variant?: "primary" | "warning" | "critical" | "success";
}) {
  const colorClass =
    variant === "critical" ? "bg-status-critical/60" :
    variant === "warning" ? "bg-status-warning/50" :
    variant === "success" ? "bg-status-online/60" :
    "bg-primary";

  return (
    <div className="orion-progress-track">
      <div
        className={cn("orion-progress-bar", colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ── Group Header (for grouped lists) ── */

export function OrionGroupHeader({
  label,
  count,
  dotClass,
  textClass,
}: {
  label: string;
  count?: number;
  dotClass?: string;
  textClass?: string;
}) {
  return (
    <div className="orion-group-header">
      {dotClass && <div className={cn("status-dot", dotClass)} />}
      <span className={cn("text-[10px] font-mono uppercase tracking-widest font-semibold", textClass || "text-muted-foreground/50")}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs font-mono text-muted-foreground/30">{count}</span>
      )}
      <div className="orion-group-divider" />
    </div>
  );
}
