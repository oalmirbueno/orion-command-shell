import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell, AlertTriangle, Clock, CheckCircle2,
  Bot, Terminal, Cpu, ChevronRight, Zap, X, Check, Eye
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import { notificationStore } from "@/services/notificationStore";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";

export type NotifType = "alert" | "cron" | "session" | "operation" | "builder" | "system" | "agent";
export type NotifSeverity = "critical" | "warning" | "success" | "info";

export interface OperationalNotification {
  id: string;
  type: NotifType;
  severity: NotifSeverity;
  title: string;
  detail: string;
  source: string;
  timestamp: string;
  timeAgo: string;
  route: string;
}

const typeConfig: Record<NotifType, { icon: React.ElementType; label: string }> = {
  alert:     { icon: AlertTriangle, label: "Alerta" },
  cron:      { icon: Clock,         label: "Cron" },
  session:   { icon: Terminal,      label: "Sessão" },
  operation: { icon: Zap,           label: "Operação" },
  builder:   { icon: Bot,           label: "Builder" },
  system:    { icon: Cpu,           label: "Sistema" },
  agent:     { icon: Bot,           label: "Agente" },
};

const severityStyles: Record<NotifSeverity, { dot: string; border: string }> = {
  critical: { dot: "bg-status-critical", border: "border-l-status-critical" },
  warning:  { dot: "bg-status-warning",  border: "border-l-status-warning" },
  success:  { dot: "bg-status-online",   border: "border-l-status-online" },
  info:     { dot: "bg-primary/50",       border: "border-l-primary/40" },
};

/**
 * Derives operational notifications from React Query cache.
 * No fake data — only real events from existing domain fetchers.
 */
function deriveNotifications(queryClient: ReturnType<typeof useQueryClient>): OperationalNotification[] {
  const notifications: OperationalNotification[] = [];
  let idx = 0;
  const nid = () => `notif-${++idx}`;

  const formatTimeAgo = (ts: string | number) => {
    const t = typeof ts === "number" ? ts : new Date(ts).getTime();
    if (isNaN(t)) return "—";
    const diff = Date.now() - t;
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.round(hrs / 24)}d`;
  };

  // ── From Activity events ──
  const activityCache = queryClient.getQueryData<any>(["orion", "activity-page"]);
  const activityEvents = activityCache?.data?.events || [];
  for (const e of activityEvents.slice(0, 8)) {
    const sev: NotifSeverity =
      e.priority === "critical" ? "critical" :
      e.priority === "warning" ? "warning" :
      e.priority === "success" ? "success" : "info";
    const type: NotifType =
      e.category === "session" ? "session" :
      e.category === "agent" ? "agent" :
      e.category === "system" ? "system" :
      e.category === "security" ? "alert" : "operation";
    notifications.push({
      id: nid(), type, severity: sev,
      title: e.title, detail: e.description || "—",
      source: e.source || "—",
      timestamp: e.time || "—", timeAgo: e.timeAgo || "—",
      route: type === "session" ? "/sessions" : type === "agent" ? "/agents" : type === "system" ? "/system" : "/activity",
    });
  }

  // ── From Alerts ──
  const alertsCache = queryClient.getQueryData<any>(["orion", "alerts-page"]);
  const alerts = alertsCache?.data?.alerts || [];
  for (const a of alerts.slice(0, 5)) {
    if (notifications.some(n => n.title === a.title)) continue;
    notifications.push({
      id: nid(), type: "alert",
      severity: a.severity === "critical" ? "critical" : "warning",
      title: a.title || a.message || "Alerta",
      detail: a.context || a.source || "—",
      source: a.source || "alerts",
      timestamp: a.timestamp || "—",
      timeAgo: a.timeAgo || formatTimeAgo(a.timestamp || ""),
      route: "/alerts",
    });
  }

  // ── From Cron ──
  const cronCache = queryClient.getQueryData<any>(["orion", "cron-page"]);
  const cronJobs = cronCache?.data?.jobs || [];
  for (const j of cronJobs) {
    if (j.status === "failed") {
      notifications.push({
        id: nid(), type: "cron", severity: "critical",
        title: `Cron "${j.name}" falhou`,
        detail: j.error || `${j.consecutiveFails} falhas consecutivas`,
        source: "cron", timestamp: j.lastRun || "—",
        timeAgo: j.lastRunAgo || "—", route: "/cron",
      });
    }
  }

  // ── From Sessions (failed/aborted) ──
  const sessionsCache = queryClient.getQueryData<any>(["orion", "sessions-page"]);
  const sessions = sessionsCache?.data || [];
  const sessionsList = Array.isArray(sessions) ? sessions : sessions?.sessions || [];
  for (const s of sessionsList.slice(0, 10)) {
    if (s.status === "failed" || s.aborted) {
      notifications.push({
        id: nid(), type: "session", severity: "warning",
        title: `Sessão ${s.typeLabel || s.type || ""} abortada`,
        detail: `${s.key || s.id || "—"} — ${s.tokens || 0} tokens`,
        source: s.model || "—",
        timestamp: s.startedAt || "—",
        timeAgo: s.elapsed || formatTimeAgo(s.startedAt || s.updatedAt || ""),
        route: "/sessions",
      });
    }
  }

  // ── From Operations ──
  const opsCache = queryClient.getQueryData<any>(["orion", "operations-page"]);
  const opsData = opsCache?.data;
  const failedOps = (opsData?.tasks || []).filter((t: any) => t.status === "failed" || t.status === "blocked");
  for (const op of failedOps.slice(0, 3)) {
    notifications.push({
      id: nid(), type: "operation", severity: "critical",
      title: `Operação "${op.title}" falhou`,
      detail: op.detail || op.source || "—",
      source: op.source || "operations",
      timestamp: op.time || "—", timeAgo: op.timeAgo || "—",
      route: "/operations",
    });
  }

  // ── From System ──
  const sysCache = queryClient.getQueryData<any>(["orion", "system-page"]);
  const sysHeader = sysCache?.data?.header;
  if (sysHeader?.overallStatus === "critical") {
    notifications.push({
      id: nid(), type: "system", severity: "critical",
      title: "Sistema em estado crítico",
      detail: `Host: ${sysHeader.host || "—"} | Uptime: ${sysHeader.uptime || "—"}`,
      source: "system", timestamp: sysHeader.lastCheck || "—",
      timeAgo: "Agora", route: "/system",
    });
  } else if (sysHeader?.overallStatus === "degraded") {
    notifications.push({
      id: nid(), type: "system", severity: "warning",
      title: "Sistema degradado",
      detail: `Host: ${sysHeader.host || "—"}`,
      source: "system", timestamp: sysHeader.lastCheck || "—",
      timeAgo: "Agora", route: "/system",
    });
  }

  // Sort: critical first, then warning
  const sevOrder: Record<NotifSeverity, number> = { critical: 0, warning: 1, success: 2, info: 3 };
  notifications.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  return notifications.slice(0, 20);
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  // Sync store with auth state
  useEffect(() => {
    notificationStore.init(user?.id ?? null);
  }, [user?.id]);

  // Subscribe to store changes
  const storeState = useSyncExternalStore(
    notificationStore.subscribe,
    () => notificationStore.getSnapshot()
  );

  const allNotifications = useMemo(
    () => (open ? deriveNotifications(queryClient) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, queryClient, storeState.readCount, storeState.dismissedCount]
  );

  const notifications = notificationStore.filterActive(allNotifications);
  const unreadCount = notificationStore.countUnread(notifications);
  const criticalCount = notifications.filter(n => n.severity === "critical" && !notificationStore.isRead(n.id)).length;

  const handleMarkAllRead = () => {
    const ids = notifications.map(n => n.id);
    notificationStore.markAllRead(ids);
    logAction("notification.mark_all_read", "notifications", "", { count: ids.length });
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationStore.dismiss(id);
  };

  const handleClick = (notif: OperationalNotification) => {
    notificationStore.markRead(notif.id);
    setOpen(false);
    navigate(notif.route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-status-critical text-[9px] font-mono text-primary-foreground flex items-center justify-center px-1 animate-pulse">
              {unreadCount}
            </span>
          ) : (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-surface-2 border border-border text-[9px] font-mono text-muted-foreground/50 flex items-center justify-center px-1">
              0
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-card border-border" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            {criticalCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-status-critical/10 text-status-critical">
                {criticalCount} crítico
              </span>
            )}
            {/* Persistence mode indicator */}
            <Tooltip>
              <TooltipTrigger>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground/40">
                  {storeState.mode === "supabase" ? "💾" : "⚡"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {storeState.mode === "supabase"
                    ? "Persistência ativa (Supabase)"
                    : "Modo memória — notificações reiniciam ao recarregar"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Eye className="h-3 w-3" /> Marcar lidas
              </button>
            )}
            <button
              onClick={() => { setOpen(false); navigate("/activity"); }}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              Ver tudo →
            </button>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-online/40" />
              <p className="text-xs font-mono text-muted-foreground/50">Nenhuma notificação pendente</p>
              <p className="text-[10px] text-muted-foreground/30">Operações em estado nominal</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => {
                const cfg = typeConfig[notif.type];
                const sev = severityStyles[notif.severity];
                const Icon = cfg.icon;
                const isRead = notificationStore.isRead(notif.id);
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-l-2 ${sev.border} cursor-pointer hover:bg-accent/20 transition-colors group ${isRead ? "opacity-60" : ""}`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className="mt-0.5 shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">{cfg.label}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                        {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/40 truncate mt-0.5">{notif.detail}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono text-muted-foreground/30">{notif.timeAgo}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDismiss(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent/40"
                          title="Dispensar"
                        >
                          <X className="h-3 w-3 text-muted-foreground/30 hover:text-muted-foreground" />
                        </button>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/30">
              {notifications.length} evento{notifications.length !== 1 ? "s" : ""}
              {storeState.dismissedCount > 0 && ` · ${storeState.dismissedCount} dispensada${storeState.dismissedCount !== 1 ? "s" : ""}`}
            </span>
            <button
              onClick={() => { setOpen(false); navigate("/timeline"); }}
              className="text-[10px] font-mono text-primary/60 hover:text-primary transition-colors"
            >
              Timeline completa →
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
