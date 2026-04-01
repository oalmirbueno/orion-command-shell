// Reminders & News Domain — Tipos Canônicos
// Camada derivada: compõe lembretes e notícias a partir dos domínios existentes.

export type ReminderSource = "alert" | "cron" | "operation" | "session" | "system" | "memory" | "agent";
export type ReminderStatus = "pending" | "done" | "overdue" | "upcoming";
export type NewsPriority = "critical" | "warning" | "info" | "success";

export interface Reminder {
  id: string;
  title: string;
  detail: string;
  source: ReminderSource;
  status: ReminderStatus;
  timestamp: string;
  timeAgo: string;
  route: string;
}

export interface NewsItem {
  id: string;
  title: string;
  detail: string;
  source: string;
  priority: NewsPriority;
  category: string;
  timestamp: string;
  timeAgo: string;
  route: string;
}

export interface RemindersSummary {
  totalReminders: number;
  pending: number;
  overdue: number;
  upcoming: number;
  totalNews: number;
}

export interface RemindersPageData {
  reminders: Reminder[];
  news: NewsItem[];
  summary: RemindersSummary;
}
