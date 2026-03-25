import { Bell, Search, Command } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function OrionTopBar({ title = "Comando" }: { title?: string }) {
  return (
    <header className="h-11 flex items-center justify-between border-b border-border/60 px-4 surface-1 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="w-px h-5 bg-border/40" />
        <h1 className="text-sm font-semibold tracking-wide text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* System status pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md surface-2 border border-border/50 mr-2">
          <div className="status-dot status-online" style={{ width: 6, height: 6 }} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Nominal
          </span>
        </div>

        {/* Uptime */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 mr-1">
          <span className="text-[10px] font-mono text-muted-foreground/50">UPTIME</span>
          <span className="text-[10px] font-mono text-primary font-medium">99.97%</span>
        </div>

        {/* Search shortcut */}
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors text-[10px] font-mono">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">⌘K</span>
        </button>

        {/* Notifications */}
        <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors relative">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-status-warning" />
        </button>
      </div>
    </header>
  );
}
