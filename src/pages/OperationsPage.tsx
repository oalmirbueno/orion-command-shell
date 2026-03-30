import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { OperationsKanban } from "@/components/operations/OperationsKanban";
import { OperationsTimeline } from "@/components/operations/OperationsTimeline";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchOperationsPage } from "@/domains/operations/fetcher";
import { OperationsSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { OperationsPageData } from "@/domains/operations/types.page";

const OperationsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<OperationsPageData>({
    key: "operations-page",
    fetcher: fetchOperationsPage,
    refreshInterval: 15_000,
  });

  const pageData = data || { tasks: [], timeline: [], liveOps: [] };

  return (
    <OrionLayout title="Operações">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Operações"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Nenhuma operação em andamento" emptyDescription="Operações aparecerão aqui quando tarefas forem executadas">
          <OperationsKanban tasks={pageData.tasks} />
          <div className="mt-8">
            <OperationsTimeline events={pageData.timeline} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default OperationsPage;
