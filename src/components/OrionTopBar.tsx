import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
        {/* System status pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md surface-2 border border-border mr-2">
          <div className="status-dot bg-muted-foreground/30" style={{ width: 7, height: 7 }} />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Aguardando
          </span>
        </div>

        {/* Uptime */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 mr-1">
          <span className="text-xs font-mono text-muted-foreground/50">ATIVO</span>
          <span className="text-xs font-mono text-muted-foreground/40">—</span>
        </div>

        {/* Search shortcut */}
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors text-xs font-mono"
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">⌘K</span>
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-warning" />
        </button>
      </div>
    </header>
  );
}
