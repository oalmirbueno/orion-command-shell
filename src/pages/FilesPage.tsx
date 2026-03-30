import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchFilesPage } from "@/domains/files/fetcher";
import { FilesSummary } from "@/components/files/FilesSummary";
import { FilesList } from "@/components/files/FilesList";
import { FilesSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { FilesPageData } from "@/domains/files/types";

const FilesPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<FilesPageData>({
    key: "files-page",
    fetcher: fetchFilesPage,
    refreshInterval: 120_000,
  });

  const files = data?.files || [];
  const summary = data?.summary || null;

  return (
    <OrionLayout title="Arquivos">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Arquivos"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Nenhum arquivo encontrado" emptyDescription="Arquivos do workspace aparecerão aqui">
          {summary && <FilesSummary summary={summary} />}
          <FilesList files={files} />
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default FilesPage;
