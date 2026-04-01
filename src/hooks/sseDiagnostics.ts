/**
 * SSE Diagnostic Store — tracks stream status, recent events, and reconnect history.
 */

export type StreamStatus = "connecting" | "connected" | "disconnected" | "unsupported";

export interface SSEEvent {
  domain: string;
  timestamp: Date;
  size: number;
}

export interface ReconnectEntry {
  timestamp: Date;
  attempt: number;
  reason: string;
}

const MAX_EVENTS = 30;
const MAX_RECONNECTS = 20;

class SSEDiagnosticStore {
  private _status: StreamStatus = "disconnected";
  private _events: SSEEvent[] = [];
  private _connectedAt: Date | null = null;
  private _reconnects = 0;
  private _reconnectHistory: ReconnectEntry[] = [];
  private _lastError: string | null = null;
  private _lastErrorAt: Date | null = null;
  private listeners = new Set<() => void>();
  private _cachedSnapshot: ReturnType<SSEDiagnosticStore["_buildSnapshot"]> | null = null;

  get status() { return this._status; }
  get events() { return this._events; }
  get connectedAt() { return this._connectedAt; }
  get reconnects() { return this._reconnects; }
  get reconnectHistory() { return this._reconnectHistory; }
  get lastError() { return this._lastError; }
  get lastErrorAt() { return this._lastErrorAt; }

  /** Uptime in seconds since last connected, or null */
  get uptimeSeconds(): number | null {
    if (!this._connectedAt || this._status !== "connected") return null;
    return Math.round((Date.now() - this._connectedAt.getTime()) / 1000);
  }

  private emit() { for (const fn of this.listeners) fn(); }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  setStatus(s: StreamStatus) {
    const prev = this._status;
    this._status = s;
    if (s === "connected") this._connectedAt = new Date();
    if (s === "connecting" && prev === "disconnected" && this._connectedAt) {
      this._reconnects++;
      this._reconnectHistory = [
        { timestamp: new Date(), attempt: this._reconnects, reason: this._lastError || "disconnected" },
        ...this._reconnectHistory,
      ].slice(0, MAX_RECONNECTS);
    }
    this.emit();
  }

  recordError(message: string) {
    this._lastError = message;
    this._lastErrorAt = new Date();
    this.emit();
  }

  recordEvent(domain: string, dataSize: number) {
    this._events = [
      { domain, timestamp: new Date(), size: dataSize },
      ...this._events,
    ].slice(0, MAX_EVENTS);
    this.emit();
  }

  getSnapshot() {
    return {
      status: this._status,
      connectedAt: this._connectedAt,
      uptimeSeconds: this.uptimeSeconds,
      reconnects: this._reconnects,
      reconnectHistory: this._reconnectHistory,
      lastError: this._lastError,
      lastErrorAt: this._lastErrorAt,
      eventCount: this._events.length,
      events: this._events,
    };
  }
}

export const sseDiagnostics = new SSEDiagnosticStore();
