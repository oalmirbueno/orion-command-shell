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
