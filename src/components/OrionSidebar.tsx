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
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 font-mono px-4 mb-1">
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-primary/10 text-primary border-l-2 border-l-primary"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
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
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <span className="text-primary font-bold text-xs font-mono">O</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-foreground">ORION</span>
            <span className="text-[9px] text-muted-foreground/50 font-mono tracking-widest">MISSION CONTROL</span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        <NavGroup label="Operações" items={operationsItems} />
        <NavGroup label="Sistema" items={systemItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full surface-2 border border-border flex items-center justify-center">
            <span className="text-[10px] font-mono text-muted-foreground/60">OP</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm text-foreground/80 font-medium">Operador</span>
              <span className="text-[10px] text-muted-foreground/40 font-mono">Nível 5</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
