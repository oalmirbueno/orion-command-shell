import { describe, it, expect, vi } from "vitest";

// Mock supabase module before importing the store
vi.mock("@/integrations/supabase/client", () => ({
  supabaseConfigured: false,
  supabase: null,
}));

// Must import after mock
const { notificationStore } = await import("@/services/notificationStore");

describe("NotificationStore", () => {
  it("starts in memory mode", () => {
    const snap = notificationStore.getSnapshot();
    expect(snap.mode).toBe("memory");
    expect(snap.readCount).toBe(0);
    expect(snap.dismissedCount).toBe(0);
  });

  it("initializes without Supabase in memory mode", async () => {
    await notificationStore.init(null);
    expect(notificationStore.mode).toBe("memory");
    expect(notificationStore.loaded).toBe(true);
  });

  it("marks notifications as read", async () => {
    await notificationStore.init(null);
    await notificationStore.markRead("test-1");
    expect(notificationStore.isRead("test-1")).toBe(true);
    expect(notificationStore.isRead("test-2")).toBe(false);
  });

  it("dismisses notifications", async () => {
    await notificationStore.init(null);
    await notificationStore.dismiss("test-3");
    expect(notificationStore.isDismissed("test-3")).toBe(true);
  });

  it("filters active notifications", async () => {
    await notificationStore.init(null);
    await notificationStore.dismiss("n-1");

    const notifs = [
      { id: "n-1", type: "alert" as const, severity: "critical" as const, title: "A", detail: "", source: "", timestamp: "", timeAgo: "", route: "/" },
      { id: "n-2", type: "alert" as const, severity: "info" as const, title: "B", detail: "", source: "", timestamp: "", timeAgo: "", route: "/" },
    ];

    const active = notificationStore.filterActive(notifs);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("n-2");
  });

  it("counts unread correctly", async () => {
    await notificationStore.init(null);
    await notificationStore.markRead("u-1");

    const notifs = [
      { id: "u-1", type: "alert" as const, severity: "info" as const, title: "A", detail: "", source: "", timestamp: "", timeAgo: "", route: "/" },
      { id: "u-2", type: "alert" as const, severity: "info" as const, title: "B", detail: "", source: "", timestamp: "", timeAgo: "", route: "/" },
    ];

    expect(notificationStore.countUnread(notifs)).toBe(1);
  });
});
