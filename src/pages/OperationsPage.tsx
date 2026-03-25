import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { OperationsKanban } from "@/components/operations/OperationsKanban";
import { OperationsTimeline } from "@/components/operations/OperationsTimeline";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchOperationTasks, fetchTimeline } from "@/domains/operations/fetcher";
import type { OperationTask, TimelineEvent } from "@/domains/operations/types";

const OperationsPage = () => {
  const tasks = useOrionData<OperationTask[]>({ key: "operations-tasks", fetcher: fetchOperationTasks });
  const timeline = useOrionData<TimelineEvent[]>({ key: "operations-timeline", fetcher: fetchTimeline });

  const allTasks = tasks.data || [];
  const allEvents = timeline.data || [];

  // Use worst state between the two fetches
  const combinedState = tasks.state === "error" || timeline.state === "error"
    ? "error"
    : tasks.state === "loading" || timeline.state === "loading"
      ? "loading"
      : tasks.state;

  return (
    <OrionLayout title="Operações">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Operações"]} />
        <OrionDataWrapper
          state={combinedState}
          source={tasks.source}
          lastUpdated={tasks.lastUpdated}
          onRetry={() => { tasks.refetch(); timeline.refetch(); }}
        >
          <OperationsKanban tasks={allTasks} />
          <div className="mt-8">
            <OperationsTimeline events={allEvents} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default OperationsPage;
