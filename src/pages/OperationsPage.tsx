import { useState } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { OperationsKanban } from "@/components/operations/OperationsKanban";
import { OperationsSections } from "@/components/operations/OperationsSections";
import { OperationsTimeline } from "@/components/operations/OperationsTimeline";
import { OperationDetailSheet } from "@/components/sheets/OperationDetailSheet";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchOperationsPage } from "@/domains/operations/fetcher";
import { OperationsSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { OperationsPageData } from "@/domains/operations/types.page";
import type { OperationTask } from "@/domains/operations/types";

const defaultSections = { running: [], completed: [], failed: [], overnight: [], upcoming: [] };

const OperationsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<OperationsPageData>({
    key: "operations-page",
    fetcher: fetchOperationsPage,
    refreshInterval: 15_000,
  });

  const [selectedTask, setSelectedTask] = useState<OperationTask | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleTaskClick = (task: OperationTask) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const pageData = data || { tasks: [], timeline: [], liveOps: [], sections: defaultSections };

  return (
    <OrionLayout title="Operações">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Operações"]} />
        <OrionDataWrapper
          state={state}
          source={source}
          lastUpdated={lastUpdated}
          onRetry={refetch}
          emptyTitle="Nenhuma operação em andamento"
          emptyDescription="Operações aparecerão aqui quando tarefas forem executadas"
          skeleton={<OperationsSkeleton />}
        >
          {/* Kanban — visão central do fluxo */}
          <OperationsKanban tasks={pageData.tasks} onTaskClick={handleTaskClick} />

          {/* Seções complementares */}
          <div className="mt-8">
            <OperationsSections sections={pageData.sections ?? defaultSections} />
          </div>

          {/* Timeline */}
          {pageData.timeline.length > 0 && (
            <div className="mt-8">
              <OperationsTimeline events={pageData.timeline} />
            </div>
          )}
        </OrionDataWrapper>
      </div>

      <OperationDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </OrionLayout>
  );
};

export default OperationsPage;
