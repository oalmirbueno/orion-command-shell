import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchRemindersPage } from "@/domains/reminders/fetcher";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, AlertCircle, Clock, CheckCircle2,
  ChevronRight, Timer, Zap, Terminal, Cpu, Bot,
  Newspaper, BookOpen, Info
} from "lucide-react";
import type { RemindersPageData, Reminder, NewsItem } from "@/domains/reminders/types";

// ── Summary Cards ──
function RemindersSummaryBar({ summary }: { summary: RemindersPageData["summary"] }) {
  const cards = [
    { label: "Total Lembretes", value: summary.totalReminders, icon: Bell, accent: "text-primary" },
    { label: "Pendentes", value: summary.pending, icon: Clock, accent: "text-status-warning" },
    { label: "Exige Ação", value: summary.overdue, icon: AlertCircle, accent: "text-status-critical" },
    { label: "Agendados", value: summary.upcoming, icon: Timer, accent: "text-primary/60" },
    { label: "Notícias", value: summary.totalNews, icon: Newspaper, accent: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border p-4 surface-1">
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`h-4 w-4 ${c.accent}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{c.label}</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${c.value > 0 ? c.accent : "text-muted-foreground/30"}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Status config ──
const statusConfig: Record<string, { dot: string; border: string; label: string; icon: React.ElementType }> = {
  overdue:  { dot: "bg-status-critical", border: "border-l-status-critical", label: "Exige Ação",  icon: AlertCircle },
  pending:  { dot: "bg-status-warning",  border: "border-l-status-warning",  label: "Pendente",    icon: Clock },
  upcoming: { dot: "bg-primary/50",       border: "border-l-primary/40",      label: "Agendado",    icon: Timer },
  done:     { dot: "bg-status-online",    border: "border-l-status-online",   label: "Concluído",   icon: CheckCircle2 },
};

const sourceIcons: Record<string, React.ElementType> = {
  alert: AlertTriangle, cron: Timer, operation: Zap,
  session: Terminal, system: Cpu, agent: Bot, memory: BookOpen,
};

const priorityConfig: Record<string, { dot: string; border: string }> = {
  critical: { dot: "bg-status-critical", border: "border-l-status-critical" },
  warning:  { dot: "bg-status-warning",  border: "border-l-status-warning" },
  success:  { dot: "bg-status-online",   border: "border-l-status-online" },
  info:     { dot: "bg-primary/50",       border: "border-l-primary/40" },
};

// ── Reminders List ──
function RemindersList({ reminders }: { reminders: Reminder[] }) {
  const navigate = useNavigate();

  if (reminders.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-status-online rounded-full" />
            <h2 className="orion-panel-title">Lembretes</h2>
          </div>
          <span className="text-xs font-mono text-status-online/60">Tudo em ordem</span>
        </div>
        <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-status-online/30" />
          <p className="text-sm font-mono text-muted-foreground/40">Nenhum lembrete pendente</p>
          <p className="text-[10px] text-muted-foreground/25">Quando houver alertas, falhas ou agendamentos, aparecerão aqui</p>
        </div>
      </section>
    );
  }

  // Group by status
  const grouped = {
    overdue: reminders.filter(r => r.status === "overdue"),
    pending: reminders.filter(r => r.status === "pending"),
    upcoming: reminders.filter(r => r.status === "upcoming"),
  };

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-0.5 rounded-full ${grouped.overdue.length > 0 ? "bg-status-critical" : grouped.pending.length > 0 ? "bg-status-warning" : "bg-primary/40"}`} />
          <h2 className="orion-panel-title">Lembretes</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground/50">{reminders.length} itens</span>
      </div>

      {(["overdue", "pending", "upcoming"] as const).map(status => {
        const items = grouped[status];
        if (items.length === 0) return null;
        const cfg = statusConfig[status];
        return (
          <div key={status}>
            <div className="px-5 py-2 surface-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{cfg.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground/30">({items.length})</span>
            </div>
            <div className="divide-y divide-border/20">
              {items.map((rem) => {
                const SrcIcon = sourceIcons[rem.source] || Info;
                return (
                  <div
                    key={rem.id}
                    className={`flex items-center gap-4 px-5 py-4 border-l-2 ${cfg.border} cursor-pointer hover:bg-accent/20 transition-colors group`}
                    onClick={() => navigate(rem.route)}
                  >
                    <SrcIcon className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{rem.title}</p>
                      <p className="text-[11px] font-mono text-muted-foreground/40 mt-0.5 truncate">{rem.detail}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono text-muted-foreground/30">{rem.timeAgo}</span>
                      <span className="text-[9px] font-mono uppercase text-muted-foreground/20">{rem.source}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ── News List ──
function NewsList({ items }: { items: NewsItem[] }) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
            <h2 className="orion-panel-title">Notícias Operacionais</h2>
          </div>
        </div>
        <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
          <Newspaper className="h-5 w-5 text-muted-foreground/20" />
          <p className="text-sm font-mono text-muted-foreground/40">Nenhuma notícia recente</p>
          <p className="text-[10px] text-muted-foreground/25">Eventos operacionais aparecerão conforme o sistema operar</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/activity")}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary/40 rounded-full" />
          <h2 className="orion-panel-title">Notícias Operacionais</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground/40">{items.length} registros</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      </div>
      <div className="divide-y divide-border/20">
        {items.map((item) => {
          const pcfg = priorityConfig[item.priority] || priorityConfig.info;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 px-5 py-4 border-l-2 ${pcfg.border} cursor-pointer hover:bg-accent/20 transition-colors group`}
              onClick={() => navigate(item.route)}
            >
              <div className="flex flex-col items-center pt-1 shrink-0">
                <span className="text-[11px] font-mono font-semibold text-primary/50">{item.timestamp}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${pcfg.dot}`} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/30">{item.category}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground/35 mt-1 truncate">{item.detail}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] font-mono text-muted-foreground/25">{item.timeAgo}</span>
                <span className="text-[9px] font-mono text-muted-foreground/20">{item.source}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-1" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ──
const RemindersPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<RemindersPageData>({
    key: "reminders-page",
    fetcher: fetchRemindersPage,
    refreshInterval: 30_000,
  });

  const reminders = data?.reminders ?? [];
  const news = data?.news ?? [];
  const summary = data?.summary ?? { totalReminders: 0, pending: 0, overdue: 0, upcoming: 0, totalNews: 0 };

  return (
    <OrionLayout title="Lembretes & Notícias">
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Lembretes & Notícias"]} />
        <OrionDataWrapper
          state={state}
          source={source}
          lastUpdated={lastUpdated}
          onRetry={refetch}
          emptyTitle="Nenhum lembrete ou notícia"
          emptyDescription="Quando houver alertas, agendamentos ou eventos operacionais, aparecerão aqui"
        >
          <RemindersSummaryBar summary={summary} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
            <RemindersList reminders={reminders} />
            <NewsList items={news} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default RemindersPage;
