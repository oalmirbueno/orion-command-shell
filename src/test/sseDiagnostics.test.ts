import { describe, it, expect } from "vitest";
import { sseDiagnostics } from "@/hooks/sseDiagnostics";

describe("SSE Diagnostics", () => {
  it("starts disconnected", () => {
    expect(sseDiagnostics.status).toBe("disconnected");
  });

  it("records events and limits buffer", () => {
    for (let i = 0; i < 35; i++) {
      sseDiagnostics.recordEvent(`domain-${i}`, 100);
    }
    expect(sseDiagnostics.events.length).toBeLessThanOrEqual(30);
  });

  it("tracks status transitions", () => {
    sseDiagnostics.setStatus("connecting");
    expect(sseDiagnostics.status).toBe("connecting");

    sseDiagnostics.setStatus("connected");
    expect(sseDiagnostics.status).toBe("connected");
    expect(sseDiagnostics.connectedAt).toBeInstanceOf(Date);
  });

  it("tracks reconnects", () => {
    const before = sseDiagnostics.reconnects;
    sseDiagnostics.setStatus("disconnected");
    sseDiagnostics.setStatus("connecting"); // should count as reconnect
    expect(sseDiagnostics.reconnects).toBe(before + 1);
  });

  it("records errors", () => {
    sseDiagnostics.recordError("test error");
    expect(sseDiagnostics.lastError).toBe("test error");
    expect(sseDiagnostics.lastErrorAt).toBeInstanceOf(Date);
  });

  it("calculates uptime when connected", () => {
    sseDiagnostics.setStatus("connected");
    const snap = sseDiagnostics.getSnapshot();
    expect(snap.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("returns null uptime when disconnected", () => {
    sseDiagnostics.setStatus("disconnected");
    expect(sseDiagnostics.uptimeSeconds).toBeNull();
  });
});
