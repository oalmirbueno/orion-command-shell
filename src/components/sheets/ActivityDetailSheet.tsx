import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Info, Clock,
  Bot, Server, GitBranch, Shield, Zap, Copy, ChevronDown, ChevronUp,
  Tag, Radio,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ActivityEvent, EventPriority, EventCategory } from "@/domains/activity/types";

const priorityConfig: Record<EventPriority, { icon: React.ElementType; label: string; className: string }> = {
  critical: { icon: AlertCircle, label: "Crítico", className: "bg-status-critical/15 text-status-critical border-status-critical/30" },
  warning:  { icon: AlertTriangle, label: "Atenção", className: "bg-status-warning/15 text-status-warning border-status-warning/30" },
  success:  { icon: CheckCircle2, label: "Sucesso", className: "bg-status-online/15 text-status-online border-status-online/30" },
  info:     { icon: Info, label: "Info", className: "bg-primary/15 text-primary border-primary/30" },
  neutral:  { icon: Clock, label: "Neutro", className: "bg-muted text-muted-foreground border-border/40" },
};

const categoryConfig: Record<EventCategory, { icon: React.ElementType; label: string; className: string }> = {
  agent:    { icon: Bot, label: "Agente", className: "bg-primary/10 text-primary border-primary/20" },
  system:   { icon: Server, label: "Sistema", className: "bg-status-online/10 text-status-online border-status-online/20" },
  pipeline: { icon: GitBranch, label: "Pipeline", className: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  security: { icon: Shield, label: "Segurança", className: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  session:  { icon: Zap, label: "Sessão", className: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  deploy:   { icon: GitBranch, label: "Deploy", className: "bg-primary/10 text-primary border-primary/20" },
};

interface Props {
  event: ActivityEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailSheet({ event, open, onOpenChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!event) return null;

  const pcfg = priorityConfig[event.priority] ?? priorityConfig.info;
  const ccfg = categoryConfig[event.category] ?? categoryConfig.system;
  const PIcon = pcfg.icon;
  const CIcon = ccfg.icon;

  const handleCopy = () => {
    const text = [
      `Título: ${event.title}`,
      `Prioridade: ${event.priority}`,
      `Categoria: ${event.category}`,
      `Hora: ${event.time} (${event.timeAgo})`,
      `Origem: ${event.source}`,
      `Descrição: ${event.description || "—"}`,
      `ID: ${event.id}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Detalhes copiados" });
  };

  const descriptionLong = (event.description?.length ?? 0) > 200;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${pcfg.className}`}>
              <PIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-foreground text-base truncate">{event.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0 ${pcfg.className}`}>
                  {pcfg.label}
                </Badge>
                <code className="text-[10px] font-mono text-muted-foreground/40 truncate">{event.id.slice(0, 8)}</code>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Categoria */}
          <Section icon={Tag} title="Categoria">
            <div className="flex items-center gap-2 ml-5">
              <CIcon className="h-3.5 w-3.5" />
              <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0 ${ccfg.className}`}>
                {ccfg.label}
              </Badge>
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Metadados */}
          <Section icon={Clock} title="Tempo">
            <Row label="Horário" value={event.time} mono />
            <Row label="Relativo" value={event.timeAgo} />
          </Section>

          <Separator className="bg-border/30" />

          <Section icon={Radio} title="Origem">
            <Row label="Source" value={event.source} />
          </Section>

          <Separator className="bg-border/30" />

          {/* Descrição */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-3.5 w-3.5 text-muted-foreground/40" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Descrição</h4>
            </div>
            <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
              {event.description ? (
                <p className={`text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap ${!expanded && descriptionLong ? "line-clamp-4" : ""}`}>
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/30 italic">Sem descrição disponível</p>
              )}
              {descriptionLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2 text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded ? "Recolher" : "Ver tudo"}
                </button>
              )}
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Ações */}
          <Button onClick={handleCopy} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copiar detalhes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{title}</h4>
      </div>
      <div className="space-y-2.5 ml-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-foreground/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
