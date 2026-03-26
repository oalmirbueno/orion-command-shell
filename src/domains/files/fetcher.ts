import { createRealFirstFetcher } from "../createRealFirstFetcher";
import { FALLBACK_FILES_PAGE } from "./mocks";
import type { FilesPageData } from "./types";
import type { DomainFetcher } from "../types";

export const fetchFilesPage: DomainFetcher<FilesPageData> = createRealFirstFetcher({
  endpoint: "/files",
  fallbackData: FALLBACK_FILES_PAGE,
});
