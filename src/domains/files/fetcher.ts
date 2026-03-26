import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { FilesPageData } from "./types";
import type { DomainFetcher } from "../types";

const EMPTY_FILES_PAGE: FilesPageData = {
  files: [],
  summary: {
    totalFiles: 0,
    totalSize: "—",
    lastModified: "—",
    categories: [],
  },
};

export const fetchFilesPage: DomainFetcher<FilesPageData> = createRealFirstFetcher({
  endpoint: "/files",
  fallbackData: EMPTY_FILES_PAGE,
});
