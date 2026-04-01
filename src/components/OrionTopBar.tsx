import { Search, LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function OrionTopBar({ title = "Comando" }: { title?: string }) {
  const navigate = useNavigate();
  const { user, configured, signOut } = useAuth();
  const { profile } = useProfile();
  const displayLabel = profile?.display_name || user?.email?.split("@")[0] || user?.email || "";

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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

        <NotificationCenter />

        {/* Auth indicator */}
        {configured && user ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors">
                <User className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono hidden lg:inline max-w-[100px] truncate">{displayLabel}</span>
                <LogOut className="h-3 w-3 ml-1" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Sair — {user.email}</p>
            </TooltipContent>
          </Tooltip>
        ) : configured && !user ? (
          <button onClick={() => navigate("/login")} className="text-[10px] font-mono text-primary/70 hover:text-primary px-2 py-1.5 transition-colors">
            Login
          </button>
        ) : null}
      </div>
    </header>
  );
}
