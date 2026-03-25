import {
  Monitor,
  LayoutDashboard,
  Activity,
  Target,
  GitBranch,
  Shield,
  Settings,
  Zap,
  Radio,
  Bot,
  Timer,
  Brain,
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
  { title: "Command", url: "/", icon: LayoutDashboard },
  { title: "Missions", url: "/missions", icon: Target },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Sessions", url: "/sessions", icon: Activity },
  { title: "Activity", url: "/activity", icon: Radio },
  { title: "Memory", url: "/memory", icon: Brain },
];

const systemItems = [
  { title: "System", url: "/system", icon: Monitor },
  { title: "Cron", url: "/cron", icon: Timer },
  { title: "Pipelines", url: "/pipelines", icon: GitBranch },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof operationsItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-mono">
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
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-primary/10 text-primary border-glow glow-primary-sm"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center glow-primary-sm">
          <span className="text-primary font-bold text-sm font-mono">O</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-foreground">ORION</span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-wider">MISSION CONTROL</span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        <NavGroup label="Operations" items={operationsItems} />
        <NavGroup label="System" items={systemItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <span className="text-[10px] font-mono text-muted-foreground">OP</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs text-foreground font-medium">Operador</span>
              <span className="text-[10px] text-muted-foreground font-mono">Level 5</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
