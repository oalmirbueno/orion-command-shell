import {
  FileText, Image, Settings, ScrollText, Database, Code,
  FolderOpen, Clock, Inbox, Search, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { FileEntry, FileType } from "@/domains/files/types";

const typeConfig: Record<FileType, { icon: React.ElementType; label: string; color: string }> = {
  document: { icon: FileText, label: "Documento", color: "text-primary" },
  image: { icon: Image, label: "Imagem", color: "text-status-online" },
  config: { icon: Settings, label: "Configuração", color: "text-muted-foreground" },
  log: { icon: ScrollText, label: "Log", color: "text-status-warning" },
  data: { icon: Database, label: "Dados", color: "text-primary" },
  script: { icon: Code, label: "Script", color: "text-status-online" },
};

function FileRow({ file }: { file: FileEntry }) {
  const cfg = typeConfig[file.type] || typeConfig.document;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 rounded-lg border border-border/30 bg-card hover:bg-accent/15 transition-colors cursor-pointer group">
      <div className="w-9 h-9 rounded-lg bg-accent/5 border border-border/20 flex items-center justify-center shrink-0">
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-border/20 text-muted-foreground/40">{cfg.label}</span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/35 mt-0.5 truncate">
          {file.path}
          {file.agent && <span className="ml-2 text-muted-foreground/25">· {file.agent}</span>}
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground/30">{file.size}</span>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/30">
          <Clock className="h-3 w-3" />
          <span>{file.modifiedAgo}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
      </div>
    </div>
  );
}

interface FilesListProps {
  files: FileEntry[];
}

export function FilesList({ files }: FilesListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (files.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-5">
          <FolderOpen className="h-4 w-4 text-muted-foreground/40" />
          <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Explorador</h2>
          <div className="flex-1 h-px bg-border/40" />
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/30 bg-card">
          <Inbox className="h-6 w-6 text-muted-foreground/25 mb-3" />
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum arquivo registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const filtered = searchTerm
    ? files.filter((f) => {
        const q = searchTerm.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
      })
    : files;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <FolderOpen className="h-4 w-4 text-muted-foreground/40" />
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Explorador</h2>
        <div className="flex items-center gap-2 ml-1 px-2.5 py-0.5 rounded-full bg-primary/8 border border-primary/15">
          <span className="text-[10px] font-mono text-primary font-medium">{filtered.length} arquivos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 bg-card flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar arquivo..."
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none w-full"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {filtered.map((file) => (
          <FileRow key={file.id} file={file} />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground/40">Nenhum resultado para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </section>
  );
}
