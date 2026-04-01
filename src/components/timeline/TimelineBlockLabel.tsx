export function TimelineBlockLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-border/15" />
      </div>
      <div className="relative flex items-center gap-2 bg-background px-4 py-1.5 rounded-full border border-border/30">
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/60 font-medium">
          {label}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/30 bg-muted/20 px-1.5 py-0.5 rounded">
          {count}
        </span>
      </div>
    </div>
  );
}
