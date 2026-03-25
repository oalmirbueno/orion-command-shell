import {
  Monitor,
  LayoutDashboard,
  Activity,
  Target,
  GitBranch,
  ClipboardList,
  Settings,
  Radio,
  Bot,
  Timer,
  Brain,
  Bell,
  Box,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const operationsItems = [
  { title: "Comando", url: "/", icon: LayoutDashboard },
  { title: "Missões", url: "/missions", icon: Target },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Sessões", url: "/sessions", icon: Activity },
  { title: "Operações", url: "/operations", icon: ClipboardList },
  { title: "Atividade", url: "/activity", icon: Radio },
  { title: "Memória", url: "/memory", icon: Brain },
];

const systemItems = [
  { title: "Sistema", url: "/system", icon: Monitor },
  { title: "Cron", url: "/cron", icon: Timer },
  { title: "Alertas", url: "/alerts", icon: Bell },
  { title: "Pipelines", url: "/pipelines", icon: GitBranch },
  { title: "Office 3D", url: "/office3d", icon: Box },
  { title: "Configurações", url: "/settings", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof operationsItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-mono px-3 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[12px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-primary/10 text-primary border-l-2 border-l-primary"
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function OrionSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/40">
        <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
          <span className="text-primary font-bold text-[11px] font-mono">O</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider text-foreground">ORION</span>
            <span className="text-[8px] text-muted-foreground/50 font-mono tracking-widest">MISSION CONTROL</span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-1">
        <NavGroup label="Operações" items={operationsItems} />
        <NavGroup label="Sistema" items={systemItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full surface-2 border border-border/40 flex items-center justify-center">
            <span className="text-[9px] font-mono text-muted-foreground/60">OP</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] text-foreground/80 font-medium">Operador</span>
              <span className="text-[8px] text-muted-foreground/40 font-mono">Nível 5</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
