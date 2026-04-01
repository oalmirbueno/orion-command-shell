/**
 * Notification Store — Persistência híbrida (Supabase + in-memory fallback).
 *
 * Quando Supabase está configurado e o usuário autenticado:
 *   - persiste read/dismiss no banco
 *   - carrega histórico do banco
 *
 * Quando não configurado:
 *   - opera 100% em memória (session-only)
 *   - estado honesto, sem fingir persistência
 */

import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import type { OperationalNotification } from "@/components/notifications/NotificationCenter";

export type PersistenceMode = "supabase" | "memory";

interface NotificationState {
  readIds: Set<string>;
  dismissedIds: Set<string>;
}

interface StoreSnapshot {
  mode: PersistenceMode;
  loaded: boolean;
  readCount: number;
  dismissedCount: number;
}

class NotificationStore {
  private state: NotificationState = {
    readIds: new Set(),
    dismissedIds: new Set(),
  };
  private listeners = new Set<() => void>();
  private _mode: PersistenceMode = "memory";
  private _userId: string | null = null;
  private _loaded = false;
  private _snapshot: StoreSnapshot = { mode: "memory", loaded: false, readCount: 0, dismissedCount: 0 };

  get mode() { return this._mode; }
  get loaded() { return this._loaded; }

  private buildSnapshot(): StoreSnapshot {
    return {
      mode: this._mode,
      loaded: this._loaded,
      readCount: this.state.readIds.size,
      dismissedCount: this.state.dismissedIds.size,
    };
  }

  private emit() {
    this._snapshot = this.buildSnapshot();
    for (const fn of this.listeners) fn();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** Initialize with current user. Call on auth change. */
  async init(userId: string | null) {
    this._userId = userId;
    this._mode = supabaseConfigured && userId ? "supabase" : "memory";

    if (this._mode === "supabase" && supabase && userId) {
      try {
        const { data } = await supabase
          .from("notifications")
          .select("id, read, dismissed")
          .eq("user_id", userId)
          .or("read.eq.true,dismissed.eq.true");

        if (data) {
          this.state.readIds = new Set(data.filter(n => n.read).map(n => n.id));
          this.state.dismissedIds = new Set(data.filter(n => n.dismissed).map(n => n.id));
        }
      } catch {
        // Tabela pode não existir ainda — opera em memória
        this._mode = "memory";
      }
    }

    this._loaded = true;
    this.emit();
  }

  isRead(id: string): boolean {
    return this.state.readIds.has(id);
  }

  isDismissed(id: string): boolean {
    return this.state.dismissedIds.has(id);
  }

  async markRead(id: string) {
    this.state.readIds.add(id);
    this.emit();

    if (this._mode === "supabase" && supabase && this._userId) {
      try {
        await supabase
          .from("notifications")
          .upsert({
            id,
            user_id: this._userId,
            type: "info",
            severity: "info",
            title: "",
            read: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
      } catch { /* ignore */ }
    }
  }

  async markAllRead(ids: string[]) {
    for (const id of ids) this.state.readIds.add(id);
    this.emit();

    if (this._mode === "supabase" && supabase && this._userId) {
      const rows = ids.map(id => ({
        id,
        user_id: this._userId!,
        type: "info" as const,
        severity: "info" as const,
        title: "",
        read: true,
        updated_at: new Date().toISOString(),
      }));
      try {
        await supabase.from("notifications").upsert(rows, { onConflict: "id" });
      } catch { /* ignore */ }
    }
  }

  async dismiss(id: string) {
    this.state.dismissedIds.add(id);
    this.emit();

    if (this._mode === "supabase" && supabase && this._userId) {
      try {
        await supabase
          .from("notifications")
          .upsert({
            id,
            user_id: this._userId,
            type: "info",
            severity: "info",
            title: "",
            dismissed: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
      } catch { /* ignore */ }
    }
  }

  /** Filter out dismissed notifications */
  filterActive(notifications: OperationalNotification[]): OperationalNotification[] {
    return notifications.filter(n => !this.state.dismissedIds.has(n.id));
  }

  /** Count unread */
  countUnread(notifications: OperationalNotification[]): number {
    return notifications.filter(n => !this.state.readIds.has(n.id) && !this.state.dismissedIds.has(n.id)).length;
  }

  getSnapshot = () => this._snapshot;
}

export const notificationStore = new NotificationStore();
