// Files Domain — Fetchers (real-first + fallback-safe)
//
// Real API returns: [{ name, path, type: "file"|"folder", children? }]
// Transform maps flat tree to FileInfo canonical shape.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { FileInfo, FileEntry, FilesPageData, FilesSummaryData, FileType } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shape
// ═══════════════════════════════════════════════════════

interface RealFileEntry {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: RealFileEntry[];
}

/** Flatten tree into FileInfo[] */
function flattenFiles(entries: RealFileEntry[], result: FileInfo[] = []): FileInfo[] {
  for (const entry of entries) {
    result.push({
      name: entry.name,
      path: entry.path,
      kind: entry.type === "folder" ? "directory" : "file",
      sizeBytes: 0,
      mimeType: null,
      modifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      permissions: "644",
      owner: null,
      workspace: null,
    });
    if (entry.children) {
      flattenFiles(entry.children, result);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════
// Transforms — canonical → view
// ═══════════════════════════════════════════════════════

function deriveFileType(mime: string | null, name: string): FileType {
  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.includes("json") || mime.includes("csv") || mime.includes("sql")) return "data";
    if (mime.includes("javascript") || mime.includes("python") || mime.includes("typescript") || mime.includes("shell")) return "script";
    if (mime.includes("yaml") || mime.includes("toml") || mime.includes("xml")) return "config";
    if (mime.includes("log") || mime.includes("text/plain")) return "log";
  }
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const extMap: Record<string, FileType> = {
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
    json: "data", csv: "data", sql: "data", parquet: "data", xlsx: "data",
    js: "script", ts: "script", py: "script", sh: "script", bash: "script",
    yaml: "config", yml: "config", toml: "config", ini: "config", env: "config",
    log: "log", txt: "log",
    md: "document", pdf: "document", docx: "document", doc: "document",
  };
  return extMap[ext] || "document";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function toFileEntry(info: FileInfo, index: number): FileEntry {
  return {
    id: `${info.path}-${index}`,
    name: info.name,
    type: deriveFileType(info.mimeType, info.name),
    size: formatBytes(info.sizeBytes),
    modifiedAt: new Date(info.modifiedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    modifiedAgo: formatTimeAgo(info.modifiedAt),
    path: info.path,
    agent: info.workspace ?? undefined,
  };
}

function buildSummary(files: FileEntry[], rawFiles: FileInfo[]): FilesSummaryData {
  const totalBytes = rawFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
  const categories = new Set(files.map(f => f.type)).size;
  const lastMod = rawFiles.length > 0
    ? rawFiles.reduce((latest, f) => f.modifiedAt > latest ? f.modifiedAt : latest, rawFiles[0].modifiedAt)
    : null;

  return {
    totalFiles: files.length,
    totalSize: rawFiles.length > 0 ? formatBytes(totalBytes) : "—",
    lastModified: lastMod ? formatTimeAgo(lastMod) : "—",
    categories,
  };
}

// ═══════════════════════════════════════════════════════
// Fetcher
// ═══════════════════════════════════════════════════════

const EMPTY_FILES_PAGE: FilesPageData = {
  files: [],
  summary: { totalFiles: 0, totalSize: "—", lastModified: "—", categories: 0 },
};

export const fetchFilesPage: DomainFetcher<FilesPageData> = async (): Promise<DomainResult<FilesPageData>> => {
  const baseFetcher = createRealFirstFetcher<RealFileEntry[] | FileInfo[], FileInfo[]>({
    endpoint: "/files",
    fallbackData: [],
    transform: (raw) => {
      if (!Array.isArray(raw)) return [];
      // Detect real shape: has "type" field with "file"/"folder" values
      if (raw.length > 0 && raw[0] && "type" in raw[0] && (raw[0].type === "file" || raw[0].type === "folder")) {
        return flattenFiles(raw as RealFileEntry[]);
      }
      return raw as FileInfo[];
    },
  });

  const result = await baseFetcher();

  if (result.data.length === 0) {
    return { data: EMPTY_FILES_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const allFiles = result.data;
  const fileInfos = allFiles.filter(f => f.kind === "file");
  const dirInfos = allFiles.filter(f => f.kind === "directory");
  const files = fileInfos.map(toFileEntry);

  return {
    data: {
      files,
      summary: {
        ...buildSummary(files, fileInfos),
        totalFiles: fileInfos.length,
        categories: new Set([...files.map(f => f.type), ...(dirInfos.length > 0 ? ["folder" as FileType] : [])]).size,
      },
    },
    source: result.source,
    timestamp: result.timestamp,
  };
};
