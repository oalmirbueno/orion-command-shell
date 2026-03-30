/**
 * Domain-specific skeleton layouts.
 * Each skeleton mirrors the real module structure so the first load feels instant.
 */

import { Skeleton } from "@/components/ui/skeleton";

/* ── Reusable blocks ── */

function SkeletonCard({ className = "h-32" }: { className?: string }) {
  return <Skeleton className={`rounded-lg border border-border/30 ${className}`} />;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1 rounded" />
      <Skeleton className="h-4 w-20 rounded" />
      <Skeleton className="h-4 w-16 rounded" />
    </div>
  );
}

function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border/30 divide-y divide-border/20">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function SkeletonSummaryBar() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 flex-1 rounded-lg border border-border/30" />
      ))}
    </div>
  );
}

/* ── Home ── */

export function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>
      <SkeletonCard className="h-24" />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3"><SkeletonCard className="h-56" /></div>
        <div className="xl:col-span-2"><SkeletonCard className="h-56" /></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2"><SkeletonCard className="h-44" /></div>
        <div className="xl:col-span-3"><SkeletonCard className="h-44" /></div>
      </div>
    </div>
  );
}

/* ── Sessions ── */

export function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonTable rows={8} />
    </div>
  );
}

/* ── Agents ── */

export function AgentsSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonCard className="h-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

/* ── Activity ── */

export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonTable rows={10} />
    </div>
  );
}

/* ── Cron ── */

export function CronSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonTable rows={6} />
    </div>
  );
}

/* ── Alerts ── */

export function AlertsSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonTable rows={6} />
    </div>
  );
}

/* ── Operations ── */

export function OperationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
      <SkeletonCard className="h-48" />
    </div>
  );
}

/* ── Files ── */

export function FilesSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <SkeletonTable rows={8} />
    </div>
  );
}

/* ── Memory ── */

export function MemorySkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonSummaryBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

/* ── System ── */

export function SystemSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-24" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 flex-1 rounded-lg border border-border/30" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3"><SkeletonTable rows={5} /></div>
        <div className="xl:col-span-2"><SkeletonCard className="h-52" /></div>
      </div>
      <SkeletonCard className="h-32" />
    </div>
  );
}
