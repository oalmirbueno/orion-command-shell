/**
 * SSE Diagnostic Store — tracks stream status and recent events for Settings page.
 */

import type { DomainKey } from "./useDomainHealth";

export type StreamStatus = "connecting" | "connected" | "disconnected" | "unsupported";

export interface SSEEvent {
  domain: string;
  timestamp: Date;
  size: number; // bytes approx
}

const MAX_EVENTS = 30;

class SSEDiagnosticStore {
  private _status: StreamStatus = "disconnected";
  private _events: SSEEvent[] = [];
  private _connectedAt: Date | null = null;
  private _reconnects = 0;
  private listeners = new Set<() => void>();

  get status() { return this._status; }
  get events() { return this._events; }
  get connectedAt() { return this._connectedAt; }
  get reconnects() { return this._reconnects; }

  private emit() { for (const fn of this.listeners) fn(); }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  setStatus(s: StreamStatus) {
    this._status = s;
    if (s === "connected") this._connectedAt = new Date();
    if (s === "connecting" && this._connectedAt) this._reconnects++;
    this.emit();
  }

  recordEvent(domain: string, dataSize: number) {
    this._events = [
      { domain, timestamp: new Date(), size: dataSize },
      ...this._events,
    ].slice(0, MAX_EVENTS);
    this.emit();
  }
}

export const sseDiagnostics = new SSEDiagnosticStore();
