export function TimelineSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/40 bg-card px-4 py-3 h-14" />
        ))}
      </div>
      <div className="relative mt-8">
        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-border/20" />
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative flex items-start">
              <div className={`w-[calc(50%-20px)] ${i % 2 === 0 ? "pr-6" : ""}`}>
                {i % 2 === 0 && <div className="h-24 rounded-lg bg-muted/15 border border-border/20" />}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className="w-10 h-10 rounded-full bg-muted/20 border border-border/30" />
              </div>
              <div className={`w-[calc(50%-20px)] ml-auto ${i % 2 !== 0 ? "pl-6" : ""}`}>
                {i % 2 !== 0 && <div className="h-24 rounded-lg bg-muted/15 border border-border/20" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
