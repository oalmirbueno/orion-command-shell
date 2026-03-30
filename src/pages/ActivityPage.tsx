import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { ActivitySummary } from "@/components/activity/ActivitySummary";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchActivityPage } from "@/domains/activity/fetcher";
import { ActivitySkeleton } from "@/components/skeletons/DomainSkeletons";
import type { ActivityPageData } from "@/domains/activity/types";

const ActivityPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<ActivityPageData>({
    key: "activity-page",
    fetcher: fetchActivityPage,
    refreshInterval: 60_000,
  });

  const pageData = data || { events: [], summary: { total: 0, critical: 0, warning: 0, resolved: 0 } };

  return (
    <OrionLayout title="Atividade">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Atividade"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Sem atividade recente" emptyDescription="Eventos aparecerão aqui quando houver atividade no sistema" skeleton={<ActivitySkeleton />}>
          <ActivitySummary summary={pageData.summary} />
          <div className="mt-8">
            <ActivityFeed events={pageData.events} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default ActivityPage;
