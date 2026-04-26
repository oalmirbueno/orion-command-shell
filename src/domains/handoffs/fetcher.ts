/**
 * Handoffs Domain — colaboração remota / passagem de tarefa entre agentes.
 *
 * Tenta múltiplos endpoints possíveis no backend (sem assumir um único path):
 *   - /api/handoffs
 *   - /api/agents/handoffs
 * Se nenhum responder, devolve estado "endpoint pendente" honestamente.
 *
 * Sem dados sintéticos. Sem JSON bruto exposto na UI.
 */
import { apiUrl } from "@/domains/api";

export type HandoffStatus = "pending" | "in_progress" | "accepted" | "rejected" | "completed" | "unknown";

export interface HandoffItem {
  id: string;
  task: string;
  context: string | null;
  fromAgentId: string | null;
  fromAgentName: string | null;
  toAgentId: string | null;
  toAgentName: string | null;
  acceptanceCriteria: string[];
  status: HandoffStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HandoffsResult {
  items: HandoffItem[];
  /** "available" = endpoint respondeu (mesmo vazio); "pending" = nenhum endpoint conhecido encontrado */
  apiState: "available" | "pending" | "error";
  error?: string;
  endpoint?: string;
}

const CANDIDATE_ENDPOINTS = ["/handoffs", "/agents/handoffs"];

interface RawHandoff {
  id?: string;
  task?: string;
  title?: string;
  description?: string;
  context?: string;
  contextSummary?: string;
  fromAgent?: string | { id?: string; name?: string };
  fromAgentId?: string;
  fromAgentName?: string;
  toAgent?: string | { id?: string; name?: string };
  toAgentId?: string;
  toAgentName?: string;
  acceptanceCriteria?: string[] | string;
  criteria?: string[] | string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function normalizeStatus(s?: string): HandoffStatus {
  const v = (s || "").toLowerCase().trim();
  if (["pending", "queued", "waiting"].includes(v)) return "pending";
  if (["in_progress", "in-progress", "working", "active"].includes(v)) return "in_progress";
  if (["accepted", "acked", "ack"].includes(v)) return "accepted";
  if (["rejected", "declined", "refused"].includes(v)) return "rejected";
  if (["done", "completed", "finished", "closed"].includes(v)) return "completed";
  return "unknown";
}

function normalizeAgentRef(ref: RawHandoff["fromAgent"], idField?: string, nameField?: string) {
  if (typeof ref === "string") return { id: ref, name: ref };
  if (ref && typeof ref === "object") {
    return { id: ref.id ?? null, name: ref.name ?? ref.id ?? null };
  }
  return { id: idField ?? null, name: nameField ?? idField ?? null };
}

function normalize(raw: RawHandoff): HandoffItem {
  const from = normalizeAgentRef(raw.fromAgent, raw.fromAgentId, raw.fromAgentName);
  const to = normalizeAgentRef(raw.toAgent, raw.toAgentId, raw.toAgentName);
  const criteriaRaw = raw.acceptanceCriteria ?? raw.criteria;
  const criteria = Array.isArray(criteriaRaw)
    ? criteriaRaw.filter(Boolean)
    : typeof criteriaRaw === "string" && criteriaRaw.trim()
      ? criteriaRaw.split(/\n|;/).map(s => s.trim()).filter(Boolean)
      : [];

  return {
    id: raw.id || `${from.id ?? "?"}→${to.id ?? "?"}-${raw.createdAt ?? Date.now()}`,
    task: raw.task || raw.title || raw.description || "Tarefa sem título",
    context: raw.context || raw.contextSummary || null,
    fromAgentId: from.id,
    fromAgentName: from.name,
    toAgentId: to.id,
    toAgentName: to.name,
    acceptanceCriteria: criteria,
    status: normalizeStatus(raw.status),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

async function tryEndpoint(endpoint: string): Promise<{ items: HandoffItem[]; httpStatus: number } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl(endpoint), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (res.status === 404) return null; // endpoint não existe → tenta próximo
    if (!res.ok) return { items: [], httpStatus: res.status };
    const raw = await res.json();
    const arr: RawHandoff[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { items: arr.map(normalize), httpStatus: res.status };
  } catch {
    return null;
  }
}

export async function fetchHandoffs(): Promise<HandoffsResult> {
  for (const endpoint of CANDIDATE_ENDPOINTS) {
    const result = await tryEndpoint(endpoint);
    if (result) {
      return {
        items: result.items,
        apiState: result.httpStatus < 400 ? "available" : "error",
        endpoint,
        error: result.httpStatus >= 400 ? `HTTP ${result.httpStatus}` : undefined,
      };
    }
  }
  return { items: [], apiState: "pending", error: "Nenhum endpoint de handoffs encontrado no backend" };
}

/** Filtra handoffs relacionados a um agente (origem ou destino). */
export function filterHandoffsByAgent(all: HandoffItem[], agentId: string): HandoffItem[] {
  return all.filter(h => h.fromAgentId === agentId || h.toAgentId === agentId);
}
