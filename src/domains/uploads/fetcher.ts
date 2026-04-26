/**
 * Uploads Domain — anexos por agente.
 *
 * Tenta múltiplos endpoints possíveis para listar e enviar arquivos:
 *   - GET  /api/agents/:id/uploads
 *   - GET  /api/uploads?agentId=:id
 *   - POST /api/agents/:id/uploads        (multipart/form-data, field "file")
 *   - POST /api/uploads                   (multipart/form-data, field "file" + agentId)
 *
 * Se nenhum endpoint responder, devolve estado "endpoint pendente" honesto.
 * Sem dados sintéticos, sem armazenamento client-side.
 */
import { apiUrl } from "@/domains/api";

export type UploadStatus = "uploaded" | "processing" | "failed" | "unknown";

export interface UploadItem {
  id: string;
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
  status: UploadStatus;
  uploadedAt: string | null;
  agentId: string | null;
  url: string | null;
}

export interface UploadsResult {
  items: UploadItem[];
  apiState: "available" | "pending" | "error";
  error?: string;
  endpoint?: string;
}

interface RawUpload {
  id?: string;
  name?: string;
  filename?: string;
  size?: number;
  sizeBytes?: number;
  mimeType?: string;
  contentType?: string;
  status?: string;
  uploadedAt?: string;
  createdAt?: string;
  agentId?: string;
  url?: string;
  href?: string;
}

function normalizeStatus(s?: string): UploadStatus {
  const v = (s || "").toLowerCase().trim();
  if (["uploaded", "ready", "available", "ok", "done"].includes(v)) return "uploaded";
  if (["processing", "indexing", "queued", "pending"].includes(v)) return "processing";
  if (["failed", "error", "rejected"].includes(v)) return "failed";
  return "unknown";
}

function normalize(raw: RawUpload, fallbackAgentId: string | null): UploadItem {
  return {
    id: raw.id || `${raw.name ?? raw.filename ?? "upload"}-${raw.uploadedAt ?? raw.createdAt ?? Date.now()}`,
    name: raw.name || raw.filename || "Sem nome",
    sizeBytes: typeof raw.sizeBytes === "number" ? raw.sizeBytes : typeof raw.size === "number" ? raw.size : null,
    mimeType: raw.mimeType || raw.contentType || null,
    status: normalizeStatus(raw.status),
    uploadedAt: raw.uploadedAt || raw.createdAt || null,
    agentId: raw.agentId ?? fallbackAgentId,
    url: raw.url || raw.href || null,
  };
}

async function tryGet(endpoint: string, agentId: string | null): Promise<{ items: UploadItem[]; httpStatus: number } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl(endpoint), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (res.status === 404) return null;
    if (!res.ok) return { items: [], httpStatus: res.status };
    const raw = await res.json();
    const arr: RawUpload[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { items: arr.map(r => normalize(r, agentId)), httpStatus: res.status };
  } catch {
    return null;
  }
}

export async function fetchAgentUploads(agentId: string): Promise<UploadsResult> {
  const candidates = [
    `/agents/${agentId}/uploads`,
    `/uploads?agentId=${encodeURIComponent(agentId)}`,
  ];
  for (const endpoint of candidates) {
    const result = await tryGet(endpoint, agentId);
    if (result) {
      return {
        items: result.items,
        apiState: result.httpStatus < 400 ? "available" : "error",
        endpoint,
        error: result.httpStatus >= 400 ? `HTTP ${result.httpStatus}` : undefined,
      };
    }
  }
  return { items: [], apiState: "pending", error: "Endpoint de uploads ainda não disponível no backend" };
}

export interface UploadAttempt {
  ok: boolean;
  item?: UploadItem;
  endpoint?: string;
  error?: string;
  httpStatus?: number;
}

async function tryPost(endpoint: string, formData: FormData, agentId: string | null): Promise<UploadAttempt | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(apiUrl(endpoint), {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (res.status === 404 || res.status === 405) return null;
    if (!res.ok) return { ok: false, endpoint, httpStatus: res.status, error: `HTTP ${res.status}` };
    const raw = await res.json().catch(() => ({}));
    const item = normalize(raw?.item || raw || {}, agentId);
    return { ok: true, item, endpoint, httpStatus: res.status };
  } catch (e) {
    return null;
  }
}

export async function uploadAgentFile(agentId: string, file: File): Promise<UploadAttempt> {
  const fd1 = new FormData();
  fd1.append("file", file);
  fd1.append("agentId", agentId);

  const candidates: Array<{ endpoint: string; form: FormData }> = [
    { endpoint: `/agents/${agentId}/uploads`, form: fd1 },
    { endpoint: `/uploads`, form: fd1 },
  ];

  for (const { endpoint, form } of candidates) {
    const result = await tryPost(endpoint, form, agentId);
    if (result) return result;
  }
  return { ok: false, error: "Nenhum endpoint de upload aceito pelo backend" };
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
