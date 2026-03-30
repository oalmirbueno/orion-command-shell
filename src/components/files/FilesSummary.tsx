import { FolderOpen, HardDrive, Clock, Layers } from "lucide-react";
import type { FilesSummaryData } from "@/domains/files/types";

interface FilesSummaryProps {
  summary: FilesSummaryData;
}

export function FilesSummary({ summary }: FilesSummaryProps) {
  if (!summary) return null;
  const items = [
    { label: "Arquivos", value: summary.totalFiles || "—", icon: FolderOpen, text: "text-primary", dot: "bg-primary/50" },
    { label: "Categorias", value: summary.categories || "—", icon: Layers, text: "text-foreground", dot: "bg-foreground/30" },
    { label: "Última Alteração", value: summary.lastModified || "—", icon: Clock, text: "text-status-online", dot: "bg-status-online/40" },
    { label: "Tamanho Total", value: summary.totalSize || "—", icon: HardDrive, text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/20 rounded-xl overflow-hidden border border-border/40">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-5 py-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-accent/5 border border-border/30 flex items-center justify-center shrink-0">
              <Icon className={`h-4.5 w-4.5 ${m.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
