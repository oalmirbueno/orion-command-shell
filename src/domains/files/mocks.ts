import type { FilesPageData } from "./types";

export const FALLBACK_FILES_PAGE: FilesPageData = {
  files: [],
  summary: {
    totalFiles: 0,
    totalSize: "—",
    lastModified: "—",
    categories: 0,
  },
};
