import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ActivityEvent } from "@/domains/activity/types";

interface Props {
  event: ActivityEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailSheet({ event, open, onOpenChange }: Props) {
  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{event.title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <Row label="Tipo" value={event.category} />
          <Row label="Prioridade" value={event.priority} />
          <Row label="Hora" value={`${event.time} (${event.timeAgo})`} />
          <Row label="Source" value={event.source} />

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Descrição</h4>
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{event.description || "—"}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-24 shrink-0">{label}</span>
      <span className="text-sm font-mono text-foreground/80">{value}</span>
    </div>
  );
}
