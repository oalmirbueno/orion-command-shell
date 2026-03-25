import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function OrionTopBar({ title = "Comando" }: { title?: string }) {
  return (
    <header className="h-12 flex items-center justify-between border-b border-border/50 px-4 surface-1">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="w-px h-5 bg-border/50" />
        <h1 className="text-sm font-semibold tracking-wide text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md surface-2 border border-border/50 mr-3">
          <div className="status-dot status-online" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Sistemas Nominais
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md mr-2">
          <span className="text-[10px] font-mono text-muted-foreground">UPTIME</span>
          <span className="text-[10px] font-mono text-primary">99.97%</span>
        </div>

        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Search className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-status-warning" />
        </button>
      </div>
    </header>
  );
}
