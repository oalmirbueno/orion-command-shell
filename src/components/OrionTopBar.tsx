import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function OrionTopBar({ title = "Comando" }: { title?: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <header className="h-12 flex items-center justify-between border-b border-border px-5 surface-1 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="w-px h-5 bg-border" />
        <h1 className="text-sm font-semibold tracking-wide text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md surface-2 border border-border mr-2">
          <div className="status-dot bg-muted-foreground/30" style={{ width: 7, height: 7 }} />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Aguardando</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 mr-1">
          <span className="text-xs font-mono text-muted-foreground/50">ATIVO</span>
          <span className="text-xs font-mono text-muted-foreground/40">—</span>
        </div>

        <button onClick={() => navigate("/search")} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors text-xs font-mono">
          <Search className="h-4 w-4" /><span className="hidden md:inline">⌘K</span>
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-surface-2 border border-border text-[9px] font-mono text-muted-foreground/50 flex items-center justify-center px-1">0</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-card border-border p-4" align="end">
            <p className="text-sm font-semibold text-foreground mb-2">Notificações</p>
            <p className="text-xs text-muted-foreground/50">Em breve — notificações em tempo real aparecerão aqui</p>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
