// Files Domain — Tipos Canônicos
//
// Shape baseado nas rotas locais do OpenClaw (/api/files).

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type FileKind = "file" | "directory" | "symlink";

// /api/files — listagem de entradas no filesystem gerenciado
export interface FileInfo {
  name: string;
  path: string;
  kind: FileKind;
  sizeBytes: number;
  mimeType: string | null;
  modifiedAt: string;
  createdAt: string;
  permissions: string;
  owner: string | null;
  workspace: string | null;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type FileType = "document" | "image" | "config" | "log" | "data" | "script";

export interface FileEntry {
  id: string;
  name: string;
  type: FileType;
  size: string;
  modifiedAt: string;
  modifiedAgo: string;
  path: string;
  agent?: string;
}

export interface FilesSummaryData {
  totalFiles: number;
  totalSize: string;
  lastModified: string;
  categories: number;
}

export interface FilesPageData {
  files: FileEntry[];
  summary: FilesSummaryData;
}
