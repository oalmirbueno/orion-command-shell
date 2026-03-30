/**
 * Agent Profile Store — Mission Control Local Persistence
 *
 * Persists agent profile/config in localStorage as source of truth
 * when the OpenClaw backend doesn't support full profile endpoints.
 *
 * Strategy:
 *   1. Try API first (GET /api/agents/:id)
 *   2. If API returns rich data → use it, cache locally
 *   3. If API fails/returns sparse data → use local store
 *   4. PUT saves to API first, then always persists locally
 */

import { apiUrl } from "../api";
import type { AgentProfile, AgentView } from "./types";

const STORE_KEY = "orion:agent-profiles";

export type ProfileSource = "api" | "mission-control" | "bootstrap";

export interface ProfileResult {
  profile: AgentProfile;
  source: ProfileSource;
}

// ── Local storage helpers ──────────────────────────

function readAll(): Record<string, AgentProfile> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(profiles: Record<string, AgentProfile>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(profiles));
}

export function getLocal(id: string): AgentProfile | null {
  return readAll()[id] ?? null;
}

export function saveLocal(profile: AgentProfile) {
  const all = readAll();
  all[profile.id] = { ...profile };
  writeAll(all);
}

// ── Bootstrap: create initial profile from AgentView ──

function bootstrap(agent: AgentView): AgentProfile {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    description: "",
    soul: "",
    objective: "",
    personality: "",
    scope: "",
    behavior: "",
    instructions: "",
    operationalStatus: agent.status === "offline" ? "paused" : "active",
    scopeType: "global",
    topicIds: [],
    dmEnabled: true,
    groupEnabled: true,
  };
}

// ── Parse API response into AgentProfile ──

function parseApiResponse(d: any, agentId: string): AgentProfile {
  return {
    id: d.id || agentId,
    name: d.name || "",
    role: d.role || "",
    description: d.description || "",
    personality: d.personality || d.soul?.personality || "",
    objective: d.objective || d.soul?.objective || d.purpose || "",
    scope: d.scope || d.soul?.scope || "",
    behavior: d.behavior || d.soul?.behavior || "",
    soul: d.soul?.summary || d.soulSummary || d.identity || "",
    instructions: d.instructions || d.soul?.instructions || d.systemPrompt || "",
    operationalStatus: d.operationalStatus || undefined,
    scopeType: d.scopeType || undefined,
    topicIds: d.topicIds || undefined,
    dmEnabled: d.dmEnabled,
    groupEnabled: d.groupEnabled,
  };
}

function isRich(p: AgentProfile): boolean {
  return !!(p.soul || p.objective || p.personality || p.scope || p.behavior || p.instructions || p.description);
}

// ── Main fetch: API-first, local-fallback, bootstrap-last ──

export async function fetchAgentProfile(agent: AgentView): Promise<ProfileResult> {
  // 1. Try API
  try {
    const res = await fetch(apiUrl(`/agents/${agent.id}`));
    if (res.ok) {
      const data = await res.json();
      const apiProfile = parseApiResponse(data, agent.id);
      if (isRich(apiProfile)) {
        // Cache API data locally
        saveLocal(apiProfile);
        return { profile: apiProfile, source: "api" };
      }
    }
  } catch {
    // API unavailable, continue to local
  }

  // 2. Try local store
  const local = getLocal(agent.id);
  if (local) {
    // Merge fresh runtime fields from AgentView
    const merged: AgentProfile = {
      ...local,
      name: local.name || agent.name,
      role: local.role || agent.role,
    };
    return { profile: merged, source: "mission-control" };
  }

  // 3. Bootstrap
  const fresh = bootstrap(agent);
  saveLocal(fresh);
  return { profile: fresh, source: "bootstrap" };
}

// ── Save: try API, always persist locally ──

export interface SaveResult {
  success: boolean;
  source: ProfileSource;
  error?: string;
  mismatches?: string[];
}

export async function saveAgentProfile(agentId: string, profile: AgentProfile): Promise<SaveResult> {
  // Always persist locally first so data survives even if API fails
  saveLocal({ ...profile, id: agentId });

  // Try API save
  let apiReachable = false;
  try {
    const res = await fetch(apiUrl(`/agents/${agentId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.status === 404) {
      return { success: true, source: "mission-control" };
    }
    if (res.status === 405) {
      return { success: true, source: "mission-control" };
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { success: true, source: "mission-control", error: `API ${res.status}: ${errText} — salvo localmente` };
    }

    apiReachable = true;

    // Verify persistence
    const verifyRes = await fetch(apiUrl(`/agents/${agentId}`));
    if (!verifyRes.ok) {
      return { success: true, source: "mission-control", error: "API aceitou mas não confirmou — salvo localmente" };
    }

    const returned = await verifyRes.json();
    const mismatches: string[] = [];
    const check = (key: string, label: string) => {
      const sent = (profile as any)[key];
      const got = returned[key];
      if (sent !== undefined && got !== undefined && sent !== got) mismatches.push(label);
    };
    check("name", "nome");
    check("role", "função");
    check("scopeType", "escopo");
    check("operationalStatus", "status");
    check("dmEnabled", "DM");
    check("groupEnabled", "grupo");

    if (mismatches.length > 0) {
      return { success: true, source: "mission-control", mismatches };
    }

    // API confirmed — update local cache with returned data
    const confirmed = parseApiResponse(returned, agentId);
    saveLocal(confirmed);
    return { success: true, source: "api" };
  } catch {
    // Network error — local save is still valid
    return { success: true, source: "mission-control" };
  }
}
